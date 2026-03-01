import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: Request) {
  try {
    const { billName } = await req.json();

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `For a bill called "${billName}", what is the typical billing frequency and what day of the month is it usually due? Reply in JSON only with this format: {"frequency": "monthly|weekly|yearly", "typical_due_day": number_or_null}. No other text.`
        }
      ]
    });

    const text = (message.content[0] as any).text;
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ frequency: "monthly", typical_due_day: null });
  }
}
