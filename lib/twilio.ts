import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
function getClient() {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(accountSid, authToken);
}

// Generate a random 6-digit code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Twilio
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  try {
    if (!twilioPhone) {
      throw new Error('Twilio phone number not configured');
    }

    const client = getClient();
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: to,
    });

    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    return { success: false, error: error.message };
  }
}

// Send verification code
export async function sendVerificationCode(to: string, code: string): Promise<{ success: boolean; error?: string }> {
  const message = `Your Nyra verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, ignore this message.`;
  return sendSMS(to, message);
}

// Send bill reminder
export async function sendBillReminder(
  to: string, 
  billName: string, 
  amount: number, 
  dueDate: string,
  daysUntilDue: number
): Promise<{ success: boolean; error?: string }> {
  const dueText = daysUntilDue === 0 
    ? 'TODAY' 
    : daysUntilDue === 1 
      ? 'tomorrow' 
      : `in ${daysUntilDue} days`;
  
  const message = `💰 Nyra Reminder: ${billName} ($${amount.toFixed(2)}) is due ${dueText} on ${dueDate}.\n\nStay on track! 🎯`;
  
  return sendSMS(to, message);
}

// Send payment confirmation
export async function sendPaymentConfirmation(
  to: string,
  billName: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const message = `✅ Nyra: You marked ${billName} ($${amount.toFixed(2)}) as paid. Great job staying on top of your bills! 🔥`;
  
  return sendSMS(to, message);
}
