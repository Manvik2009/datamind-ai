import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

let supabaseInstance: SupabaseClient | null = null;

const createMockSupabase = (): SupabaseClient => {
  let insertedData: Record<string, unknown> | null = null;

  const mockBuilder = {
    select: () => {
      if (insertedData) {
        return {
          single: async () => ({ data: insertedData, error: null }),
          then: (resolve: any) => resolve({ data: [insertedData], error: null }),
        };
      }
      return {
        single: async () => ({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      };
    },
    insert: (data: Record<string, unknown>) => {
      insertedData = { ...data, id: data.id || 'mock-id-' + Date.now() };
      return {
        select: () => ({
          single: async () => ({ data: insertedData, error: null }),
          then: (resolve: any) => resolve({ data: [insertedData], error: null }),
        }),
        then: (resolve: any) => resolve({ data: insertedData, error: null }),
      };
    },
    update: () => ({
      select: () => ({
        single: async () => ({ data: insertedData, error: null }),
        then: (resolve: any) => resolve({ data: [insertedData], error: null }),
      }),
      then: (resolve: any) => resolve({ data: insertedData, error: null }),
    }),
    delete: () => ({
      then: (resolve: any) => resolve({ data: null, error: null }),
    }),
    eq: () => ({
      single: async () => {
        if (insertedData) {
          return { data: insertedData, error: null };
        }
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      },
      then: (resolve: any) => resolve({ data: insertedData ? [insertedData] : [], error: null }),
    }),
    order: () => ({
      then: (resolve: any) => resolve({ data: insertedData ? [insertedData] : [], error: null }),
    }),
    limit: () => ({
      single: async () => {
        if (insertedData) {
          return { data: insertedData, error: null };
        }
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      },
      then: (resolve: any) => resolve({ data: insertedData ? [insertedData] : [], error: null }),
    }),
    maybeSingle: async () => {
      if (insertedData) {
        return { data: insertedData, error: null };
      }
      return { data: null, error: null };
    },
    then: (resolve: any) => resolve({ data: insertedData ? [insertedData] : [], error: null }),
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
