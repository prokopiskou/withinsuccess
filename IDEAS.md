# WithinSuccess — Backlog / Ideas

Future work. Not scheduled yet.

---

## 🪞 The Within Mirror — AI personalized identity reflection
**Status:** idea · **Priority:** high-leverage · **Not now**

A signature, on-brand feature that doubles as an acquisition + conversion + data engine. Not a quiz.

### What it is
Visitor answers 3–4 raw, emotional questions (or writes freely about what weighs on them). The AI — **in Prokopis' voice** (short sentences, calm power, verbal slap, no motivational fluff) — returns a short, deeply personal reflection in ~10s:
- Which stage of **The Within Path™** she's in (Awake → Pause → Remember → Align → Embody)
- The **internal story** keeping her stuck, named plainly
- The single next move

### Why it's worth building (it's a system, not a gimmick)
- **Acquisition (viral):** the reflection is personal enough to screenshot + share → organic loop fed by the 164k Instagram.
- **Conversion:** end CTA is personalized by stage ("You're at *Pause*. The Within Path takes you to *Embody*. Start here →") instead of a generic button.
- **List growth:** "Want the full reflection + your next 5 steps? Leave your email." → warm MailerLite list.
- **Data flywheel:** every answer = exact voice-of-customer language → feeds ads + copy. Defensible dataset competitors can't copy.

### Why it's feasible now
- Codebase already has the **Anthropic SDK** wired (used in `/api/apply` name-normalization and `/api/manychat/concierge`).
- **MailerLite** integration already exists for email capture.
- So: reuse plumbing, don't start from zero.

### Guardrails (non-negotiable — audience is anxious/vulnerable women 25–35)
- Reflective / coaching tone ONLY — never diagnosis, never clinical claims.
- Always hopeful; never deepen negative self-talk or distress.
- Subtle line: "if you're going through something hard, talk to a real person." (brand trust + ethical + legal safety)

### Honest caveat
A feature alone doesn't reach #1. The moat is running it **consistently**, wired into Instagram + ads, every day — not the feature itself.

### Open spec items (to define when we build)
- The exact 3–4 questions
- The Claude system prompt in Prokopis' voice
- Per-stage personalized CTA copy (5 variants)
- MailerLite field mapping + tagging by stage
- Rate limiting / abuse protection (it calls the AI per submission = cost)
