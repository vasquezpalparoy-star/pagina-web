create or replace function public.gp_web_track_phone(p_phone text,p_bucket text) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare k text;cap integer;used integer;result jsonb;
begin
 if p_phone !~ '^9[0-9]{8}$' or p_bucket !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_TRACKING';end if;
 foreach k in array array['global','ip:'||p_bucket,'phone:'||encode(sha256(convert_to(p_phone,'UTF8')),'hex')] loop
  cap:=case when k='global' then 300 when left(k,3)='ip:' then 30 else 6 end;
  insert into public.gp_web_tracking_limits as limits(bucket,started_at,hits) values(k,now(),1)
  on conflict(bucket) do update set
   started_at=case when limits.started_at<=now()-interval '1 minute' then now() else limits.started_at end,
   hits=case when limits.started_at<=now()-interval '1 minute' then 1 else limits.hits+1 end
  where limits.started_at<=now()-interval '1 minute' or limits.hits<cap
  returning hits into used;
  if not found then return jsonb_build_object('limited',true);end if;
 end loop;
 delete from public.gp_web_tracking_limits where started_at<now()-interval '1 hour';
 select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]'::jsonb) into result from (
  select * from (
   select 'WEB-'||upper(right(o.id::text,6)) as reference,coalesce(d.status,o.status) as status,o.created_at,d.estimated_at
   from public.gp_web_orders o left join public.gp_web_deliveries d on d.order_id=o.id
   where public.gp_web_normalize_phone(o.delivery->>'phone')=p_phone and o.status in ('solicitado','confirmado') and (d.status is null or d.status not in ('entregado','cancelado'))
   union all
   select 'LOCAL-'||upper(right(tracking_id,6)),status,created_at,estimated_at
   from public.gp_web_manual_tracking where phone=p_phone and status not in ('entregado','cancelado')
  ) recent order by created_at desc limit 1
 ) t;
 return jsonb_build_object('orders',result,'limited',false);
end;
$$;
