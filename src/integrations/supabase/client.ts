// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qzfhewexzpbptxzobxno.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Zmhld2V4enBicHR4em9ieG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxOTQ0ODQsImV4cCI6MjA1Mjc3MDQ4NH0.1_R48zthxcQZd9Bd5KKeFDT_AVrqHU1CkEJq_7OzIao";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);