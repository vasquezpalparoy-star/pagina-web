create or replace function public.gp_web_set_order_status(p_id uuid,p_status text)
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
    insert into public.gp_web_deliveries(order_id,customer_uid,delivery,items,products_total,delivery_fee)
    values(o.id,o.customer_uid,o.delivery,o.items,o.total,case when o.delivery->>'deliveryOption'='fixed' then 3 else null end) on conflict(order_id) do nothing;
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
