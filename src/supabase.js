import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vnvvvjzikgigvhrehrga.supabase.co'
const supabaseKey = 'sb_publishable_j21yuiEbc7zf1o1fN52hlw_nnF386LW'

export const supabase = createClient(supabaseUrl, supabaseKey)