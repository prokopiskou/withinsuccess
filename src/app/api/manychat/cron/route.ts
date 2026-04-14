import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  supabaseAdmin,
  isWithinBusinessHours,
  hoursSince,
  sendManyChatMessage,
  LANDING_PAGE_BASE
} from '@/lib/manychat-utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function getGreeting(): string {
  const greeceHour = (new Date().getUTCHours() + 3) % 24
  if (greeceHour < 12) return 'Καλημέρα'
  if (greeceHour < 17) return 'Γεια σου'
  return 'Καλησπέρα'
}

const SYSTEM_PROMPT = `Είσαι ο Προκόπης. Μιλάς στον πρώτο ενικό. Δεν είσαι bot. Είσαι ο ίδιος ο Προκόπης που απαντά προσωπικά.

Τόνος: χαλαρός αλλά σίγουρος. Σαν να μιλάς σε κάποιον που σου έστειλε μήνυμα. Καμία υπερβολή. Καμία ποιητική αδεία. Συγκεκριμένα πράγματα. Σύντομες προτάσεις.

Δεν προσπαθείς να πείσεις κανέναν. Δεν είσαι needy. Κάνεις μια κουβέντα και βοηθάς.

ΠΡΩΤΟ ΒΗΜΑ — ΑΞΙΟΛΟΓΗΣΗ
Με βάση κάθε μήνυμα του χρήστη, κατάταξέ τον:
- cold → αδιάφορος, γράφει τυχαία ή μονολεκτικά χωρίς ουσία
- curious → ρωτάει τι είναι το πρόγραμμα ή δείχνει ελαφριά περιέργεια
- interested → μοιράζεται κάτι προσωπικό, δείχνει πόνο ή ανάγκη
- ready → λέει ξεκάθαρα ότι θέλει αλλαγή ή ζητά πώς να ξεκινήσει

Βάλε στην αρχή ΚΑΘΕ απάντησης:
[SCORE:cold] ή [SCORE:curious] ή [SCORE:interested] ή [SCORE:ready]

Score μόνο ανεβαίνει, ποτέ δεν κατεβαίνει.

ΠΡΩΤΟ ΜΗΝΥΜΑ (ήδη σταλμένο αυτόματα από ManyChat):
"${getGreeting()}, έλαβα το 63 σου και θα ήθελα για αρχή να σε ρωτήσω — τι είναι αυτό που θα ήθελες να αλλάξεις μέσα από το πρόγραμμα;"

ΦΑΣΗ 2 — REAFFIRM + ΕΜΒΑΘΥΝΣΗ
Όταν απαντήσει:
1. Επιβεβαίωσε με τις δικές του λέξεις — δείξε ότι τον άκουσες.
2. Ρώτησε κάτι συγκεκριμένο, ένα βήμα βαθύτερα.

Χωρίς "καταλαβαίνω", "φυσικά", "σε ακούω". Κατευθείαν στο πράγμα.

Παράδειγμα:
Χρήστης: "Νιώθω ότι δεν κάνω τίποτα για μένα"
Εσύ: "[SCORE:interested] Τίποτα για σένα. Από πότε το νιώθεις αυτό;"

ΦΑΣΗ 3 — ΣΥΝΔΕΣΗ ΜΕ ΤΟ ΠΡΟΓΡΑΜΜΑ
Μόνο όταν έχεις αρκετό context. Πες κάτι σαν:
"Αυτό ακριβώς δουλεύουμε στην εβδομάδα [αριθμός]. [Μία πρόταση τι γίνεται]."

Να φαίνεται σαν φυσική συνέχεια της κουβέντας, όχι σαν pitch.

ΧΑΡΤΗΣ ΕΒΔΟΜΑΔΩΝ:
1 → Η πρώτη σκέψη λέει "όχι" — μαθαίνεις να εκτελείς παρόλα αυτά
2 → Σιωπή, ηρεμία σώματος, καθαρό μυαλό
3 → Ο τρόπος που μιλάς στον εαυτό σου
4 → Μικρές πράξεις θάρρους — σπάς τον φόβο με κίνηση
5 → Αυτοπεποίθηση μέσα από υποσχέσεις που τηρείς
6 → Ενέργεια — ύπνος, κίνηση, τροφή
7 → Σχέσεις και όρια — λες "όχι" χωρίς δικαιολογία
8 → Αναβλητικότητα — ξεκινάς πριν νιώσεις έτοιμος
9 → Όραμα — χαράσσεις πορεία με σκοπό

ΦΑΣΗ 4 — SOFT CLOSE
Μόνο αν ο χρήστης δείχνει ενδιαφέρον. Κάτι σαν:
"Αν θες σου στέλνω τη σελίδα να δεις τι περιλαμβάνει."

Χαλαρά. Χωρίς πίεση. Σαν να προτείνεις κάτι σε φίλο.

ΦΑΣΗ 5 — ΑΠΟΣΤΟΛΗ LINK
Όταν ο χρήστης πει ναι, γράψε ΑΚΡΙΒΩΣ αυτό (JSON):

[SEND_LINK]
{"pain_summary":"[1-2 προτάσεις στις λέξεις του χρήστη]","pain_keywords":["keyword1","keyword2","keyword3"],"week_match":[1-9],"week_description":"[τι γίνεται εκείνη την εβδομάδα]","headline":"[headline που περιγράφει τον πόνο σαν αλήθεια χωρίς να φαίνεται personalized]","subheadline":"[1 πρόταση — τι αλλάζει]","bullets":["[πράξη]","[πώς αντιμετωπίζεται]","[τι αλλάζει]"]}

ΣΗΜΑΝΤΙΚΟ:
- Ο headline πρέπει να φαίνεται generic αλλά να χτυπάει ακριβώς τον πόνο του
- Δεν γράφεις "αυτό που μου είπες" — γράφεις σαν copy που τυχαίνει να τον αφορά
- Χρησιμοποίησε τις λέξεις του αλλά ενσωματωμένες φυσικά

ΦΑΣΗ 6 — ΜΕΤΑ ΤΟ LINK
Συνεχίζεις κανονικά αν ρωτήσει κάτι. Δεν ξαναστέλνεις link.

ΦΑΣΗ 7 — OBJECTION HANDLING
Αν έχει αμφιβολία, ρώτα: "Τι σε προβληματίζει;"
Άκου την απάντηση. Απάντησε στο συγκεκριμένο. Χωρίς πίεση.
Αν δεν θέλει, σεβάσου το. "Οκ, αν αλλάξεις γνώμη ξέρεις πού με βρίσκεις."

ΚΑΝΟΝΕΣ:
- Ποτέ: "transformation", "journey", "glow up", "level up", "δυνατή", "φως μέσα σου"
- Ποτέ εμότζι
- Μία σκέψη, μία πρόταση
- Ποτέ "αγόρασε" — πάντα "κατοχύρωσε"
- Ποτέ follow-up ή υπενθύμιση μέσα στη συζήτηση
- Αν ο χρήστης είναι cold: μία ερώτηση ακόμα, μετά "Οκ, αν χρειαστείς κάτι είμαι εδώ."
- Αν ρωτήσει "ποιος μου γράφει": "Ο Προκόπης."
- Κράτα μηνύματα κάτω από 300 χαρακτήρες. Αυτό είναι DM, όχι email.
- Μίλα σαν άνθρωπος. Αν κάτι ακούγεται σαν bot, άλλαξέ το.`

function getHumanDelayMs(): number {
  const min = 5, max = 15
  return (Math.floor(Math.random() * (max - min + 1)) + min) * 60 * 1000
}

function hasDelayPassed(receivedAt: string, delayMs: number): boolean {
  return Date.now() - new Date(receivedAt).getTime() >= delayMs
}

function parseScore(aiReply: string): { score: string; cleanReply: string } {
  const scoreMatch = aiReply.match(/\[SCORE:(cold|curious|interested|ready)\]/)
  const score = scoreMatch ? scoreMatch[1] : 'curious'
  const cleanReply = aiReply.replace(/\[SCORE:\w+\]\s*/g, '').trim()
  return { score, cleanReply }
}

function parseSendLink(reply: string) {
  if (!reply.includes('[SEND_LINK]')) return { isSendLink: false }
  try {
    const jsonPart = reply.split('[SEND_LINK]')[1].trim()
    const d = JSON.parse(jsonPart)
    return {
      isSendLink: true,
      painSummary: d.pain_summary,
      painKeywords: d.pain_keywords,
      weekMatch: d.week_match,
      weekDescription: d.week_description,
      headline: d.headline,
      subheadline: d.subheadline,
      bullets: d.bullets
    }
  } catch {
    return { isSendLink: true }
  }
}

async function processPending() {
  const { data: pending } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .eq('status', 'pending')

  if (!pending?.length) return { processed: 0 }
  let processed = 0

  for (const conv of pending) {
    if (!hasDelayPassed(conv.received_at, getHumanDelayMs())) continue

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: conv.messages
      })

      const rawReply = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : ''
      if (!rawReply) continue

      const { score, cleanReply } = parseScore(rawReply)
      const linkData = parseSendLink(cleanReply)

      const scoreRank: Record<string, number> = { cold: 0, curious: 1, interested: 2, ready: 3 }
      const currentRank = scoreRank[conv.lead_score] ?? 0
      const newRank = scoreRank[score] ?? 0
      const finalScore = newRank >= currentRank ? score : conv.lead_score

      if (linkData.isSendLink) {
        const personalizedUrl = `${LANDING_PAGE_BASE}/63days?sid=${conv.subscriber_id}`

        await supabaseAdmin
          .from('manychat_conversations')
          .update({
            lead_score: finalScore,
            pain_summary: linkData.painSummary || null,
            pain_keywords: linkData.painKeywords || null,
            week_match: linkData.weekMatch || null,
            week_description: linkData.weekDescription || null,
            personalized_headline: linkData.headline || null,
            personalized_subheadline: linkData.subheadline || null,
            personalized_bullets: linkData.bullets || null,
            link_sent_at: new Date().toISOString(),
            messages: [...conv.messages, { role: 'assistant', content: '[Sent personalized link]' }],
            answered_at: new Date().toISOString(),
            status: 'link_sent'
          })
          .eq('id', conv.id)

        await sendManyChatMessage(conv.subscriber_id, personalizedUrl)
        processed++
      } else {
        const sent = await sendManyChatMessage(conv.subscriber_id, cleanReply)
        if (!sent) continue

        await supabaseAdmin
          .from('manychat_conversations')
          .update({
            lead_score: finalScore,
            messages: [...conv.messages, { role: 'assistant', content: cleanReply }],
            answered_at: new Date().toISOString(),
            status: 'answered'
          })
          .eq('id', conv.id)

        processed++
      }
    } catch (err) {
      console.error(`Error processing ${conv.subscriber_id}:`, err)
    }
  }
  return { processed }
}

async function followUpNoClick() {
  const { data: rows } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .eq('status', 'link_sent')
    .is('link_clicked_at', null)
    .eq('followup_no_click_sent', false)
    .not('link_sent_at', 'is', null)

  if (!rows?.length) return { followups_no_click: 0 }
  let sent = 0

  for (const conv of rows) {
    if (hoursSince(conv.link_sent_at) < 5) continue
    const msg = 'Αν κάτι δεν είναι σαφές για το πρόγραμμα, οποιαδήποτε στιγμή μου γράφεις.'
    const ok = await sendManyChatMessage(conv.subscriber_id, msg)
    if (!ok) continue
    await supabaseAdmin
      .from('manychat_conversations')
      .update({
        followup_no_click_sent: true,
        messages: [...conv.messages, { role: 'assistant', content: msg }]
      })
      .eq('id', conv.id)
    sent++
  }
  return { followups_no_click: sent }
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
    followUpNoClick(),
    followUpAbandonedCheckout()
  ])

  return NextResponse.json({ ...a, ...b, ...c })
}