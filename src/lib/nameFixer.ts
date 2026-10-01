import { greekKey, greekVocative, isGreekWord, titleCase } from './greekName'

// ============================================================
// Όνομα πελάτη → μικρό όνομα σε κλητική, για τα emails.
// 1) AI (Haiku) ΜΟΝΟ για καθαρισμό: τόνοι, κεφαλαία, greeklish → ελληνικά,
//    επιλογή μικρού ονόματος αν το επώνυμο γράφτηκε πρώτο.
//    ΔΕΝ αλλάζει πτώση/κατάληξη και ΔΕΝ «διορθώνει» σε άλλο όνομα.
// 2) Έλεγχος: αν το AI άλλαξε γράμματα (π.χ. Θωμαή→Θωμάς), απορρίπτεται.
// 3) Κλητική με κανόνες (greekVocative).
// ============================================================

function fallbackFirst(words: string[]): string {
  const w = words[0] || ''
  return isGreekWord(w) ? titleCase(w) : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}

async function aiNormalize(rawName: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 30,
        messages: [{
          role: 'user',
          content: `Όνομα πελάτη από φόρμα αγοράς: "${rawName}"

Επέστρεψε ΜΟΝΟ το μικρό όνομα, σε ΟΝΟΜΑΣΤΙΚΗ, ακριβώς όπως το έγραψε ο πελάτης, απλώς:
- με σωστό τόνο
- με κεφαλαίο μόνο το πρώτο γράμμα
- αν είναι ελληνικό όνομα γραμμένο με λατινικά (greeklish), γραμμένο με ελληνικά

ΑΠΑΓΟΡΕΥΕΤΑΙ: να αλλάξεις πτώση ή κατάληξη, να το κάνεις κλητική, να το «διορθώσεις» σε άλλο όνομα, να μαντέψεις φύλο.
Αν το επώνυμο είναι γραμμένο πρώτο, επέστρεψε το μικρό όνομα.
Ξενόγλωσσα ονόματα: όπως είναι.
Μία λέξη, χωρίς εισαγωγικά, χωρίς εξήγηση.

Παραδείγματα:
ΠΡΟΚΟΠΗΣ ΚΟΥΚΗΣ → Προκόπης
ΑΛΕΞΑΝΔΡΟΣ ΝΙΚΟΛΑΟΥ → Αλέξανδρος
ΘΩΜΑΗ ΠΑΠΑΔΑΚΗ → Θωμαή
prokopis koukis → Προκόπης
ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ → Μαρία
John Smith → John`,
        }],
      }),
    })
    if (!res.ok) {
      console.error(`[name] Haiku error (${res.status})`)
      return null
    }
    const data = await res.json()
    const out = (data.content?.[0]?.text || '').trim().replace(/^["«']|["»']$/g, '')
    return out || null
  } catch (err) {
    console.error('[name] Haiku failed:', err)
    return null
  }
}

/** Μικρό όνομα στην ονομαστική, καθαρό (χωρίς κλητική) */
export async function normalizeFirstName(rawFullName: string): Promise<string> {
  const words = (rawFullName || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''

  const ai = await aiNormalize(rawFullName.trim())
  if (!ai || /\s/.test(ai) || ai.length > 30) return fallbackFirst(words)

  const rawIsGreek = words.some(w => isGreekWord(w))
  if (rawIsGreek) {
    // Πρέπει να είναι μία από τις λέξεις που έγραψε ο πελάτης, μόνο με τόνους/κεφαλαία
    const match = words.some(w => greekKey(w) === greekKey(ai))
    if (!match) {
      console.warn(`[name] AI άλλαξε το όνομα ("${ai}") — χρησιμοποιώ την αρχική λέξη`)
      return fallbackFirst(words)
    }
    return ai
  }

  // Λατινικά: δεκτό αν είναι λογικό μήκος σε σχέση με κάποια λέξη του πελάτη
  const ok = words.some(w => Math.abs(w.length - ai.length) <= 3)
  return ok ? ai : fallbackFirst(words)
}

/** Τελικό: μικρό όνομα σε κλητική για χρήση στα emails */
export async function firstNameVocative(rawFullName: string): Promise<string> {
  const n = await normalizeFirstName(rawFullName)
  return greekVocative(n)
}
