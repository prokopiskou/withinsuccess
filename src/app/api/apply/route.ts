import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email } = body;

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Όλα τα πεδία είναι υποχρεωτικά" },
        { status: 400 }
      );
    }

    // Normalize name with Claude
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

    // 1. Add to CORRECT MailerLite group (Coaching Apply)
    const mailerliteRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        fields: { name: normalizedName },
        groups: ["184651469072368868"],
      }),
    });

    if (!mailerliteRes.ok) {
      console.error("MailerLite error:", await mailerliteRes.text());
    }

    // 2. Send notification email to Prokopis
    const { error: resendError } = await resend.emails.send({
      from: "WithinSuccess Apply <hello@withinsuccess.gr>",
      to: "hello@withinsuccess.gr",
      replyTo: email,
      subject: `🎯 Νέα αίτηση coaching - ${normalizedName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0D0D0D; border-bottom: 2px solid #C9A96E; padding-bottom: 10px;">
            Νέα αίτηση για coaching
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
          <p style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 3px solid #C9A96E; color: #0D0D0D;">
            Ο/η ${normalizedName} έχει προστεθεί αυτόματα στο MailerLite group "Coaching Apply".
          </p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Στάλθηκε από το <a href="https://withinsuccess.gr/apply" style="color: #C9A96E;">withinsuccess.gr/apply</a>
          </p>
        </div>
      `,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
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
