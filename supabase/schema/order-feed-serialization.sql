create or replace function public.gp_web_submit_order(p_uid text,p_email text,p_id uuid,p_delivery jsonb,p_items jsonb,p_total numeric)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  existing public.gp_web_orders;
  result public.gp_web_orders;
  offer public.gp_web_customer_offers;
  reduction numeric(14,2):=0;
  snapshot jsonb:='{}'::jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('gp_web_orders_feed',0));
  perform pg_advisory_xact_lock(hashtextextended(p_uid,0));
  select * into existing from public.gp_web_orders where id=p_id;
  if found then
    if existing.customer_uid<>p_uid or existing.delivery<>p_delivery or existing.items<>p_items or existing.subtotal<>p_total then
      raise exception 'ORDER_CONFLICT';
    end if;
    return to_jsonb(existing);
  end if;
  if (select count(*) from public.gp_web_orders where customer_uid=p_uid and created_at>now()-interval '1 day')>=100 then
    raise exception 'ORDER_LIMIT';
  end if;
  select * into offer from public.gp_web_customer_offers
    where customer_uid=p_uid and active and (expires_at is null or expires_at>now());
  if found then
    reduction:=least(p_total,case when offer.kind='percent' then round(p_total*offer.amount/100,2) else offer.amount end);
    snapshot:=jsonb_build_object('title',offer.title,'kind',offer.kind,'amount',offer.amount,'expires_at',offer.expires_at);
  end if;
  insert into public.gp_web_customers(customer_uid,email,recipient,phone,address,reference,payment)
  values(p_uid,p_email,p_delivery->>'recipient',p_delivery->>'phone',p_delivery->>'address',p_delivery->>'reference',p_delivery->>'payment')
  on conflict(customer_uid) do update set email=excluded.email,recipient=excluded.recipient,phone=excluded.phone,address=excluded.address,reference=excluded.reference,payment=excluded.payment,updated_at=now();
  insert into public.gp_web_orders(id,customer_uid,delivery,items,subtotal,discount_amount,total,offer_snapshot)
  values(p_id,p_uid,p_delivery,p_items,p_total,reduction,p_total-reduction,snapshot) returning * into result;
  return to_jsonb(result);
end;
$$;
revoke all on function public.gp_web_submit_order(text,text,uuid,jsonb,jsonb,numeric) from public,anon,authenticated;
grant execute on function public.gp_web_submit_order(text,text,uuid,jsonb,jsonb,numeric) to service_role;
