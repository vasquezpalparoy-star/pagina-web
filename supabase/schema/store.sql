create table public.gp_web_customers (
  customer_uid text primary key check (length(customer_uid) between 1 and 128),
  email text not null check (length(email) <= 254),
  recipient text not null check (length(recipient) between 1 and 100),
  phone text not null check (length(phone) between 7 and 22),
  address text not null check (length(address) between 1 and 420),
  reference text not null default '' check (length(reference) <= 200),
  payment text not null check (payment in ('Efectivo','Yape','Plin','Transferencia')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.gp_web_orders (
  id uuid primary key,
  customer_uid text not null references public.gp_web_customers(customer_uid),
  delivery jsonb not null check (jsonb_typeof(delivery) = 'object'),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100),
  total numeric(14,2) not null check (total >= 0),
  status text not null default 'solicitado' check (status in ('solicitado','confirmado','entregado','cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gp_web_orders_customer_date on public.gp_web_orders(customer_uid,created_at desc,id);
create index gp_web_orders_date on public.gp_web_orders(created_at desc,id);
alter table public.gp_web_customers enable row level security;
alter table public.gp_web_orders enable row level security;
revoke all on public.gp_web_customers,public.gp_web_orders from public,anon,authenticated;
grant select,insert,update on public.gp_web_customers,public.gp_web_orders to service_role;

create function public.gp_web_submit_order(p_uid text,p_email text,p_id uuid,p_delivery jsonb,p_items jsonb,p_total numeric)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing public.gp_web_orders; result public.gp_web_orders;
begin
  -- Serialize submissions for one customer, including retries and concurrent tabs.
  perform pg_advisory_xact_lock(hashtextextended(p_uid,0));
  select * into existing from public.gp_web_orders where id=p_id;
  if found then
    if existing.customer_uid<>p_uid or existing.delivery<>p_delivery or existing.items<>p_items or existing.total<>p_total then
      raise exception 'ORDER_CONFLICT';
    end if;
    return to_jsonb(existing);
  end if;
  if (select count(*) from public.gp_web_orders where customer_uid=p_uid and created_at>now()-interval '1 day')>=100 then
    raise exception 'ORDER_LIMIT';
  end if;
  insert into public.gp_web_customers(customer_uid,email,recipient,phone,address,reference,payment)
  values(p_uid,p_email,p_delivery->>'recipient',p_delivery->>'phone',p_delivery->>'address',p_delivery->>'reference',p_delivery->>'payment')
  on conflict(customer_uid) do update set email=excluded.email,recipient=excluded.recipient,phone=excluded.phone,address=excluded.address,reference=excluded.reference,payment=excluded.payment,updated_at=now();
  insert into public.gp_web_orders(id,customer_uid,delivery,items,total) values(p_id,p_uid,p_delivery,p_items,p_total) returning * into result;
  return to_jsonb(result);
end;
$$;
revoke all on function public.gp_web_submit_order(text,text,uuid,jsonb,jsonb,numeric) from public,anon,authenticated;
grant execute on function public.gp_web_submit_order(text,text,uuid,jsonb,jsonb,numeric) to service_role;
