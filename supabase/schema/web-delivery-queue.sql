alter table public.gp_web_orders add column event_seq bigint generated always as identity;
create unique index gp_web_orders_event_seq on public.gp_web_orders(event_seq);
create table public.gp_web_deliveries(
  order_id uuid primary key references public.gp_web_orders(id),
  customer_uid text not null references public.gp_web_customers(customer_uid),
  delivery jsonb not null,
  items jsonb not null,
  products_total numeric(14,2) not null check(products_total>=0),
  delivery_fee numeric(10,2) check(delivery_fee>=0 and delivery_fee<=10000),
  status text not null default 'recibido' check(status in ('recibido','en_proceso','listo','en_camino','entregado','cancelado')),
  estimated_at timestamptz,
  left_store_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gp_web_deliveries_customer on public.gp_web_deliveries(customer_uid,created_at desc);
create index gp_web_deliveries_status on public.gp_web_deliveries(status,created_at desc);
alter table public.gp_web_deliveries enable row level security;
revoke all on public.gp_web_deliveries from public,anon,authenticated;
grant select,insert,update on public.gp_web_deliveries to service_role;

create function public.gp_web_set_order_status(p_id uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare o public.gp_web_orders;
begin
  if p_status not in ('solicitado','confirmado','entregado','cancelado') then raise exception 'INVALID_STATUS'; end if;
  select * into o from public.gp_web_orders where id=p_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if p_status='solicitado' and exists(select 1 from public.gp_web_deliveries where order_id=p_id) then
    raise exception 'DELIVERY_ALREADY_CREATED';
  end if;
  if p_status in ('confirmado','entregado') then
    insert into public.gp_web_deliveries(order_id,customer_uid,delivery,items,products_total)
    values(o.id,o.customer_uid,o.delivery,o.items,o.total) on conflict(order_id) do nothing;
    if p_status='entregado' then
      update public.gp_web_deliveries set status='entregado',left_store_at=coalesce(left_store_at,now()),delivered_at=coalesce(delivered_at,now()),updated_at=now() where order_id=p_id;
    elsif o.status in ('cancelado','entregado') then
      update public.gp_web_deliveries set status='recibido',left_store_at=null,delivered_at=null,updated_at=now() where order_id=p_id;
    end if;
  elsif p_status='cancelado' then
    update public.gp_web_deliveries set status='cancelado',delivered_at=null,updated_at=now() where order_id=p_id;
  end if;
  update public.gp_web_orders set status=p_status,updated_at=now() where id=p_id returning * into o;
  return to_jsonb(o);
end;
$$;
create function public.gp_web_update_delivery(p_id uuid,p_status text,p_fee numeric,p_eta timestamptz)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare d public.gp_web_deliveries;
begin
  if p_status not in ('recibido','en_proceso','listo','en_camino','entregado','cancelado') or p_fee is null or p_fee<0 or p_fee>10000 then raise exception 'INVALID_DELIVERY'; end if;
  perform 1 from public.gp_web_orders where id=p_id for update;
  select * into d from public.gp_web_deliveries where order_id=p_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  update public.gp_web_deliveries set status=p_status,delivery_fee=p_fee,estimated_at=p_eta,
    left_store_at=case when p_status in ('en_camino','entregado') then coalesce(left_store_at,now()) when p_status='cancelado' then left_store_at else null end,
    delivered_at=case when p_status='entregado' then coalesce(delivered_at,now()) else null end,
    updated_at=now()
  where order_id=p_id returning * into d;
  update public.gp_web_orders set status=case when p_status='entregado' then 'entregado' when p_status='cancelado' then 'cancelado' else 'confirmado' end,updated_at=now() where id=p_id;
  return to_jsonb(d);
end;
$$;
revoke all on function public.gp_web_set_order_status(uuid,text),public.gp_web_update_delivery(uuid,text,numeric,timestamptz) from public,anon,authenticated;
grant execute on function public.gp_web_set_order_status(uuid,text),public.gp_web_update_delivery(uuid,text,numeric,timestamptz) to service_role;
-- Include earlier confirmed web orders in the same queue.
insert into public.gp_web_deliveries(order_id,customer_uid,delivery,items,products_total,status,left_store_at,delivered_at)
select id,customer_uid,delivery,items,total,
case when status='entregado' then 'entregado' else 'recibido' end,
case when status='entregado' then updated_at end,case when status='entregado' then updated_at end
from public.gp_web_orders where status in ('confirmado','entregado') on conflict(order_id) do nothing;

do $$
declare seq regclass:=pg_get_serial_sequence('public.gp_web_orders','event_seq')::regclass;
begin
  execute format('revoke all on sequence %s from public,anon,authenticated',seq);
  execute format('grant usage,select on sequence %s to service_role',seq);
end; $$;
