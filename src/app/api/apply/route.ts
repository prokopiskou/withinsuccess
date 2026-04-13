import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const { name, email, reason, experience, goal, readiness } = data;

  // Κανονικοποίηση ονόματος μέσω Claude
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
    normalizedName = name;
  }

  // Email notification στον Προκόπη μέσω MailerLite
  await fetch("https://connect.mailerlite.com/api/transactional/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      from: { email: "hello@withinsuccess.gr", name: "WithinSuccess" },
      to: [{ email: "hello@withinsuccess.gr" }],
      subject: `Νέα αίτηση 1:1 Coaching - ${normalizedName}`,
      html: `
        <h2>Νέα αίτηση 1:1 Coaching</h2>
        <p><strong>Όνομα:</strong> ${normalizedName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Τι τον έφερε εδώ:</strong> ${reason}</p>
        <p><strong>Εμπειρία:</strong> ${experience}</p>
        <p><strong>Στόχος σε 6 μήνες:</strong> ${goal}</p>
        <p><strong>Ετοιμότητα:</strong> ${readiness}</p>
      `,
    }),
  });

  // Αποθήκευση στο MailerLite group
  await fetch("https://connect.mailerlite.com/api/subscribers", {
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

  return NextResponse.json({ success: true });
}