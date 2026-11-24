import { NextResponse } from 'next/server'
import { listMedia } from '@/lib/igClient'

export const dynamic = 'force-dynamic'

/** Τα τελευταία posts/reels για να διαλέξεις σε ποιο τρέχει ο αυτοματισμός */
export async function GET() {
  try {
    const media = await listMedia(30)
    return NextResponse.json({
      media: media.map(m => ({
        id: m.id,
        caption: (m.caption || '').slice(0, 140),
        thumb: m.thumbnail_url || m.media_url || null,
        type: m.media_product_type === 'REELS' ? 'Reel' : m.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post',
        permalink: m.permalink,
        timestamp: m.timestamp,
      })),
    })
  } catch (e) {
    return NextResponse.json({ media: [], error: (e as Error).message.slice(0, 200) }, { status: 200 })
  }
}
