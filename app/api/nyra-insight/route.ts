import { NextRequest, NextResponse } from 'next/server';

// GET handler for testing
export async function GET() {
  return NextResponse.json({ status: 'API route is working', hasKey: !!process.env.ANTHROPIC_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let system = '';
    let userMessage = '';

    if (type === 'weekly') {
      system = `You are Nyra's Gen Z financial coach. You're real, direct, funny, and genuinely helpful. Use emojis naturally. Use 🟢 for green flags (good habits) and 🚩 for red flags (risks). Keep it casual — like a smart friend who actually knows finance. No corporate speak. Format as 3–4 short punchy paragraphs with line breaks between them.`;
      
      userMessage = `Generate a personalized weekly financial insight for ${data.userName}.

THEIR BILL SITUATION:
${data.billDetails || 'No bills added yet'}

STATS:
- Total monthly bills: $${data.totalDue}
- Number of bills: ${data.billCount}
- Average bill: $${data.avgBill}
- Biggest bill: ${data.biggestBill || 'N/A'}
- Bills due in next 7 days: ${data.upcomingCount}
- Overdue bills: ${data.overdueCount}
- Bills confirmed paid this month: ${data.confirmedCount}
- Months using Nyra: ${data.streakMonths}

COVER THESE POINTS:
1. Immediate attention items (any overdue or due soon bills)
2. How their reminder timing looks (are the remind_days_before values good?)
3. One specific money tip relevant to their biggest expense category
4. A motivational closer based on their streak

Keep it under 180 words, personal (use their name), and make it feel like a friend checking in — not a generic report.`;
    } else if (type === 'monthly') {
      system = `You are Nyra's Gen Z financial coach writing a monthly wrap-up. Think Spotify Wrapped energy but for bills. Keep it short, punchy, celebratory if things went well, real but encouraging if they didn't. Use emojis. Max 100 words. Format as 2-3 short paragraphs.`;
      
      userMessage = `Write a ${data.monthName} ${data.year} monthly wrap for ${data.userName}.

STATS:
- Total bills tracked: ${data.billCount}
- Total monthly amount: $${data.totalDue}
- Bills confirmed paid: ${data.confirmedCount}
- Bills marked missed: ${data.missedCount}
- Currently overdue: ${data.overdueCount}
- On-time rate: ${data.onTimeRate}%
- Amount paid this month: $${data.paidAmount}
- Months on Nyra: ${data.streakMonths}

Make it feel like a personalized recap they'd actually want to share. Be specific with their numbers. If they have a high on-time rate (80%+), celebrate it. If they have overdue bills, acknowledge it gently but motivate them. End with something shareable/quotable.`;
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: type === 'weekly' ? 1000 : 600,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const apiData = await response.json();

    if (!response.ok) {
      console.error('[Nyra API] Error:', apiData);
      return NextResponse.json(
        { error: apiData.error?.message || 'API request failed' },
        { status: response.status }
      );
    }

    const text = apiData.content?.map((c: any) => c.text || '').join('') || '';
    return NextResponse.json({ text });
  } catch (error) {
    console.error('[Nyra API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}