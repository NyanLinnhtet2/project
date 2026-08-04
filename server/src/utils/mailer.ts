import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let warnedMissingConfig = false;

// Lazily built so a missing/incomplete SMTP config doesn't crash server
// startup — it only matters once something actually tries to send mail.
const getTransporter = (): Transporter | null => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warnedMissingConfig) {
      console.warn(
        "⚠️ SMTP_HOST/SMTP_USER/SMTP_PASS not set in .env — emails will be skipped",
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    family: 4,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  } as any);
  return transporter;
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<boolean> => {
  const t = getTransporter();
  if (!t) return false;

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
};
