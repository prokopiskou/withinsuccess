import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Όλα τα πεδία είναι υποχρεωτικά" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Μη έγκυρο email" },
        { status: 400 }
      );
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "WithinSuccess Contact <hello@withinsuccess.gr>",
      to: "hello@withinsuccess.gr",
      replyTo: email,
      subject: `Νέο μήνυμα από ${name} - WithinSuccess Contact Form`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0D0D0D; border-bottom: 2px solid #C9A96E; padding-bottom: 10px;">
            Νέο μήνυμα από τη φόρμα επικοινωνίας
          </h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #0D0D0D; width: 140px;">Όνομα:</td>
              <td style="padding: 10px 0; color: #0D0D0D;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #0D0D0D;">Email:</td>
              <td style="padding: 10px 0; color: #0D0D0D;">
                <a href="mailto:${email}" style="color: #C9A96E;">${email}</a>
              </td>
            </tr>
          </table>
          <div style="margin-top: 30px;">
            <p style="font-weight: bold; color: #0D0D0D; margin-bottom: 10px;">Μήνυμα:</p>
            <div style="background: #f9f9f9; padding: 20px; border-left: 3px solid #C9A96E; color: #0D0D0D; white-space: pre-wrap;">
${message}
            </div>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Στάλθηκε από το <a href="https://withinsuccess.gr/contact" style="color: #C9A96E;">withinsuccess.gr/contact</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Σφάλμα κατά την αποστολή. Δοκίμασε ξανά." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." },
      { status: 500 }
    );
  }
}
