import { NextResponse } from "next/server";

type WaitlistBody = {
  name?: unknown;
  email?: unknown;
  source?: unknown;
};

function sanitizeSource(raw: string): string | undefined {
  const s = raw.replace(/[^a-zA-Z0-9_\-/]/g, "").slice(0, 64);
  return s.length > 0 ? s : undefined;
}

export async function POST(req: Request) {
  let body: WaitlistBody;
  try {
    body = (await req.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: "Μη έγκυρο αίτημα" }, { status: 400 });
  }

  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  const nameInput = typeof body.name === "string" ? body.name.trim() : "";
  const sourceInput =
    typeof body.source === "string" ? body.source.trim() : "";
  const source = sourceInput ? sanitizeSource(sourceInput) : undefined;

  if (!emailRaw) {
    return NextResponse.json(
      { error: "Το email είναι υποχρεωτικό" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return NextResponse.json({ error: "Μη έγκυρο email" }, { status: 400 });
  }

  let normalizedName = nameInput;
  if (nameInput) {
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
          messages: [
            {
              role: "user",
              content: `Normalize this name to proper Greek or Latin capitalization. Return ONLY the normalized name, nothing else: "${nameInput}"`,
            },
          ],
        }),
      });
      const claudeData = await claudeRes.json();
      normalizedName = claudeData.content[0].text.trim();
    } catch {
      normalizedName = nameInput;
    }
  }

  const fields: Record<string, string> = {};
  if (normalizedName) fields.name = normalizedName;
  // MailerLite: create a custom subscriber field with key `source` (or rename to match your ML field slug)
  if (source) fields.source = source;

  const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      email: emailRaw,
      ...(Object.keys(fields).length > 0 ? { fields } : {}),
      groups: ["184997659389461878"],
    }),
  });

  if (!mlRes.ok) {
    const text = await mlRes.text();
    console.error("[waitlist] MailerLite error:", mlRes.status, text);
    return NextResponse.json(
      { error: "Δεν ήταν δυνατή η εγγραφή. Δοκίμασε ξανά." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
