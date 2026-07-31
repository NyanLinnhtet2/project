import cron from "node-cron";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import { getCentralCouponModel } from "../models/CentralDB/coupon";
import { generateCouponCode } from "../utils/membership";
import { sendEmail } from "../utils/mailer";

// Resolved once per run rather than per customer, so a mid-run env change
// can't hand out two different coupon values in the same batch.
const getBirthdayCouponConfig = () => {
  const discountType: "amount" | "percent" =
    process.env.BIRTHDAY_COUPON_DISCOUNT_TYPE === "amount" ? "amount" : "percent";
  const discountValue = Number(process.env.BIRTHDAY_COUPON_DISCOUNT_VALUE) || 15;
  const validDays = Number(process.env.BIRTHDAY_COUPON_VALID_DAYS) || 14;
  return { discountType, discountValue, validDays };
};

const buildBirthdayEmailHtml = (
  customerName: string,
  code: string,
  discountType: "amount" | "percent",
  discountValue: number,
  expiresAt: Date,
): string => {
  const discountLabel =
    discountType === "percent" ? `${discountValue}% off` : `${discountValue.toLocaleString()} Ks off`;
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>🎂 Happy Birthday, ${customerName}!</h2>
      <p>To celebrate, here's a birthday gift from us — <strong>${discountLabel}</strong> your next purchase.</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px; text-align:center; margin:20px 0;">
        <p style="margin:0; font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Your Coupon Code</p>
        <p style="margin:8px 0 0; font-size:24px; font-weight:bold; letter-spacing:0.1em; color:#059669;">${code}</p>
      </div>
      <p style="color:#64748b; font-size:13px;">Valid until ${expiresAt.toLocaleDateString()}. Show this code to the cashier at checkout.</p>
      <p>Thank you for being a valued customer — we hope to see you soon!</p>
    </div>
  `;
};

// Finds customers whose birthday is today, issues one "birthday" coupon per
// customer per calendar year (skips anyone already issued one this year, so
// re-running the job or scheduling it twice in a day is harmless), and
// emails the coupon to anyone with an email on file.
export const runBirthdayEmailJob = async (): Promise<void> => {
  const Customer = getCentralCustomerModel();
  const Coupon = getCentralCouponModel();

  const now = new Date();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();

  const customersWithDob = await Customer.find({ dateOfBirth: { $exists: true } });
  const birthdayCustomers = customersWithDob.filter((c) => {
    if (!c.dateOfBirth) return false;
    const dob = new Date(c.dateOfBirth);
    return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
  });

  if (birthdayCustomers.length === 0) return;

  const { discountType, discountValue, validDays } = getBirthdayCouponConfig();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let issued = 0;
  let emailed = 0;

  for (const customer of birthdayCustomers) {
    try {
      const alreadyIssued = await Coupon.findOne({
        customerId: customer._id,
        type: "birthday",
        createdAt: { $gte: startOfYear },
      });
      if (alreadyIssued) continue;

      const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
      const coupon = await Coupon.create({
        code: generateCouponCode("BDAY"),
        customerId: customer._id,
        customerName: customer.name,
        type: "birthday",
        discountType,
        discountValue,
        status: "active",
        expiresAt,
      });
      issued += 1;

      if (customer.email) {
        const sent = await sendEmail(
          customer.email,
          "🎂 Happy Birthday — here's a gift from us!",
          buildBirthdayEmailHtml(
            customer.name,
            coupon.code,
            discountType,
            discountValue,
            expiresAt,
          ),
        );
        if (sent) emailed += 1;
      }
    } catch (error) {
      console.error(`❌ Birthday coupon failed for customer ${customer._id}:`, error);
    }
  }

  console.log(
    `🎂 Birthday job: ${birthdayCustomers.length} birthday(s) today, ${issued} coupon(s) issued, ${emailed} email(s) sent`,
  );
};

// Runs daily (default 8:00 AM server time — configurable via
// BIRTHDAY_EMAIL_CRON in .env, standard 5-field cron syntax).
export const startBirthdayEmailCron = (): void => {
  const schedule = process.env.BIRTHDAY_EMAIL_CRON || "0 8 * * *";
  if (!cron.validate(schedule)) {
    console.error(`❌ Invalid BIRTHDAY_EMAIL_CRON expression "${schedule}" — cron not started`);
    return;
  }
  cron.schedule(schedule, () => {
    runBirthdayEmailJob().catch((error) =>
      console.error("❌ Birthday email cron run failed:", error),
    );
  });
  console.log(`🎂 Birthday email cron scheduled: "${schedule}"`);
};