// Re-export SSR-aware Supabase clients
// Use these imports for all new code:
//   import { createClient } from '@/lib/supabase/client'   -- browser/client components
//   import { createServerClient } from '@/lib/supabase/server' -- server components & API routes
export { createClient as createBrowserClient } from '@/lib/supabase/client';
export { createServerClient as createSSRClient, createServerClient } from '@/lib/supabase/server';
