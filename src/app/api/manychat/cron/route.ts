// app/api/manychat-agent/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  supabaseAdmin,
  isWithinBusinessHours,
  hoursSince,
  sendManyChatMessage,
  setManyChatField,
  getManyChatSubscriber,
  LANDING_PAGE_BASE
} from '@/lib/manychat-utils'
import { SYSTEM_PROMPT_63, SYSTEM_PROMPT_CONCIERGE } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ===================================================================
// MODEL CONFIG — Opus 4.7 για ποιότητα
// ===================================================================
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1000 // Αυξήθηκε από 500 για να μην κόβεται το JSON
const NAME_RESET_DAYS = 5

// ===================================================================
// HELPERS
// ===================================================================
function getCurrentPrice(): string {
  const now = new Date()
  const greece = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }))
  const day = greece.getDate()
  const month = greece.getMonth() + 1

  if (month === 4 && day <= 27) return '69'
  if ((month === 4 && day > 27) || (month === 5 && day <= 4)) return '89'
  return '109'
}

function getGreeting(): string {
  const greeceHour = (new Date().getUTCHours() + 3) % 24
  if (greeceHour < 12) return 'Καλημέρα'
  if (greeceHour < 17) return 'Γεια σου'
  return 'Καλησπέρα'
}

function parseScore(reply: string): { score: string; cleanReply: string } {
  const match = reply.match(/\[SCORE:(cold|curious|interested|ready)\]/)
  const score = match ? match[1] : 'curious'
  const cleanReply = reply.replace(/\[SCORE:\w+\]\s*/g, '').trim()
  return { score, cleanReply }
}

/**
 * Parse [SEND_LINK] block. 
 * Returns the structured data AND always returns a sanitized reply
 * with the [SEND_LINK] block and JSON REMOVED — never leak it to user.
 */
function parseSendLink(reply: string): {
  hasSendLink: boolean
  isValid: boolean
  prefixText: string
  painSummary?: string | null
  painKeywords?: string[] | null
  weekMatch?: number | null
  weekDescription?: string | null
  headline?: string
  subheadline?: string
  bullets?: string[] | null
} {
  if (!reply.includes('[SEND_LINK]')) {
    return { hasSendLink: false, isValid: false, prefixText: reply }
  }
  
  const [before, after = ''] = reply.split('[SEND_LINK]')
  const prefixText = before.trim()
  const jsonPart = after.trim()
  
  try {
    const d = JSON.parse(jsonPart)
    if (!d.headline || !d.subheadline) {
      console.error('[SEND_LINK] Missing required fields', d)
      return { hasSendLink: true, isValid: false, prefixText }
    }
    return {
      hasSendLink: true,
      isValid: true,
      prefixText,
      painSummary: d.pain_summary || null,
      painKeywords: d.pain_keywords || null,
      weekMatch: d.week_match || null,
      weekDescription: d.week_description || null,
      headline: d.headline,
      subheadline: d.subheadline,
      bullets: d.bullets || null
    }
  } catch (err) {
    console.error('[SEND_LINK] JSON parse failed:', err, jsonPart)
    return { hasSendLink: true, isValid: false, prefixText }
  }
}

/**
 * Αποφασίζει αν μπορούμε να χρησιμοποιήσουμε το όνομα του χρήστη.
 */
function shouldUseName(
  userFirstName: string | null,
  messages: any[],
  lastAnsweredAt: string | null
): boolean {
  if (!userFirstName) return false
  
  const nameAlreadyUsed = messages.some(
    (m: any) => 
      m.role === 'assistant' && 
      typeof m.content === 'string' && 
      m.content.includes(userFirstName)
  )
  
  if (!nameAlreadyUsed) return true
  
  if (lastAnsweredAt) {
    const daysSince = (Date.now() - new Date(lastAnsweredAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince >= NAME_RESET_DAYS) return true
  }
  
  return false
}

async function sendTelegramAlert(message: string) {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    )
  } catch (err) {
    console.error('Telegram alert failed:', err)
  }
}

// ===================================================================
// MAIN PROCESSING
// ===================================================================
async function processPending() {
  const { data: pending } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .eq('status', 'pending')

  if (!pending?.length) return { processed: 0 }
  
  let processed = 0

  for (const conv of pending) {
    if (hoursSince(conv.received_at) > 48) {
      await setManyChatField(conv.subscriber_id, 14485912, 'No')
      await supabaseAdmin
        .from('manychat_conversations')
        .update({ status: 'expired' })
        .eq('id', conv.id)
      continue
    }

    try {
      const subscriber = await getManyChatSubscriber(conv.subscriber_id)
      const userFirstName = subscriber.firstName
      const canUseName = shouldUseName(userFirstName, conv.messages, conv.answered_at)

      const basePrompt =
        conv.flow === 'concierge'
          ? SYSTEM_PROMPT_CONCIERGE
          : SYSTEM_PROMPT_63(getCurrentPrice())
      
      let nameInstructions = ''
      if (canUseName && userFirstName) {
        nameInstructions = `
ΟΝΟΜΑ ΧΡΗΣΤΗ: ${userFirstName}

ΚΑΝΟΝΑΣ ΧΡΗΣΗΣ ΟΝΟΜΑΤΟΣ — ΚΡΙΣΙΜΟ:
Το πρώτο μήνυμα της συνομιλίας στέλνεται αυτόματα από το ManyChat και ΔΕΝ έχει όνομα.
Εσύ γράφεις το δεύτερο μήνυμα του agent (την ΠΡΩΤΗ σου απάντηση).

Σε αυτή την πρώτη σου απάντηση, ΜΠΟΡΕΙΣ να χρησιμοποιήσεις το όνομα ${userFirstName} — ΜΙΑ ΦΟΡΑ, ΦΥΣΙΚΑ μέσα στην πρόταση.

ΑΠΑΓΟΡΕΥΕΤΑΙ σαν χαιρετισμός:
❌ "Γεια σου ${userFirstName}, ..."
❌ "${userFirstName}, καλώς ήρθες..."

ΕΠΙΤΡΕΠΕΤΑΙ μέσα στη ροή:
✅ "Αυτό που περιγράφεις, ${userFirstName}, είναι..."
✅ "${userFirstName}, είναι κάτι που..."
✅ "Το ακούω, ${userFirstName}. Τι είναι αυτό που..."

ΜΕΤΑ από αυτό το μήνυμα, ΠΟΤΕ ΞΑΝΑ το όνομα σε αυτή τη συζήτηση.`
      } else if (userFirstName && !canUseName) {
        nameInstructions = `
ΟΝΟΜΑ ΧΡΗΣΤΗ: ${userFirstName} — ΜΗ ΤΟ ΧΡΗΣΙΜΟΠΟΙΗΣΕΙΣ
Το έχεις ήδη χρησιμοποιήσει πρόσφατα σε αυτή τη συνομιλία.`
      }
      
      const systemPrompt = `${basePrompt}

ΠΑΡΟΝ: Η σωστή ώρα προσφώνησης τώρα είναι "${getGreeting()}". 
Χρησιμοποιείς αυτή μόνο αν είναι το πρώτο μήνυμά σου. 
Αν ο χρήστης σε χαιρετήσει διαφορετικά, ακολούθησέ τον.
${nameInstructions}

ΚΡΙΣΙΜΟ ΓΙΑ [SEND_LINK]:
Αν στέλνεις link, το JSON ΠΡΕΠΕΙ να είναι πλήρες και έγκυρο. 
Όλα τα strings κλείνουν με quotes. Όλα τα arrays κλείνουν με ].
Αν δεν μπορείς να γράψεις πλήρες JSON, ΜΗ χρησιμοποιήσεις καθόλου το [SEND_LINK] — απάντα κανονικά.`

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: conv.messages
      })

      const rawReply =
        response.content[0].type === 'text'
          ? response.content[0].text.trim()
          : ''
      
      if (!rawReply) {
        console.warn(`Empty reply for ${conv.subscriber_id}`)
        continue
      }

      const { score, cleanReply } = parseScore(rawReply)

      if (cleanReply.includes('[HUMAN_NEEDED]')) {
        const finalReply = cleanReply.replace('[HUMAN_NEEDED]', '').trim()
        await sendManyChatMessage(conv.subscriber_id, finalReply)
        await sendTelegramAlert(
          `👤 Ζητάει τον Προκόπη\n` +
          `Subscriber: ${conv.subscriber_id}\n` +
          `Όνομα: ${userFirstName || 'άγνωστο'}\n` +
          `Τελευταίο μήνυμα: ${conv.last_user_message}`
        )
        await supabaseAdmin
          .from('manychat_conversations')
          .update({
            messages: [...conv.messages, { role: 'assistant', content: finalReply }],
            answered_at: new Date().toISOString(),
            status: 'human_needed'
          })
          .eq('id', conv.id)
        processed++
        continue
      }

      const scoreRank: Record<string, number> = {
        cold: 0,
        curious: 1,
        interested: 2,
        ready: 3
      }
      const currentRank = scoreRank[conv.lead_score] ?? 0
      const newRank = scoreRank[score] ?? 0
      const finalScore = newRank >= currentRank ? score : conv.lead_score

      const linkData = parseSendLink(cleanReply)

      // CASE 1: Έγκυρο SEND_LINK → στέλνουμε personalized link
      if (linkData.hasSendLink && linkData.isValid) {
        const personalizedUrl = `${LANDING_PAGE_BASE}/63days?sid=${conv.subscriber_id}`
        const linkMessage =
          linkData.prefixText && linkData.prefixText.length > 0
            ? `${linkData.prefixText}\n\n${personalizedUrl}`
            : personalizedUrl

        await supabaseAdmin
          .from('manychat_conversations')
          .update({
            lead_score: finalScore,
            pain_summary: linkData.painSummary,
            pain_keywords: linkData.painKeywords,
            week_match: linkData.weekMatch,
            week_description: linkData.weekDescription,
            personalized_headline: linkData.headline,
            personalized_subheadline: linkData.subheadline,
            personalized_bullets: linkData.bullets,
            link_sent_at: new Date().toISOString(),
            messages: [...conv.messages, { role: 'assistant', content: linkMessage }],
            answered_at: new Date().toISOString(),
            status: 'link_sent'
          })
          .eq('id', conv.id)

        await sendManyChatMessage(conv.subscriber_id, linkMessage)
        processed++
        continue
      }

      // CASE 2: Invalid SEND_LINK → στείλε generic link χωρίς personalization
      // ΠΟΤΕ μη στέλνεις το raw JSON στον χρήστη
      if (linkData.hasSendLink && !linkData.isValid) {
        console.warn(`[SEND_LINK] Invalid JSON for ${conv.subscriber_id}, falling back to generic link`)
        
        const genericUrl = `${LANDING_PAGE_BASE}/63days?sid=${conv.subscriber_id}`
        const fallbackPrefix = linkData.prefixText || 'Εδώ μπορείς να δεις τα πάντα:'
        const fallbackMessage = `${fallbackPrefix}\n\n${genericUrl}`

        await sendTelegramAlert(
          `⚠️ Invalid SEND_LINK JSON\n` +
          `Subscriber: ${conv.subscriber_id}\n` +
          `Στάλθηκε generic link αντί personalized.`
        )

        await supabaseAdmin
          .from('manychat_conversations')
          .update({
            lead_score: finalScore,
            link_sent_at: new Date().toISOString(),
            messages: [...conv.messages, { role: 'assistant', content: fallbackMessage }],
            answered_at: new Date().toISOString(),
            status: 'link_sent'
          })
          .eq('id', conv.id)

        await sendManyChatMessage(conv.subscriber_id, fallbackMessage)
        processed++
        continue
      }

      // CASE 3: Normal reply (χωρίς SEND_LINK)
      const sent = await sendManyChatMessage(conv.subscriber_id, cleanReply)
      if (!sent) continue

      const preserveStatuses = ['link_sent', 'page_visited', 'checkout_started', 'paid']
      const newStatus = preserveStatuses.includes(conv.status) ? conv.status : 'answered'

      await supabaseAdmin
        .from('manychat_conversations')
        .update({
          lead_score: finalScore,
          messages: [...conv.messages, { role: 'assistant', content: cleanReply }],
          answered_at: new Date().toISOString(),
          status: newStatus
        })
        .eq('id', conv.id)

      processed++
    } catch (err) {
      console.error(`Error processing ${conv.subscriber_id}:`, err)
    }
  }
  
  return { processed }
}

// ===================================================================
// FOLLOW-UPS
// ===================================================================
async function followUpNoCheckout() {
  const { data: rows } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .eq('status', 'link_sent')
    .not('link_clicked_at', 'is', null)
    .is('checkout_started_at', null)
    .eq('followup_no_click_sent', false)

  if (!rows?.length) return { followups_no_checkout: 0 }
  
  let sent = 0

  for (const conv of rows) {
    if (hoursSince(conv.link_clicked_at) < 2) continue
    
    await sendTelegramAlert(
      `🔔 Άνοιξε τη σελίδα αλλά δεν πάτησε κατοχύρωσε\n` +
      `Subscriber: ${conv.subscriber_id}\n` +
      `Ώρες: ${Math.round(hoursSince(conv.link_clicked_at))}h`
    )
    
    await supabaseAdmin
      .from('manychat_conversations')
      .update({ followup_no_click_sent: true })
      .eq('id', conv.id)
    
    sent++
  }
  
  return { followups_no_checkout: sent }
}

async function followUpAbandonedCheckout() {
  const { data: rows } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .not('checkout_started_at', 'is', null)
    .is('payment_completed_at', null)
    .eq('followup_no_payment_sent', false)

  if (!rows?.length) return { followups_abandoned: 0 }
  
  let sent = 0

  for (const conv of rows) {
    if (hoursSince(conv.checkout_started_at) < 2) continue
    
    await sendTelegramAlert(
      `🔔 Abandoned checkout\n` +
      `Subscriber: ${conv.subscriber_id}`
    )
    
    const msg = 'Είδα ότι ξεκίνησες την κατοχύρωση. Αν υπήρξε κάποιο πρόβλημα, είμαι εδώ να το λύσουμε.'
    const ok = await sendManyChatMessage(conv.subscriber_id, msg)
    if (!ok) continue
    
    await supabaseAdmin
      .from('manychat_conversations')
      .update({
        followup_no_payment_sent: true,
        messages: [...conv.messages, { role: 'assistant', content: msg }]
      })
      .eq('id', conv.id)
    
    sent++
  }
  
  return { followups_abandoned: sent }
}

// ===================================================================
// CRON HANDLER
// ===================================================================
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!isWithinBusinessHours()) {
    return NextResponse.json({ skipped: 'outside business hours' })
  }

  const [a, b, c] = await Promise.all([
    processPending(),
    followUpNoCheckout(),
    followUpAbandonedCheckout()
  ])

  return NextResponse.json({ ...a, ...b, ...c })
}