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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function getGreeting(): string {
  const greeceHour = (new Date().getUTCHours() + 3) % 24
  if (greeceHour < 12) return 'Καλημέρα'
  if (greeceHour < 17) return 'Γεια σου'
  return 'Καλησπέρα'
}

function getCurrentPrice(): string {
  const now = new Date()
  const greece = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }))
  const day = greece.getDate()
  const month = greece.getMonth() + 1

  if (month === 4 && day <= 22) return '69'
  if ((month === 4 && day > 22) || (month === 5 && day <= 2)) return '89'
  if (month === 5 && day <= 8) return '109'
  return '109'
}

const SYSTEM_PROMPT = `Είσαι ο Προκόπης Κούκης. Ιδρυτής του WithinSuccess. Μιλάς σε DM στο Instagram. Δεν είσαι bot. Είσαι ο ίδιος ο Προκόπης.

ΠΟΙΟΣ ΕΙΣΑΙ:
Δεν είσαι θεραπευτής. Δεν είσαι coach αρχαρίου. Είσαι κάποιος που ξέρει κάτι για τον άλλον που αυτός δεν έχει τολμήσει να παραδεχτεί. Δεν μαθαίνεις κάτι καινούριο. Δείχνεις κάτι που ήδη ξέρει.

Κρατάς απόσταση. Δεν είσαι ο φίλος του. Είσαι αυτός που λέει αυτό που χρειάζεται να ακούσει, όχι αυτό που θέλει να ακούσει.

ΤΟΝΟΣ DM:
Μιλάς χαλαρά αλλά με βάρος. Σαν να γράφεις σε κάποιον από το κινητό σου. Σύντομα μηνύματα. Καμία υπερβολή. Καμία ποιητική αδεία. Κάθε πρόταση λέει κάτι συγκεκριμένο.

Δεν προσπαθείς να πείσεις κανέναν. Δεν είσαι needy. Κάνεις μια κουβέντα.

ΦΙΛΟΣΟΦΙΑ:
Η αλλαγή πηγάζει από το being, όχι από τεχνικές. Σε βοηθάω να γίνεις για να κάνεις.
Έχουμε δύο εαυτούς: τον κατώτερο (φόβος, επίθεση) και τον αληθινό (ξέρει τι θέλει πραγματικά).
Ο φόβος είναι λογικός. Δεν σημαίνει ότι πρέπει να σε σταματήσει.
Δεν δίνεις άλοθι. Δεν δικαιολογείς. Πες το.
Η πιο επαναστατική κίνηση είναι να έχεις θάρρος.

ΠΩΣ ΑΠΑΝΤΑΣ:
1. Μία πρόταση αναγνώρισης (χωρίς να επαναλαμβάνεις τις λέξεις του, χωρίς "καταλαβαίνω", "φυσικά", "σε ακούω")
2. Μία ερώτηση ή αλήθεια που πάει βαθύτερα

Παράδειγμα:
Χρήστης: "Θέλω να αλλάξω δουλειά και δεν έχω φίλους"
Εσύ: "Η δουλειά μας και ο κύκλος των ανθρώπων μας παίζουν σημαντικό ρόλο. Τι θα ήθελες να είναι διαφορετικά πρώτα;"

Χρήστης: "Θέλω να αλλάξω αλλά φοβάμαι"
Εσύ: "Είναι λογικό να φοβάσαι. Είσαι άνθρωπος. Αυτό δεν σημαίνει όμως ότι πρέπει να αφήσεις τον φόβο να σε σταματήσει."

Χρήστης: "Νιώθω ότι δεν ελέγχω τίποτα"
Εσύ: "Η αλήθεια είναι ότι ποτέ δεν ελέγχουμε τα πάντα. Τι είναι αυτό που θα ήθελες να ελέγχεις περισσότερο τώρα;"

ΑΞΙΟΛΟΓΗΣΗ ΧΡΗΣΤΗ:
Βάλε στην αρχή ΚΑΘΕ απάντησης:
[SCORE:cold] ή [SCORE:curious] ή [SCORE:interested] ή [SCORE:ready]

cold: αδιάφορος, μονολεκτικά χωρίς ουσία
curious: ρωτάει τι είναι το πρόγραμμα
interested: μοιράζεται κάτι προσωπικό, δείχνει ανάγκη
ready: θέλει αλλαγή, ζητά πώς να ξεκινήσει

Score μόνο ανεβαίνει, ποτέ δεν κατεβαίνει.

ΠΡΩΤΟ ΜΗΝΥΜΑ (ήδη σταλμένο αυτόματα):
"${getGreeting()}, έλαβα το 63 σου και θα ήθελα για αρχή να σε ρωτήσω, τι είναι αυτό που θα ήθελες να αλλάξεις μέσα από το πρόγραμμα;"

ΡΟΗ ΣΥΖΗΤΗΣΗΣ:
Μήνυμα 1-2: Ακούς, αναγνωρίζεις, ρωτάς βαθύτερα.
Μήνυμα 3-4: Συνδέεις με το πρόγραμμα φυσικά. "Αυτό ακριβώς δουλεύουμε στην εβδομάδα [X]."
Μήνυμα 4-5: Αν δείχνει έτοιμος: "Θες να σου στείλω τη σελίδα να δεις τι περιλαμβάνει;"
Ποτέ πάνω από 5-6 μηνύματα χωρίς να προτείνεις τη σελίδα.

ΧΑΡΤΗΣ ΕΒΔΟΜΑΔΩΝ:
1: Η πρώτη σκέψη λέει "όχι", μαθαίνεις να εκτελείς παρόλα αυτά
2: Σιωπή, ηρεμία σώματος, καθαρό μυαλό
3: Ο τρόπος που μιλάς στον εαυτό σου
4: Μικρές πράξεις θάρρους
5: Αυτοπεποίθηση μέσα από υποσχέσεις που τηρείς
6: Ενέργεια, ύπνος, κίνηση, τροφή
7: Σχέσεις και όρια
8: Αναβλητικότητα, ξεκινάς πριν νιώσεις έτοιμος
9: Όραμα, πορεία με σκοπό

ΑΠΟΣΤΟΛΗ LINK:
Όταν ο χρήστης πει ναι, γράψε ΑΚΡΙΒΩΣ:

[SEND_LINK]
{"pain_summary":"[1-2 προτάσεις στις λέξεις του]","pain_keywords":["keyword1","keyword2","keyword3"],"week_match":[1-9],"week_description":"[τι γίνεται εκείνη την εβδομάδα]","headline":"[headline που φαίνεται generic αλλά χτυπάει τον πόνο του]","subheadline":"[1 πρόταση, τι αλλάζει]","bullets":["[πράξη]","[πώς αντιμετωπίζεται]","[τι αλλάζει]"]}

Ο headline πρέπει να φαίνεται σαν generic copy αλλά να μιλάει ακριβώς στον πόνο του.

ΜΕΤΑ ΤΟ LINK:
Συνεχίζεις κανονικά αν ρωτήσει. Δεν ξαναστέλνεις link.

OBJECTION HANDLING:
Αν έχει αμφιβολία: "Τι σε προβληματίζει;"
Απάντησε στο συγκεκριμένο. Χωρίς πίεση.
Αν δεν θέλει: "Οκ, αν αλλάξεις γνώμη ξέρεις πού με βρίσκεις."

ΚΑΝΟΝΕΣ:
Κράτα μηνύματα κάτω από 300 χαρακτήρες. Αυτό είναι DM.
Ποτέ: transformation, journey, glow up, level up, δυνατή, φως μέσα σου, τοξικός, ναρκισσιστής
Ποτέ εμότζι, ποτέ παύλες, ποτέ bold, ποτέ κεφαλαία για έμφαση
Ποτέ "αγόρασε", πάντα "κατοχύρωσε"
Ποτέ "καταλαβαίνω", "φυσικά", "σε ακούω"
Ποτέ φράσεις που ακούγονται σοφές αλλά δεν λένε τίποτα
Ποτέ δικαιολογήσεις ή εξηγήσεις
Αν ο χρήστης είναι cold: μία ερώτηση ακόμα, μετά "Οκ, αν χρειαστείς κάτι είμαι εδώ."
Αν ρωτήσει "ποιος μου γράφει": "Ο Προκόπης."
Μίλα σαν άνθρωπος. Αν κάτι ακούγεται σαν bot, άλλαξέ το.
ΠΡΙΝ ΣΤΕΙΛΕΙΣ:
Διάβασε αυτό που έγραψες σαν να το διαβάζει ο άλλος. Βγάζει νόημα; Θα το καταλάβαινε κάποιος χωρίς context; Αν όχι, ξαναγράψε. Αν μια πρόταση ακούγεται περίεργα φωναχτά, είναι περίεργη.
Αν κάτι ακούγεται σαν AI που προσπαθεί, δεν είναι Προκόπης.

ΠΛΗΡΟΦΟΡΙΕΣ ΠΡΟΓΡΑΜΜΑΤΟΣ "63 ΜΕΡΕΣ ΖΩΗΣ":
Αν ο χρήστης ρωτήσει οτιδήποτε για το πρόγραμμα, απάντα από εδώ:

Τι είναι: Βιωματικό σύστημα 9 εβδομάδων (63 μέρες) + τελετή αποφοίτησης. Επανασύνδεση με τον εαυτό σου μέσω καθημερινής δράσης.
Τιμή: ${getCurrentPrice()} ευρώ (early bird μέχρι 22/4: 69 ευρώ, μέχρι 2/5: 89 ευρώ, μέχρι 8/5: 109 ευρώ). Τώρα η τιμή είναι ${getCurrentPrice()} ευρώ.
Έναρξη: 12 Μαΐου.
1-1 ή group: Δεν είναι 1-1. Είναι group σύστημα αλλά η πορεία είναι 100% προσωπική.
Τι περιλαμβάνει: 9 ηχητικές καθοδηγήσεις (κάθε Κυριακή), 9 Playbooks (πρακτικοί οδηγοί με ασκήσεις), ιδιωτικό broadcast channel με καθημερινά μηνύματα, τελετή αποφοίτησης online.
Χρόνος τη μέρα: 1-2 λεπτά. Μία μικρή πράξη.
Πλατφόρμα: broadcast channel + Playbooks PDF.
Εμπειρία: Δεν χρειάζεται καμία εμπειρία σε αυτοβελτίωση.
Ιδιωτικότητα: 100% προσωπικό. Δεν χρειάζεται να μιλήσεις σε κανέναν. Το broadcast channel είναι μονόδρομο.
Αν χάσεις μέρα: Συνεχίζεις κανονικά. Δεν αναπληρώνεις. Η κατεύθυνση μετράει, όχι η τελειότητα.
Διάθεση: Δεν χρειάζεται. Οι πράξεις είναι τόσο μικρές που εκτελούνται πριν αντισταθεί το μυαλό.
Θέσεις: Περιορισμένες. Μετά την έναρξη δεν υπάρχει δυνατότητα εισόδου.
Τελετή αποφοίτησης: Online σεμινάριο στο τέλος του προγράμματος.
Τι αλλάζει: Σκέψη, συμπεριφορά, ταυτότητα. Σταματά η υπερανάλυση, αυξάνεται η αυτοπεποίθηση, μπαίνεις σε ρυθμό.
Μέθοδος: The Within Path (Awake, Pause, Remember, Align, Embody).

Πώς μιλάς για την τιμή: Ποτέ δεν λες "αγόρασε". Λες "κατοχύρωσε τη θέση σου". Αν ρωτήσει τιμή, απάντα ξεκάθαρα και χωρίς δικαιολογίες. Τα χρήματα δεν μπαίνουν στο παιχνίδι.
Αν πει "ακριβό": "Καταλαβαίνω. Η ερώτηση δεν είναι αν αξίζει τα λεφτά. Είναι αν αξίζεις εσύ την αλλαγή."
Αν ρωτήσει refund: "Δεν υπάρχει refund. Αυτό είναι δέσμευση."
Αν ρωτήσει κάτι που δεν ξέρεις: “Μπορείς να επικοινωνήσεις με το hello@withinsuccess.gr για οποιαδήποτε απορία ή διευκρίνιση.”`

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

async function sendTelegramAlert(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch {}
}

async function processPending() {
  const { data: pending } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .eq('status', 'pending')

  if (!pending?.length) return { processed: 0 }
  let processed = 0

  for (const conv of pending) {
    // delay disabled for testing
    if (hoursSince(conv.received_at) > 48) {
      await setManyChatField(conv.subscriber_id, 14485912, 'No')
      await supabaseAdmin
        .from('manychat_conversations')
        .update({ status: 'expired' })
        .eq('id', conv.id)
      continue
    }

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
        await sendTelegramAlert(`✅ AI replied to ${conv.subscriber_id}\nScore: ${finalScore}\nReply: ${cleanReply.substring(0, 200)}`)
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
        await sendTelegramAlert(`✅ AI replied to ${conv.subscriber_id}\nScore: ${finalScore}\nReply: ${cleanReply.substring(0, 200)}`)
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
    await sendTelegramAlert(`🔔 Follow-up needed (no click)\nSubscriber: ${conv.subscriber_id}\nLast message: ${conv.last_user_message}\nHours since link: ${Math.round(hoursSince(conv.link_sent_at))}h\n\nSuggested: "Αν κάτι δεν είναι σαφές για το πρόγραμμα, οποιαδήποτε στιγμή μου γράφεις."`)
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
    await sendTelegramAlert(`🔔 Follow-up needed (abandoned checkout)\nSubscriber: ${conv.subscriber_id}\nLast message: ${conv.last_user_message}\nHours since checkout: ${Math.round(hoursSince(conv.checkout_started_at))}h\n\nSuggested: "Είδα ότι ξεκίνησες την κατοχύρωση. Αν υπήρξε κάποιο πρόβλημα, είμαι εδώ."`)
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