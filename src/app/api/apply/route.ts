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

  // Αποθήκευση στο Notion
  await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: "3415b53ee189803e9b71000cd808ec4b" },
      properties: {
        Name: { title: [{ text: { content: normalizedName } }] },
        Email: { email },
        Reason: { rich_text: [{ text: { content: reason } }] },
        Experience: { rich_text: [{ text: { content: experience } }] },
        Goal: { rich_text: [{ text: { content: goal } }] },
        Readiness: { rich_text: [{ text: { content: readiness } }] },
        Status: { select: { name: "Νέα" } },
      },
    }),
  });

  // Αποθήκευση στο MailerLite
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