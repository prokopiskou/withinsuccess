// app/api/manychat-agent/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  supabaseAdmin,
  isWithinBusinessHours,
  hoursSince,
  sendManyChatMessage,
  setManyChatField,
  LANDING_PAGE_BASE
} from '@/lib/manychat-utils'
import { SYSTEM_PROMPT_63, SYSTEM_PROMPT_CONCIERGE } from '@/lib/prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ===================================================================
// MODEL CONFIG — Opus 4.7 για ποιότητα
// ===================================================================
const MODEL = 'claude-opus-4-7'
const MAX_TOKENS = 500

// ===================================================================
// HELPERS
// ===================================================================
function getCurrentPrice(): string {
  const now = new Date()
  const greece = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }))
  const day = greece.getDate()
  const month = greece.getMonth() + 1

  if (month === 4 && day <= 22) return '69'
  if ((month === 4 && day > 22) || (month === 5 && day <= 2)) return '89'
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

// FIXED: Πιο αυστηρό parsing — αν το JSON αποτύχει, δεν στέλνει link
function parseSendLink(reply: string) {
  if (!reply.includes('[SEND_LINK]')) {
    return { isSendLink: false as const }
  }
  
  const [before, after = ''] = reply.split('[SEND_LINK]')
  const prefixText = before.trim()
  const jsonPart = after.trim()
  
  try {
    const d = JSON.parse(jsonPart)
    // Validate required fields
    if (!d.headline || !d.subheadline) {
      console.error('[SEND_LINK] Missing required fields', d)
      return { isSendLink: false as const }
    }
    return {
      isSendLink: true as const,
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
    // Αν το JSON είναι invalid, ΔΕΝ στέλνουμε link
    // Καλύτερα ο χρήστης να πάρει κανονική απάντηση
    return { isSendLink: false as const }
  }
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
    // Expire conversations older than 48h
    if (hoursSince(conv.received_at) > 48) {
      await setManyChatField(conv.subscriber_id, 14485912, 'No')
      await supabaseAdmin
        .from('manychat_conversations')
        .update({ status: 'expired' })
        .eq('id', conv.id)
      continue
    }

    try {
      // Pick system prompt based on flow
      const basePrompt =
        conv.flow === 'concierge'
          ? SYSTEM_PROMPT_CONCIERGE
          : SYSTEM_PROMPT_63(getCurrentPrice())
      
      const systemPrompt = `${basePrompt}

ΠΑΡΟΝ: Η σωστή ώρα προσφώνησης τώρα είναι "${getGreeting()}". 
Χρησιμοποιείς αυτή μόνο αν είναι το πρώτο μήνυμά σου. 
Αν ο χρήστης σε χαιρετήσει διαφορετικά, ακολούθησέ τον.`

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

      // Check for HUMAN_NEEDED
      if (cleanReply.includes('[HUMAN_NEEDED]')) {
        const finalReply = cleanReply.replace('[HUMAN_NEEDED]', '').trim()
        await sendManyChatMessage(conv.subscriber_id, finalReply)
        await sendTelegramAlert(
          `👤 Ζητάει τον Προκόπη\n` +
          `Subscriber: ${conv.subscriber_id}\n` +
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

      // Score tracking (only goes up)
      const scoreRank: Record<string, number> = {
        cold: 0,
        curious: 1,
        interested: 2,
        ready: 3
      }
      const currentRank = scoreRank[conv.lead_score] ?? 0
      const newRank = scoreRank[score] ?? 0
      const finalScore = newRank >= currentRank ? score : conv.lead_score

      // Check for SEND_LINK
      const linkData = parseSendLink(cleanReply)

      if (linkData.isSendLink) {
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

      // Normal reply
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
      `Ώρες: ${Math.round(hoursSince(conv.link_clicked_at))}h\n\n` +
      `Πρότεινε: "Είδα ότι μπήκες στη σελίδα. Αν έχεις κάποια απορία, μου γράφεις."`
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
      `Subscriber: ${conv.subscriber_id}\n` +
      `Last message: ${conv.last_user_message}\n` +
      `Hours: ${Math.round(hoursSince(conv.checkout_started_at))}h`
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