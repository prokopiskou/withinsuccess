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
  try {
    const res = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriberId),
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
  try {
    const res = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriberId),
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
 * Λίστα κοινών ελληνικών ονομάτων (ονομαστική).
 * Αν το όνομα είναι εδώ, είμαστε 100% σίγουροι ότι είναι όνομα.
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
  'φαιδων', 'φωτιος', 'χριστοφορος', 'ζαφειρης', 'ηλιας', 'μαρτινος',

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
  'χριστιανα', 'ωραια', 'παναγιωτα', 'ευδοξια', 'ευτυχια', 'ευσεβια',
  'μελισσα', 'εβελινα', 'ιλεανα',

  // Αρσενικά -ης  
  'γιαννης', 'μιχαλης', 'αντωνης', 'λευτερης', 'βασιλης', 'δημητρης',
  'φωτης', 'μανωλης', 'μανος', 'πανος', 'σακης', 'μπαμπης', 'νικολης',
  'αργυρης', 'θοδωρης', 'παρις', 'ζαχαρης', 'σταθης',

  // Αρσενικά -ας
  'ανδρεας', 'νικολας', 'φωτας', 'ηρακλας', 'ηρακλης', 'μηνας',

  // Ξένα που εμφανίζονται συχνά
  'maria', 'eleni', 'anna', 'kostas', 'giorgos', 'nikos', 'yannis',
  'dimitris', 'christos', 'alex', 'andreas', 'michael', 'john', 'maria',
  'sophia', 'sofia', 'elena', 'katerina', 'george', 'nick', 'peter'
])

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
 * Νικόλας → Νικόλα
 */
function toVocative(name: string): string {
  // Κεφαλαίο πρώτο, μικρά τα υπόλοιπα
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  
  // Ειδικές περιπτώσεις - ονόματα που η κλητική τους δεν ακολουθεί κανόνα
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
  
  // Γενικοί κανόνες κλητικής
  // -ος → -ε (αλλά πολλά -ος → -ο, οπότε καλύτερα να μην το κάνουμε αυτόματα)
  // -ης → -η
  if (formatted.endsWith('ης')) {
    return formatted.slice(0, -1) // Γιάννης → Γιάννη
  }
  // -ας → -α
  if (formatted.endsWith('ας')) {
    return formatted.slice(0, -1) // Κώστας → Κώστα
  }
  // -ος → -ο (για ονόματα σαν Γιώργος, Νίκος)
  if (formatted.endsWith('ος')) {
    return formatted.slice(0, -1) // Γιώργος → Γιώργο
  }
  
  // Θηλυκά και ξένα ονόματα παραμένουν ως έχουν
  return formatted
}

/**
 * Επιστρέφει όνομα σε κλητική ΜΟΝΟ αν είμαστε 100% σίγουροι ότι είναι όνομα.
 * Αλλιώς επιστρέφει null.
 */
function validateAndFormatName(rawName: string | null | undefined): string | null {
  if (!rawName || typeof rawName !== 'string') return null
  
  const cleaned = cleanName(rawName)
  if (cleaned.length < 2) return null
  
  // Πάρε μόνο την πρώτη λέξη
  const firstWord = cleaned.split(' ')[0]
  if (firstWord.length < 2) return null
  
  // 100% check: Είναι στη λίστα γνωστών ονομάτων;
  const normalized = firstWord.toLowerCase()
  if (!GREEK_NAMES.has(normalized)) {
    // Δεν είναι στη λίστα — δεν το χρησιμοποιούμε
    return null
  }
  
  // Είναι αναγνωρισμένο όνομα — format σε κλητική
  return toVocative(firstWord)
}

export async function getManyChatSubscriber(subscriberId: string): Promise<{ firstName: string | null; lastName: string | null }> {
  try {
    const res = await fetch(
      `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${subscriberId}`,
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
      lastName: null // Δεν χρησιμοποιούμε lastName στα DMs
    }
  } catch (err) {
    console.error('ManyChat getInfo failed:', err)
    return { firstName: null, lastName: null }
  }
}