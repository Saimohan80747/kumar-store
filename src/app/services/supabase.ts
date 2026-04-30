import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Authentication features will not work until they are added to the .env file.');
}

/** Initialize central Supabase client instance */`n/** Initialize central Supabase client instance */
/** Initialize central Supabase client instance */
/** Initialize central Supabase client instance */
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Exported Supabase client configuration
