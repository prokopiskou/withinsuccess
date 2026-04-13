import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const { name, email, reason, experience, goal, readiness } = data;

  // Στέλνει email notification μέσω MailerLite
  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      email,
      fields: {
        name,
        last_name: "",
      },
      groups: ["184651469072368868"],
    }),
  });

  // Στέλνει και email σε σένα μέσω MailerLite transactional
  await fetch("https://connect.mailerlite.com/api/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      from: { email: "noreply@withinsuccess.gr", name: "WithinSuccess" },
      to: [{ email: "hello@withinsuccess.gr" }],
      subject: `Νέα αίτηση 1:1 coaching — ${name}`,
      html: `
        <h2>Νέα αίτηση 1:1 Coaching</h2>
        <p><strong>Όνομα:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Τι τον έφερε εδώ:</strong> ${reason}</p>
        <p><strong>Εμπειρία:</strong> ${experience}</p>
        <p><strong>Στόχος σε 6 μήνες:</strong> ${goal}</p>
        <p><strong>Ετοιμότητα:</strong> ${readiness}</p>
      `,
    }),
  });

  return NextResponse.json({ success: true });
}