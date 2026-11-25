import { NextResponse } from 'next/server'
import { processFollowups } from '@/lib/igFlow'

export const dynamic = 'force-dynamic'

/**
 * Κάθε λεπτό (από Supabase pg_cron): στέλνει τα follow-up που έχουν έρθει η ώρα τους.
 * Χωρίς κλειδί: είναι ασφαλές να κληθεί από οποιονδήποτε, γιατί στέλνει μόνο ό,τι είναι ήδη
 * προγραμματισμένο και κάθε follow-up «κλειδώνεται» ώστε να φύγει μία φορά.
 */
export async function GET() {
  const r = await processFollowups()
  return NextResponse.json(r)
}
