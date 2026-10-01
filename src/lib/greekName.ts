// ============================================================
// Ελληνικά ονόματα: κλητική με ΚΑΝΟΝΕΣ (όχι AI)
// Το AI χρησιμοποιείται ΜΟΝΟ για καθαρισμό (τόνοι, κεφαλαία, greeklish),
// ποτέ για γραμματική — εκεί έκανε λάθη (Αλέξανδρε→Αλέξανδρο, Θωμαή→Θωμά).
//
// Κανόνες κλητικής:
//   -ης / -ής  → -η / -ή     (Προκόπης→Προκόπη, Παντελής→Παντελή)
//   -ας / -άς  → -α / -ά     (Κώστας→Κώστα, Θωμάς→Θωμά)
//   -ος, 2 συλλαβές        → -ο   (Νίκος→Νίκο, Γιώργος→Γιώργο, Στέλιος→Στέλιο)
//   -ος, 3+ συλλαβές       → -ε   (Αλέξανδρος→Αλέξανδρε, Θεόδωρος→Θεόδωρε)
//   -ός (οξύτονο)          → -έ   (Στυλιανός→Στυλιανέ)
//   ό,τι άλλο (θηλυκά, -ις, ξένα) → ΑΜΕΤΑΒΛΗΤΟ (Θωμαή, Θωμαΐς, Ελένη, Anna)
// ============================================================

const VOWELS = new Set(['α', 'ε', 'η', 'ι', 'ο', 'υ', 'ω'])
const DIGRAPHS = new Set(['αι', 'ει', 'οι', 'υι', 'ου', 'αυ', 'ευ', 'ηυ'])

// Εξαιρέσεις όπου η καθημερινή χρήση διαφέρει από τον κανόνα
// (κλειδί = greekKey: πεζά, χωρίς τόνους, τελικό ς γραμμένο ως σ)
const OVERRIDES: Record<string, string> = {
  'κυριακοσ': 'Κυριάκο',
}

export function stripGreekAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
}

/** Πεζά, χωρίς τόνους/διαλυτικά, με τελικό σίγμα ενοποιημένο — για συγκρίσεις */
export function greekKey(s: string): string {
  return stripGreekAccents(s.toLowerCase()).replace(/ς/g, 'σ')
}

export function isGreekWord(s: string): boolean {
  return /^[\p{Script=Greek}]+(-[\p{Script=Greek}]+)*$/u.test(s)
}

/** Πρώτο γράμμα κεφαλαίο, τα υπόλοιπα πεζά, με σωστό τελικό σίγμα */
export function titleCase(s: string): string {
  return s
    .split('-')
    .map(part => {
      const lower = part.toLowerCase().replace(/σ$/, 'ς')
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('-')
}

type Ch = { b: string; acc: boolean; dia: boolean }

function toChars(word: string): Ch[] {
  const out: Ch[] = []
  for (const c of word.toLowerCase().normalize('NFD')) {
    if (c === '́' || c === '̀' || c === '͂') {
      if (out.length) out[out.length - 1].acc = true
    } else if (c === '̈') {
      if (out.length) out[out.length - 1].dia = true
    } else if (/[̀-ͯ]/.test(c)) {
      // άλλα διακριτικά — αγνόησε
    } else {
      out.push({ b: c === 'ς' ? 'σ' : c, acc: false, dia: false })
    }
  }
  return out
}

/** Μετράει συλλαβές (φωνηεντικές ομάδες), με δίψηφα και συνίζηση (άτονο ι + φωνήεν) */
export function countGreekSyllables(word: string): number {
  const ch = toChars(word)
  let count = 0
  let i = 0
  while (i < ch.length) {
    if (!VOWELS.has(ch[i].b)) { i++; continue }
    count++
    let j = i + 1
    // δίψηφο (αι, ει, ου, αυ…) — εκτός αν το 2ο έχει διαλυτικά
    if (j < ch.length && VOWELS.has(ch[j].b) && !ch[j].dia && !ch[i].acc && DIGRAPHS.has(ch[i].b + ch[j].b)) {
      j++
    } else if (ch[i].b === 'ι' && !ch[i].acc && !ch[i].dia && j < ch.length && VOWELS.has(ch[j].b)) {
      // συνίζηση: Γιώργος, Στέλιος, Γιούλη
      j++
      if (j < ch.length && VOWELS.has(ch[j].b) && !ch[j].dia && DIGRAPHS.has(ch[j - 1].b + ch[j].b)) j++
    }
    i = j
  }
  return count
}

function vocativeOne(name: string): string {
  if (!name || !isGreekWord(name)) return name
  const key = greekKey(name)
  if (OVERRIDES[key]) return OVERRIDES[key]

  // -ης / -ής / -ας / -άς → κόβουμε το ς
  if (/[ηα]σ$/.test(key)) return name.slice(0, -1)

  // -ος / -ός
  if (key.endsWith('οσ')) {
    const stem = name.slice(0, -2)
    const lastVowel = name.slice(-2, -1)
    if (lastVowel === 'ό' || lastVowel === 'Ό') return stem + 'έ' // οξύτονο: Στυλιανός → Στυλιανέ
    return stem + (countGreekSyllables(name) >= 3 ? 'ε' : 'ο')
  }

  // Θηλυκά, -ις/-ΐς, ξένα κ.λπ. → αμετάβλητα
  return name
}

/** Κλητική για ένα ήδη καθαρό μικρό όνομα στην ονομαστική (π.χ. "Αλέξανδρος" → "Αλέξανδρε") */
export function greekVocative(name: string): string {
  const n = name.trim()
  if (!n) return ''
  return n.split('-').map(vocativeOne).join('-')
}
