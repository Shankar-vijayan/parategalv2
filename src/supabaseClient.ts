import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lblczomeozfpjoboekci.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibGN6b21lb3pmcGpvYm9la2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDA0NzUsImV4cCI6MjA2MzkxNjQ3NX0.ljyJ9URgrRT-xFB7RHArlih8vQ5VCDvCDpBa2r-knbs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
