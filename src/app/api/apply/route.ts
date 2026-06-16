import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, reason, experience, goal, readiness } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Όλα τα πεδία είναι υποχρεωτικά" },
        { status: 400 }
      );
    }

    let normalizedName = name;
    try {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 100,
          messages: [{
            role: "user",
            content: `Normalize this name to proper Greek or Latin capitalization. Return ONLY the normalized name, nothing else: "${name}"`,
          }],
        }),
      });
      const claudeData = await claudeRes.json();
      normalizedName = claudeData.content[0].text.trim();
    } catch (e) {
      console.error("Claude normalization failed:", e);
      normalizedName = name;
    }

    const mailerliteRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name: normalizedName,
          reason: reason || "",
          experience: experience || "",
          goal: goal || "",
          readiness: readiness || "",
        },
        groups: ["184651469072368868"],
      }),
    });

    if (!mailerliteRes.ok) {
      console.error("MailerLite error:", await mailerliteRes.text());
    }

    const { error: notifyError } = await resend.emails.send({
      from: "WithinSuccess Apply <hello@send.withinsuccess.gr>",
      to: "hello@withinsuccess.gr",
      replyTo: email,
      subject: `🎯 Νέα αίτηση coaching - ${normalizedName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0D0D0D; border-bottom: 2px solid #C9A96E; padding-bottom: 10px;">
            Νέα αίτηση για 1:1 Coaching
          </h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #0D0D0D; width: 140px;">Όνομα:</td>
              <td style="padding: 10px 0; color: #0D0D0D;">${normalizedName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #0D0D0D;">Email:</td>
              <td style="padding: 10px 0; color: #0D0D0D;">
                <a href="mailto:${email}" style="color: #C9A96E;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #0D0D0D;">Ημερομηνία:</td>
              <td style="padding: 10px 0; color: #0D0D0D;">${new Date().toLocaleString("el-GR", { timeZone: "Europe/Athens" })}</td>
            </tr>
          </table>
          <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-left: 3px solid #C9A96E;">
            <h3 style="color: #0D0D0D; margin-top: 0;">Τι τον/την έφερε εδώ:</h3>
            <p style="color: #0D0D0D; margin: 0;">${reason || "Δεν απάντησε"}</p>
          </div>
          <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-left: 3px solid #C9A96E;">
            <h3 style="color: #0D0D0D; margin-top: 0;">Εμπειρία με coaching:</h3>
            <p style="color: #0D0D0D; margin: 0;">${experience || "Δεν απάντησε"}</p>
          </div>
          <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-left: 3px solid #C9A96E;">
            <h3 style="color: #0D0D0D; margin-top: 0;">Στόχος σε 6 μήνες:</h3>
            <p style="color: #0D0D0D; margin: 0; white-space: pre-wrap;">${goal || "Δεν απάντησε"}</p>
          </div>
          <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-left: 3px solid #C9A96E;">
            <h3 style="color: #0D0D0D; margin-top: 0;">Ετοιμότητα:</h3>
            <p style="color: #0D0D0D; margin: 0;">${readiness || "Δεν απάντησε"}</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Στάλθηκε από το <a href="https://withinsuccess.gr/apply" style="color: #C9A96E;">withinsuccess.gr/apply</a>
          </p>
        </div>
      `,
    });

    if (notifyError) {
      console.error("Resend notification error:", notifyError);
    }

    const { error: confirmError } = await resend.emails.send({
      from: "Προκόπης από WithinSuccess <hello@send.withinsuccess.gr>",
      to: email,
      replyTo: "hello@withinsuccess.gr",
      subject: "Έλαβα την αίτησή σου",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0D0D0D; border-bottom: 2px solid #C9A96E; padding-bottom: 10px;">
            ${normalizedName},
          </h2>
          <p style="color: #0D0D0D; font-size: 16px; line-height: 1.8;">
            Έλαβα την αίτησή σου για 1:1 coaching.
          </p>
          <p style="color: #0D0D0D; font-size: 16px; line-height: 1.8;">
            Δεν είναι μικρό αυτό που έκανες. Είναι η στιγμή που αποφάσισες να κάνεις κάτι για εσένα.
          </p>
          <p style="color: #0D0D0D; font-size: 16px; line-height: 1.8;">
            Θα διαβάσω την αίτησή σου προσωπικά. Αν υπάρχει αντιστοιχία, θα σου απαντήσω τις επόμενες ημέρες.
          </p>
          <p style="color: #0D0D0D; font-size: 16px; line-height: 1.8;">
            Αν έχεις κάτι επείγον στο μεταξύ, γράψε στο 
            <a href="mailto:hello@withinsuccess.gr" style="color: #C9A96E;">hello@withinsuccess.gr</a>.
          </p>
          <p style="color: #0D0D0D; font-size: 16px; line-height: 1.8; margin-top: 30px;">
            Καλωσήρθες.
          </p>
          <p style="color: #0D0D0D; font-size: 16px; line-height: 1.8;">
            Προκόπης
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            WithinSuccess · Γλυφάδα, Αθήνα<br />
            <a href="https://withinsuccess.gr" style="color: #C9A96E;">withinsuccess.gr</a>
          </p>
        </div>
      `,
    });

    if (confirmError) {
      console.error("Resend confirmation error:", confirmError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Apply API error:", err);
    return NextResponse.json(
      { error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." },
      { status: 500 }
    );
  }
}
