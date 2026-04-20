import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const LANDING_PAGE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://withinsuccess.vercel.app'

export function isWithinBusinessHours(): boolean {
  const now = new Date()
  const greeceHour = (now.getUTCHours() + 3) % 24
  return greeceHour >= 8 && greeceHour < 21
}

export function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
}

export async function sendManyChatMessage(subscriberId: string, message: string): Promise<boolean> {
  const numericId = parseInt(subscriberId)

  if (isNaN(numericId) || numericId === 0) {
    console.log(`Skipping ManyChat message - invalid subscriber_id: ${subscriberId}`)
    return false
  }

  try {
    const res = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriber_id: numericId,
        field_id: 13632075,
        field_value: message
      })
    })
    if (!res.ok) {
      console.error(`ManyChat error (${res.status}):`, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('ManyChat send failed:', err)
    return false
  }
}

export async function setManyChatField(subscriberId: string, fieldId: number, value: string): Promise<boolean> {
  const numericId = parseInt(subscriberId)

  // Skip αν δεν είναι valid numeric ID (π.χ. test subscribers)
  if (isNaN(numericId) || numericId === 0) {
    console.log(`Skipping ManyChat setField - invalid subscriber_id: ${subscriberId}`)
    return false
  }

  try {
    const res = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriber_id: numericId,
        field_id: fieldId,
        field_value: value
      })
    })
    if (!res.ok) {
      console.error(`ManyChat setField error (${res.status}):`, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('ManyChat setField failed:', err)
    return false
  }
}

// ===================================================================
// NAME VALIDATION & VOCATIVE
// ===================================================================

/**
 * Λίστα κοινών ΕΛΛΗΝΙΚΩΝ ονομάτων (χωρίς τόνους).
 * ΚΑΝΕΝΑ λατινικό όνομα σε αυτή τη λίστα.
 * Αν το όνομα είναι εδώ ΚΑΙ είναι σε ελληνικούς χαρακτήρες, το χρησιμοποιούμε.
 */
const GREEK_NAMES = new Set([
  // Αρσενικά -ος
  'κωστας', 'γιωργος', 'νικος', 'πετρος', 'χρηστος', 'παυλος', 'στελιος',
  'σπυρος', 'μανος', 'φωτης', 'βασιλης', 'μιχαλης', 'αποστολος', 'θωμας',
  'στυλιανος', 'αλεξανδρος', 'θοδωρος', 'φιλιππος', 'λευτερης', 'δημητρης',
  'αντωνης', 'στεφανος', 'ηλιας', 'σταυρος', 'τασος', 'ακης', 'λαζαρος',
  'χαραλαμπος', 'λεωνιδας', 'νικολας', 'παναγιωτης', 'προκοπης', 'προκοπιος',
  'γεωργιος', 'νικολαος', 'κωνσταντινος', 'εμμανουηλ', 'ιωαννης',
  'ανδρεας', 'μαριος', 'γρηγορης', 'ευαγγελος', 'μενιος', 'μενελαος',
  'σωκρατης', 'αριστοτελης', 'περικλης', 'θεμιστοκλης', 'ορεστης',
  'ρωμανος', 'σαββας', 'σεραφειμ', 'σιμος', 'σολων', 'τηλεμαχος',
  'φωκας', 'χαριλαος', 'χρυσανθος', 'αβραμ', 'αγγελος', 'αδαμ',
  'αθανασιος', 'θαναση', 'αλεξης', 'αλκης', 'αναργυρος', 'αναστασιος',
  'ανδρονικος', 'αντωνιος', 'αρης', 'αρχοντης', 'βαγγελης', 'βασιλειος',
  'βλασης', 'γαβριηλ', 'γαληνος', 'γερασιμος', 'δανιηλ', 'δημοσθενης',
  'διονυσης', 'ευθυμιος', 'θυμιος', 'ηρακλης', 'θανος', 'ιακωβος',
  'ιορδανης', 'ιωσηφ', 'κορνηλιος', 'κυριακος', 'μακαριος', 'μαρκος',
  'μηνας', 'νεκταριος', 'ξενοφων', 'οδυσσεας', 'ονουφριος', 'παντελης',
  'παρασκευας', 'πελοπιδας', 'πλατων', 'πολυχρονης', 'ραφαηλ', 'ροδολφος',
  'σαμουηλ', 'σταματης', 'σωτηρης', 'τιμος', 'τιμολεων', 'τρυφων',
  'φαιδων', 'φωτιος', 'χριστοφορος', 'ζαφειρης', 'μαρτινος',

  // Θηλυκά
  'μαρια', 'ελενη', 'αννα', 'κατερινα', 'ειρηνη', 'σοφια', 'βασιλικη',
  'δεσποινα', 'χριστινα', 'ιωαννα', 'ευαγγελια', 'αικατερινη', 'αγγελικη',
  'γεωργια', 'κωνσταντινα', 'ολγα', 'παρασκευη', 'φωτεινη', 'αθανασια',
  'αθηνα', 'αλεξανδρα', 'αλικη', 'αμαλια', 'αναστασια', 'ανδρομαχη',
  'ανδριανα', 'ανθη', 'αντιγονη', 'αρετη', 'αρτεμις', 'ασπασια',
  'αφροδιτη', 'βαρβαρα', 'βερα', 'βικτωρια', 'γαρυφαλια', 'γεωργουλα',
  'δαναη', 'δημητρα', 'διονυσια', 'δωρα', 'ελισαβετ', 'ελισσαβετ',
  'ελπιδα', 'ευγενια', 'ευδοκια', 'ευθαλια', 'ευφροσυνη', 'ζαχαρουλα',
  'ζωη', 'ηλιανα', 'θαλεια', 'θεανω', 'θεοδωρα', 'θεοδοσια', 'ιασμη',
  'ιουλια', 'ιφιγενεια', 'καλλιοπη', 'καλομοιρα', 'κλειω', 'κλεοπατρα',
  'κορινα', 'λαμπρινη', 'λεμονια', 'λυδια', 'λυκαβητη', 'μαγδαληνη',
  'μαγδα', 'μαιρη', 'μαλαματω', 'μαργαριτα', 'μαρθα', 'μαριαννα',
  'μαρικα', 'μαρινα', 'μαριλυ', 'ματινα', 'μελινα', 'μελπω', 'μυρσινη',
  'μυρτω', 'νανσυ', 'νατασα', 'νεφελη', 'νικη', 'νικολετα', 'νιοβη',
  'ξανθιππη', 'ουρανια', 'παναγιωτα', 'πανωρια', 'πελαγια', 'πηνελοπη',
  'πολυξενη', 'πολυτιμη', 'ραφαηλα', 'ρεα', 'ρηγουλα', 'ροζα', 'ροζαλια',
  'σαββινα', 'σαπφω', 'σμαραγδα', 'σταματινα', 'σταυρουλα', 'στελλα',
  'συλβια', 'ταξιαρχη', 'τερψιχορη', 'τζενη', 'τζινα', 'τριανταφυλλια',
  'υπατια', 'φαιδρα', 'φανη', 'φανουρια', 'φιλιτσα', 'φλωρα', 'φροσω',
  'χαρα', 'χαρικλεια', 'χαρουλα', 'χρυσα', 'χρυσαυγη', 'χρυσουλα',
  'χριστιανα', 'ωραια', 'ευδοξια', 'ευτυχια', 'ευσεβια',
  'μελισσα', 'εβελινα', 'ιλεανα',

  // Αρσενικά -ης  
  'γιαννης', 'μανωλης', 'πανος', 'σακης', 'μπαμπης', 'νικολης',
  'αργυρης', 'θοδωρης', 'παρις', 'ζαχαρης', 'σταθης',
])

/**
 * Ελέγχει αν το string περιέχει ΜΟΝΟ ελληνικούς χαρακτήρες (και κενά).
 * Αν υπάρχει οποιοσδήποτε λατινικός χαρακτήρας, επιστρέφει false.
 */
function isGreekOnly(str: string): boolean {
  return /^[\u0370-\u03FF\u1F00-\u1FFF\s]+$/.test(str)
}

/**
 * Αφαιρεί τόνους από ελληνικό string για lookup.
 */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Καθαρίζει το όνομα από emojis, underscores, κλπ.
 */
function cleanName(name: string): string {
  return name
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B00}-\u{2BFF}]|[\u{1F100}-\u{1F1FF}]/gu, '')
    .replace(/[_\-\.]/g, ' ')
    .replace(/\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Μετατρέπει όνομα σε κλητική μορφή (για ελληνικά).
 * Κώστας → Κώστα
 * Γιάννης → Γιάννη
 * Μαρία → Μαρία (δεν αλλάζει)
 * Γιώργος → Γιώργο
 */
function toVocative(name: string): string {
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  
  const specialCases: Record<string, string> = {
    'Γιώργος': 'Γιώργο',
    'Κώστας': 'Κώστα',
    'Γιάννης': 'Γιάννη',
    'Δημήτρης': 'Δημήτρη',
    'Νίκος': 'Νίκο',
    'Πέτρος': 'Πέτρο',
    'Χρήστος': 'Χρήστο',
    'Παύλος': 'Παύλο',
    'Στέλιος': 'Στέλιο',
    'Σπύρος': 'Σπύρο',
    'Μάνος': 'Μάνο',
    'Φώτης': 'Φώτη',
    'Βασίλης': 'Βασίλη',
    'Μιχάλης': 'Μιχάλη',
    'Απόστολος': 'Απόστολε',
    'Θωμάς': 'Θωμά',
    'Στυλιανός': 'Στυλιανέ',
    'Αλέξανδρος': 'Αλέξανδρε',
    'Θοδωρής': 'Θοδωρή',
    'Θοδωρος': 'Θοδωρο',
    'Φίλιππος': 'Φίλιππε',
    'Λευτέρης': 'Λευτέρη',
    'Αντώνης': 'Αντώνη',
    'Στέφανος': 'Στέφανε',
    'Ηλίας': 'Ηλία',
    'Σταύρος': 'Σταύρο',
    'Τάσος': 'Τάσο',
    'Άκης': 'Άκη',
    'Λάζαρος': 'Λάζαρε',
    'Νικόλας': 'Νικόλα',
    'Ανδρέας': 'Ανδρέα',
    'Μάριος': 'Μάριε',
    'Γρηγόρης': 'Γρηγόρη',
    'Παναγιώτης': 'Παναγιώτη',
    'Προκόπης': 'Προκόπη',
    'Θανάσης': 'Θανάση',
    'Αλέξης': 'Αλέξη',
    'Άγγελος': 'Άγγελε',
    'Μανώλης': 'Μανώλη',
    'Πάνος': 'Πάνο',
    'Σάκης': 'Σάκη',
    'Μπάμπης': 'Μπάμπη',
    'Άρης': 'Άρη',
    'Βαγγέλης': 'Βαγγέλη',
    'Διονύσης': 'Διονύση',
    'Σωτήρης': 'Σωτήρη',
    'Σταμάτης': 'Σταμάτη',
  }
  
  if (specialCases[formatted]) return specialCases[formatted]
  
  // Γενικοί κανόνες κλητικής (για ελληνικά ονόματα)
  if (formatted.endsWith('ης')) {
    return formatted.slice(0, -1) // Γιάννης → Γιάννη
  }
  if (formatted.endsWith('ας')) {
    return formatted.slice(0, -1) // Κώστας → Κώστα
  }
  if (formatted.endsWith('ος')) {
    return formatted.slice(0, -1) // Γιώργος → Γιώργο
  }
  
  // Θηλυκά παραμένουν ως έχουν
  return formatted
}

/**
 * Επιστρέφει όνομα σε κλητική ΜΟΝΟ αν είμαστε 100% σίγουροι ότι είναι ελληνικό όνομα.
 * Αλλιώς επιστρέφει null.
 * 
 * RULES:
 * 1. Empty/invalid → null
 * 2. Περιέχει λατινικούς χαρακτήρες → null (ΠΟΤΕ Latin names)
 * 3. Δεν είναι στη λίστα γνωστών ελληνικών ονομάτων → null
 * 4. Αλλιώς → return vocative
 */
function validateAndFormatName(rawName: string | null | undefined): string | null {
  if (!rawName || typeof rawName !== 'string') return null
  
  const cleaned = cleanName(rawName)
  if (cleaned.length < 2) return null
  
  const firstWord = cleaned.split(' ')[0]
  if (firstWord.length < 2) return null
  
  // CRITICAL: Απορρίπτουμε λατινικά ονόματα
  // Αυτό λύνει το "Giorgos" bug.
  if (!isGreekOnly(firstWord)) {
    return null
  }
  
  // Lookup στη λίστα χωρίς τόνους για ευελιξία
  // (π.χ. "Γιώργος" και "γιωργος" και "ΓΙΩΡΓΟΣ" all match)
  const normalized = stripAccents(firstWord.toLowerCase())
  if (!GREEK_NAMES.has(normalized)) {
    return null
  }
  
  return toVocative(firstWord)
}

export async function getManyChatSubscriber(subscriberId: string): Promise<{ firstName: string | null; lastName: string | null }> {
  const numericId = parseInt(subscriberId)

  if (isNaN(numericId) || numericId === 0) {
    console.log(`Skipping ManyChat getInfo - invalid subscriber_id: ${subscriberId}`)
    return { firstName: null, lastName: null }
  }

  try {
    const res = await fetch(
      `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${numericId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`
        }
      }
    )
    if (!res.ok) {
      console.error(`ManyChat getInfo error (${res.status}):`, await res.text())
      return { firstName: null, lastName: null }
    }
    const data = await res.json()
    
    return {
      firstName: validateAndFormatName(data.data?.first_name),
      lastName: null
    }
  } catch (err) {
    console.error('ManyChat getInfo failed:', err)
    return { firstName: null, lastName: null }
  }
}