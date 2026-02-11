import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AppLayoutClient } from './layout-client';
import type { Profile } from '@/types/database';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile from Supabase for store hydration
  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let profile = data as Profile | null;

  // If no profile row exists, create one so onboarding can update it
  if (!profile && profileError?.code === 'PGRST116') {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({ id: user.id, onboarding_completed: false }, { onConflict: 'id' })
      .select()
      .single();
    profile = newProfile as Profile | null;
  }

  // Redirect to onboarding if user hasn't completed it
  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Fallback display name from auth metadata if profile doesn't have one
  const displayName = profile?.display_name
    ?? user.user_metadata?.display_name
    ?? user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? null;

  const serverProfile: Profile | null = profile
    ? { ...profile, display_name: profile.display_name ?? displayName }
    : null;

  return <AppLayoutClient serverProfile={serverProfile}>{children}</AppLayoutClient>;
}
