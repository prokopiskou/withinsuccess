import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const mailerLiteKey = process.env.MAILERLITE_API_KEY!;
const groupId = '148420836003415194';

async function fixName(rawName: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Έχεις ένα όνομα από φόρμα αγοράς: "${rawName}". Επέστρεψε ΜΟΝΟ το μικρό όνομα, με σωστή κεφαλαία πρώτο γράμμα, χωρίς τίποτα άλλο. Παράδειγμα: "ΠΡΟΚΟΠΗΣ ΚΟΥΚΗΣ" → "Προκόπης". "prokopis koukis" → "Προκόπης". "Maria" → "Μαρία".`
        }]
      })
    });
    const data = await response.json();
    return data.content[0].text.trim();
  } catch {
    return rawName.split(' ')[0];
  }
}

async function addToMailerLite(email: string, name: string) {
  await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mailerLiteKey}`,
    },
    body: JSON.stringify({
      email,
      fields: { name },
      groups: [groupId],
      status: 'active',
    })
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || '';
    const rawName = session.customer_details?.name || '';

    if (email) {
      const name = await fixName(rawName);
      await addToMailerLite(email, name);
    }
  }

  return NextResponse.json({ received: true });
}