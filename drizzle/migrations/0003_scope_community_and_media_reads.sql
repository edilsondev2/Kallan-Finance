drop policy if exists "Profiles visible to signed-in users" on public.profiles;
create policy "Profiles visible unless blocked" on public.profiles for select to authenticated
  using (id = auth.uid() or not public.is_blocked_between(auth.uid(), id));

drop policy if exists "Follows visible" on public.follows;
create policy "Follows visible unless blocked" on public.follows for select to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid()
    or (not public.is_blocked_between(auth.uid(), follower_id) and not public.is_blocked_between(auth.uid(), following_id)));

drop policy if exists "Reactions visible" on public.post_reactions;
create policy "Reactions visible on visible posts" on public.post_reactions for select to authenticated
  using (user_id = auth.uid()
    or (not public.is_blocked_between(auth.uid(), user_id)
        and exists (select 1 from public.posts p where p.id = post_id)));

drop policy if exists "Signed-in users read media" on storage.objects;
create policy "Users read own or shared media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles pr where pr.avatar_url = name)
    or exists (select 1 from public.posts po where po.image_url = name)
    or exists (select 1 from public.businesses b where b.image_url = name)
    or exists (select 1 from public.events e where e.image_url = name)
  ));