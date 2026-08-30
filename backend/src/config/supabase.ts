import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

let supabaseInstance: SupabaseClient | null = null;

const createMockSupabase = (): SupabaseClient => {
  const mockBuilder = {
    select: () => mockBuilder,
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => mockBuilder,
    delete: () => mockBuilder,
    eq: () => mockBuilder,
    order: () => Promise.resolve({ data: [], error: null }),
    limit: () => mockBuilder,
    single: async () => ({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
    maybeSingle: async () => ({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };

  return {
    from: () => mockBuilder,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    removeChannel: async () => {},
  } as unknown as SupabaseClient;
};

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const env = getEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project') || url.includes('mock-supabase') || key.includes('mock-')) {
    if (env.NODE_ENV === 'development') {
      console.warn('Supabase not configured. Using mock client. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
      supabaseInstance = createMockSupabase();
      return supabaseInstance;
    }
    throw new Error('Supabase configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set');
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
};

export const setSupabaseClient = (client: SupabaseClient): void => {
  supabaseInstance = client;
};

export const resetSupabase = (): void => {
  supabaseInstance = null;
};
