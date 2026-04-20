import { NextResponse } from 'next/server'
import { createClient } from '@/lib/infrastructure/supabase/server'

export const runtime = 'edge'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'))
}
