import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wxsxsqfapoasmeixxkpa.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UG6nPGSPhrVTRHi1TnKw1Q_MYD1A939';

let client;

try {
  if (supabaseUrl && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {
  console.warn('Supabase initialization error, fallback activated:', e);
}

if (!client) {
  const dummyChain = {
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
    eq: function() { return this; },
    order: function() { return this; }
  };

  client = {
    from: () => dummyChain,
    channel: () => ({
      on: function() { return this; },
      subscribe: function() { return this; }
    }),
    removeChannel: () => {}
  };
}

export const supabase = client;
