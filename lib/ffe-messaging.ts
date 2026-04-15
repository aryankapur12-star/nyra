// ═══════════════════════════════════════════════════════════════════════════════
// FFE MESSAGING SYSTEM
// Centralized Financial Futures Education messaging for consistent branding
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CORE MESSAGE ──────────────────────────────────────────────────────────────
// The foundational FFE value proposition - use this for the main impact statement
export const FFE_CORE = {
  short: "20% of Nyra profits fund financial literacy workshops for underserved youth.",
  medium: "20% of every Nyra subscription funds financial literacy workshops for underserved youth across Canada — delivered by Financial Futures Education.",
  long: "Nyra is built by Financial Futures Education, a company that delivers financial literacy workshops to underserved youth in shelters, group homes, and community organizations across Canada. 20% of all Nyra profits directly fund these sessions — so every subscription helps a young person learn the money skills they need.",
};

// ─── ROTATING IMPACT BLURBS ────────────────────────────────────────────────────
// Different angles on the same mission - rotate these throughout the app
export const FFE_IMPACT_BLURBS = [
  {
    id: 'workshops',
    emoji: '🎓',
    headline: "Your subscription teaches a teen to budget.",
    body: "20% of Nyra profits fund financial literacy workshops for youth in shelters and group homes across Canada.",
  },
  {
    id: 'youth',
    emoji: '💙',
    headline: "Built to give back.",
    body: "Nyra is created by Financial Futures Education — and 20% of profits fund money skills workshops for underserved youth.",
  },
  {
    id: 'mission',
    emoji: '🌱',
    headline: "Track your bills. Change a life.",
    body: "Every Nyra subscription helps fund financial literacy sessions for young Canadians who need it most.",
  },
  {
    id: 'ffe',
    emoji: '🤝',
    headline: "More than an app.",
    body: "Nyra is built by Financial Futures Education. 20% of all profits fund hands-on money workshops for youth aging out of care.",
  },
  {
    id: 'impact',
    emoji: '✨',
    headline: "Your payment creates opportunity.",
    body: "20% of Nyra profits teach real financial skills to teens in group homes, shelters, and community programs.",
  },
  {
    id: 'future',
    emoji: '🚀',
    headline: "Invest in the next generation.",
    body: "Part of every dollar you spend on Nyra funds workshops teaching budgeting, saving, and credit to underserved youth.",
  },
];

// ─── CONTEXT-SPECIFIC MESSAGES ─────────────────────────────────────────────────
// Tailored messages for specific pages/contexts
export const FFE_CONTEXTUAL = {
  // Dashboard sidebar
  dashboard: {
    title: "🎓 FFE Mission",
    body: "20% of Nyra profits fund financial literacy workshops for underserved youth across Canada.",
    cta: "Learn more →",
  },
  // Settings page
  settings: {
    title: "🎓 FFE Mission", 
    body: "20% of Nyra profits fund financial literacy workshops for underserved youth across Canada.",
    cta: "Visit FFE →",
  },
  // Signup/onboarding
  signup: {
    emoji: "💙",
    body: "20% of your subscription funds financial literacy workshops for underserved youth.",
  },
  // Payment/checkout
  payment: {
    emoji: "💙",
    body: "20% of your subscription supports Financial Futures Education — teaching money skills to youth who need it most.",
  },
  // How it works page
  howItWorks: {
    faq: {
      question: "What does the 20% to Financial Futures Education mean?",
      answer: "Nyra is built by Financial Futures Education, a company that delivers financial literacy workshops to underserved youth in shelters, group homes, and community organizations across Canada. 20% of all Nyra profits directly fund these sessions — so every subscription helps a young person learn the money skills they need.",
    },
    cta: "Plans from $3/month — and 20% funds financial literacy for youth who need it most.",
  },
  // Landing page
  landing: {
    badge: "20% of profits fund youth financial literacy",
    hero: "Built by Financial Futures Education. 20% of profits teach money skills to underserved youth.",
  },
  // Email templates
  email: {
    footer: "20% of Nyra profits fund financial literacy workshops for underserved youth — delivered by Financial Futures Education.",
    welcome: "Welcome to the Nyra family! By subscribing, you're also supporting financial literacy workshops for underserved youth across Canada.",
  },
};

// ─── ROTATION LOGIC ────────────────────────────────────────────────────────────

/**
 * Get a rotating blurb based on the current time period
 * @param cadence - 'daily' | 'weekly' | 'monthly' - how often to rotate
 * @returns The current FFE impact blurb
 */
export function getRotatingBlurb(cadence: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  const now = new Date();
  let index: number;
  
  switch (cadence) {
    case 'daily':
      // Rotate daily based on day of year
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      index = dayOfYear % FFE_IMPACT_BLURBS.length;
      break;
    case 'weekly':
      // Rotate weekly based on week of year
      const weekOfYear = Math.floor(dayOfYearCalc(now) / 7);
      index = weekOfYear % FFE_IMPACT_BLURBS.length;
      break;
    case 'monthly':
      // Rotate monthly
      index = now.getMonth() % FFE_IMPACT_BLURBS.length;
      break;
    default:
      index = 0;
  }
  
  return FFE_IMPACT_BLURBS[index];
}

function dayOfYearCalc(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get a specific blurb by ID
 */
export function getBlurbById(id: string) {
  return FFE_IMPACT_BLURBS.find(b => b.id === id) || FFE_IMPACT_BLURBS[0];
}

/**
 * Get a random blurb (useful for variety on refresh)
 */
export function getRandomBlurb() {
  return FFE_IMPACT_BLURBS[Math.floor(Math.random() * FFE_IMPACT_BLURBS.length)];
}

/**
 * Get blurb based on user's signup date (personalized rotation)
 * Each user sees a different rotation starting point
 */
export function getPersonalizedBlurb(userCreatedAt: Date | string, cadence: 'daily' | 'weekly' = 'weekly') {
  const created = new Date(userCreatedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  
  let index: number;
  if (cadence === 'daily') {
    index = diffDays % FFE_IMPACT_BLURBS.length;
  } else {
    index = Math.floor(diffDays / 7) % FFE_IMPACT_BLURBS.length;
  }
  
  return FFE_IMPACT_BLURBS[index];
}

// ─── REACT HOOK (for client components) ────────────────────────────────────────
// Import this in React components: import { useFFEBlurb } from '@/lib/ffe-messaging'

/**
 * React hook for getting rotating FFE blurb
 * Usage: const blurb = useFFEBlurb('weekly');
 */
export function useFFEBlurb(cadence: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  // This will be consistent during the same render cycle
  // For true reactivity, you'd use useState + useEffect with a timer
  return getRotatingBlurb(cadence);
}

// ─── FORMATTED COMPONENTS (JSX strings for quick use) ──────────────────────────
export const FFE_JSX = {
  // Simple inline mention
  inline: `<span>20% of profits fund youth financial literacy</span>`,
  
  // Badge style
  badge: `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(195,154,53,0.09);border:1px solid rgba(195,154,53,0.2);border-radius:100px;padding:4px 12px;font-size:0.7rem;font-weight:600;color:#c39a35;">💙 20% funds youth financial literacy</span>`,
  
  // Card style (for sidebars)
  card: `
    <div style="background:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.86);border-radius:16px;padding:20px 22px;">
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:0.88rem;color:#0c1524;margin-bottom:12px;">🎓 FFE Mission</div>
      <div style="font-size:0.76rem;color:#3a4f6a;line-height:1.75;margin-bottom:14px;">20% of Nyra profits fund financial literacy workshops for underserved youth across Canada.</div>
      <a href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer" style="display:flex;align-items:center;gap:6px;font-size:0.76rem;font-weight:600;color:#c39a35;text-decoration:none;">Visit FFE →</a>
    </div>
  `,
};

export default {
  FFE_CORE,
  FFE_IMPACT_BLURBS,
  FFE_CONTEXTUAL,
  getRotatingBlurb,
  getBlurbById,
  getRandomBlurb,
  getPersonalizedBlurb,
  useFFEBlurb,
};
