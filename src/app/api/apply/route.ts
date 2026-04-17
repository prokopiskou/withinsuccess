import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email } = await req.json();

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

  await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      email,
      fields: { name: normalizedName },
      groups: ["184997659389461878"],
    }),
  });

  return NextResponse.json({ success: true });
}