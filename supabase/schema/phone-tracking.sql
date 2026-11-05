create function public.gp_web_normalize_phone(value text) returns text
language sql immutable strict security invoker set search_path=public,pg_temp as $$
 select case when length(digits)=11 and left(digits,2)='51' then right(digits,9) else digits end
 from (select regexp_replace(value,'[^0-9]','','g') as digits) s;
$$;
create index gp_web_orders_phone on public.gp_web_orders(public.gp_web_normalize_phone(delivery->>'phone'),created_at desc);
create table public.gp_web_manual_tracking(
 tracking_id text primary key,
 phone text not null check(phone ~ '^9[0-9]{8}$'),
 status text not null check(status in ('recibido','en_proceso','listo','en_camino','entregado','cancelado')),
 created_at timestamptz not null default now(),estimated_at timestamptz,updated_at timestamptz not null default now()
);
create index gp_web_manual_tracking_phone on public.gp_web_manual_tracking(phone,created_at desc);
create table public.gp_web_tracking_limits(bucket text primary key,started_at timestamptz not null,hits integer not null);
alter table public.gp_web_manual_tracking enable row level security;
alter table public.gp_web_tracking_limits enable row level security;
revoke all on public.gp_web_manual_tracking,public.gp_web_tracking_limits from public,anon,authenticated;
grant select,insert,update,delete on public.gp_web_manual_tracking,public.gp_web_tracking_limits to service_role;
create function public.gp_web_sync_manual_tracking(p_rows jsonb) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare r jsonb;
begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>100 then raise exception 'INVALID_TRACKING';end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  if r->>'phone' is null then delete from public.gp_web_manual_tracking where tracking_id=r->>'id';
  else
   insert into public.gp_web_manual_tracking(tracking_id,phone,status,created_at,estimated_at)
   values(r->>'id',r->>'phone',r->>'status',coalesce((r->>'created_at')::timestamptz,now()),(r->>'estimated_at')::timestamptz)
   on conflict(tracking_id) do update set phone=excluded.phone,status=excluded.status,created_at=excluded.created_at,estimated_at=excluded.estimated_at,updated_at=now();
  end if;
 end loop;
end;
$$;
create function public.gp_web_track_phone(p_phone text,p_bucket text) returns jsonb
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
   where public.gp_web_normalize_phone(o.delivery->>'phone')=p_phone and o.created_at>now()-interval '90 days'
   union all
   select 'LOCAL-'||upper(right(tracking_id,6)),status,created_at,estimated_at
   from public.gp_web_manual_tracking where phone=p_phone and created_at>now()-interval '90 days'
  ) recent order by created_at desc limit 5
 ) t;
 return jsonb_build_object('orders',result,'limited',false);
end;
$$;
revoke all on function public.gp_web_normalize_phone(text),public.gp_web_sync_manual_tracking(jsonb),public.gp_web_track_phone(text,text) from public,anon,authenticated;
grant execute on function public.gp_web_normalize_phone(text),public.gp_web_sync_manual_tracking(jsonb),public.gp_web_track_phone(text,text) to service_role;
