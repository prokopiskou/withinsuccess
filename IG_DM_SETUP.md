# Within DM — στήσιμο (μία φορά, ~30 λεπτά)

Σχόλιο σε reel → δημόσια απάντηση → DM με «Στείλε μου το link» → (follow πρώτα) → link → follow-up.
Διαχείριση: `withinsuccess.gr/dashboard/dm`. Μέχρι να μπει token όλα τρέχουν σε **dry-run** (δεν φεύγει τίποτα).

## Βήμα 1 · Supabase (5′)
1. SQL Editor → επικόλλησε `supabase/ig-dm.sql` → **Run**.
2. Database → Extensions → ενεργοποίησε **pg_cron** και **pg_net**.
3. SQL Editor → επικόλλησε `supabase/ig-cron.sql`, βάλε μέσα το `CRON_SECRET` του Vercel → **Run**. (Follow-up κάθε λεπτό.)

Ήδη από εδώ: μπαίνεις στο `/dashboard/dm`, φτιάχνεις αυτοματισμό και πατάς **Δοκιμή** για να δεις όλη τη ροή.

## Βήμα 2 · Meta app (15′)
1. developers.facebook.com → My Apps → **Create app** → use case **«Manage messaging & content on Instagram»** → σύνδεση με το business portfolio του WithinSuccess.
2. **Instagram → API setup with Instagram login**:
   - **Generate access tokens → Add account** → μπαίνεις με @withinsuccess → **αντιγραφή token**.
   - **Instagram app secret** → αντιγραφή.
3. **Configure webhooks**:
   - Callback URL: `https://withinsuccess.gr/api/ig/webhook`
   - Verify token: μια τυχαία λέξη της επιλογής σου
   - Subscribe: **comments**, **messages**, **messaging_postbacks**
   - (Το Verify περνάει αφού κάνεις το Βήμα 3.)
4. App settings → Basic:
   - Privacy Policy URL: `https://withinsuccess.gr/privacy`
   - User data deletion → Instructions URL: `https://withinsuccess.gr/data-deletion`
   - Εικονίδιο 1024×1024, κατηγορία «Education»
   - **Publish / Live**

## Βήμα 3 · Vercel secrets (3′)
Settings → Environment Variables (Production). Τα κλειδιά ζουν μόνο εδώ, ποτέ στον κώδικα.

| Όνομα | Τιμή |
|---|---|
| `IG_ACCESS_TOKEN` | το token |
| `IG_APP_SECRET` | το Instagram app secret |
| `IG_VERIFY_TOKEN` | η λέξη του webhook |

→ **Redeploy** → πίσω στο Meta πάτα **Verify and save** στο webhook.

## Βήμα 4 · Instagram app στο κινητό (1′)
Ρυθμίσεις → Μηνύματα και απαντήσεις στο story → Έλεγχοι μηνυμάτων → Συνδεδεμένα εργαλεία → **Να επιτρέπεται η πρόσβαση στα μηνύματα** = ON.

## Βήμα 5 · Δοκιμή με αληθινό λογαριασμό
1. Meta: App roles → Roles → **Instagram testers** → πρόσθεσε δεύτερο λογαριασμό σου. Αποδοχή από εκείνο το IG: Ρυθμίσεις → Εφαρμογές και ιστότοποι → Προσκλήσεις δοκιμαστή.
2. Dashboard: πάτα το κουμπί **Dry-run → Live**.
3. Σχολίασε τη λέξη από τον δεύτερο λογαριασμό. Θα δεις την επαφή στην καρτέλα **Επαφές**.

## Βήμα 6 · Για όλους τους followers: App Review
Αν σχόλια από τρίτους δεν φέρνουν DM, ζήτα **Advanced Access** για:
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`

App Review → Permissions and features. Θέλει business verification και ένα screencast: σχόλιο → DM → κουμπί → link → dashboard. Συνήθως 3–10 μέρες.

## Βήμα 7 · Από ManyChat σε Within DM
Για κάθε λέξη που περνάς εδώ, **σβήσε την ίδια στο ManyChat**, αλλιώς πάνε δύο DM. Το AI flow του 63 μένει στο ManyChat.

## Τι να ξέρεις
- Μετά το σχόλιο το Instagram επιτρέπει **ένα** μήνυμα μέχρι να απαντήσει ο χρήστης. Γι' αυτό το follow-up πάει μόνο σε όσους πάτησαν «Στείλε μου το link».
- Follow-up μόνο μέσα σε 24 ώρες από το tap.
- 1 ροή ανά άτομο ανά αυτοματισμό ανά 24ωρο.
- Follow πρώτα: αν δεν μπορεί να ελεγχθεί ή ζητηθεί 2 φορές, στέλνει το link.
- Token: ανανεώνεται μόνο του κάθε Δευτέρα.
