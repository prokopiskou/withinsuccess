# Within DM — στήσιμο

Σχόλιο σε reel → δημόσια απάντηση → DM με «Στείλε μου το link» → (follow πρώτα) → link → follow-up.
Διαχείριση: `withinsuccess.gr/dashboard/dm`. Μέχρι να μπει token όλα τρέχουν σε **dry-run** (δεν φεύγει τίποτα).

## ✅ Έγινε ήδη
- Supabase (project lifeos): πίνακες `ig_*` + cron follow-up κάθε λεπτό (`within-dm-followups`).
- Meta app **Within DM** (App ID 1521757096491543), portfolio Withinsuccess, use case «Manage messaging & content on Instagram».
- App settings: Privacy `withinsuccess.gr/privacy`, Data deletion `withinsuccess.gr/data-deletion`, Terms, domain, κατηγορία.
- Instagram Tester: @withinsuccess (σε αναμονή αποδοχής).

Σημείωση: τα νέα Meta apps δεν έχουν πια «Instagram Login». Χρησιμοποιούν **Unified Login** με
System-user token που δεν λήγει, στο graph.facebook.com. Ο κώδικας είναι προσαρμοσμένος.

## Μένουν (εσύ, ~10′)
1. **Push** τον κώδικα (για να υπάρχει το webhook endpoint).
2. **Αποδοχή tester** στο Instagram: Ρυθμίσεις → Εφαρμογές και ιστότοποι → Προσκλήσεις δοκιμαστή → Within DM → Αποδοχή.
3. **Token**: Meta → Within DM → Περιπτώσεις χρήσης → Instagram API → Customize → API setup with Unified login → «2. Generate access tokens» → **Add account** → @withinsuccess → αντιγραφή token και **Instagram account ID**.
4. **App secret**: App settings → Βασικά → App secret → Show → αντιγραφή.
5. **Vercel** → Settings → Environment Variables (Production):
   - `IG_ACCESS_TOKEN` = το token
   - `IG_APP_SECRET` = το app secret
   - `IG_VERIFY_TOKEN` = μια λέξη της επιλογής σου
   - `IG_USER_ID` = το Instagram account ID
   → **Redeploy**.
6. **Webhooks**: στο ίδιο Unified login setup → «3. Configure webhooks»:
   - Callback URL `https://withinsuccess.gr/api/ig/webhook`, Verify token = η λέξη του βήματος 5 → **Verify and save**
   - Subscribe: **comments**, **messages**, **messaging_postbacks**
7. Dashboard `/dashboard/dm` → «Σύνδεση Instagram» → **Σύνδεση webhooks**.
8. Instagram (κινητό): Ρυθμίσεις → Μηνύματα → Συνδεδεμένα εργαλεία → **Να επιτρέπεται η πρόσβαση στα μηνύματα** = ON.
9. Δοκιμή με δεύτερο λογαριασμό (πρόσθεσέ τον κι αυτόν ως Instagram Tester), μετά **Dry-run → Live**.

## Για όλους τους followers: App Review
Advanced Access για `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`.
Θέλει business verification (το portfolio Withinsuccess εμφανίζεται «Unverified») και screencast. 3–10 μέρες.

## ManyChat
Για κάθε λέξη που περνάς εδώ, σβήσε την ίδια στο ManyChat. Το AI flow του 63 μένει εκεί.

## Τι να ξέρεις
- Μετά το σχόλιο το Instagram επιτρέπει **ένα** μήνυμα μέχρι να απαντήσει ο χρήστης· γι' αυτό το follow-up πάει μόνο σε όσους πάτησαν το κουμπί.
- 1 ροή ανά άτομο ανά αυτοματισμό ανά 24ωρο. Follow-gate: μετά από 2 προσπάθειες στέλνει το link.
