import { Resend } from 'resend'

/** Στέλνει την απόδειξη στον πελάτη από το hello@withinsuccess.gr (Resend). Επιστρέφει true αν στάλθηκε. */
export async function sendReceiptEmail(p: { to: string; number: string; pdf: Buffer | null; viewUrl: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Receipt] RESEND_API_KEY λείπει — δεν στάλθηκε απόδειξη')
    return false
  }
  if (!p.pdf && !p.viewUrl) {
    console.error(`[Receipt] Ούτε PDF ούτε link για ${p.to} — δεν στάλθηκε απόδειξη`)
    return false
  }
  const where = p.pdf
    ? 'Στο συνημμένο θα βρεις την απόδειξή σου.'
    : `Την απόδειξή σου τη βρίσκεις εδώ: <a href="${p.viewUrl}" style="color:#8A6D2F;">προβολή απόδειξης</a>`
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'Προκόπης από WithinSuccess <hello@withinsuccess.gr>',
      to: p.to,
      replyTo: 'hello@withinsuccess.gr',
      subject: 'Η απόδειξή σου · WithinSuccess',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0D0D0D; font-size: 16px; line-height: 1.7;">
          <p>Σε ευχαριστώ για την εμπιστοσύνη σου.</p>
          <p>${where}</p>
          ${p.number ? `<p style="color:#6B6B6B; font-size:14px;">Απόδειξη Παροχής Υπηρεσιών ${p.number}</p>` : ''}
          <p>Για οποιαδήποτε απορία, απάντησε σε αυτό το email.</p>
          <p>Προκόπης</p>
        </div>
      `,
      ...(p.pdf
        ? { attachments: [{ filename: `apodeiksi-withinsuccess${p.number ? '-' + p.number.replace(/\s+/g, '-') : ''}.pdf`, content: p.pdf }] }
        : {}),
    })
    if (error) {
      console.error('[Receipt] Resend error:', error)
      return false
    }
    console.log(`[Receipt] Στάλθηκε στο ${p.to}${p.pdf ? ' με PDF' : ' με link'}`)
    return true
  } catch (err) {
    console.error('[Receipt] Unexpected error:', err)
    return false
  }
}
