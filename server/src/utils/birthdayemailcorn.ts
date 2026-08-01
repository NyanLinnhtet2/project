import cron from "node-cron";
import { getCentralCustomerModel } from "../models/CentralDB/customer";
import {
  isBirthdayToday,
  getOrCreateBirthdayCoupon,
  sendBirthdayCouponEmail,
} from "./birthdaycoupon";

export const runBirthdayEmailJob = async (): Promise<void> => {
  const Customer = getCentralCustomerModel();

  const customersWithDob = await Customer.find({
    dateOfBirth: { $exists: true },
  });
  const birthdayCustomers = customersWithDob.filter((c) =>
    isBirthdayToday(c.dateOfBirth),
  );

  if (birthdayCustomers.length === 0) return;

  let issued = 0;
  let emailed = 0;

  for (const customer of birthdayCustomers) {
    try {
      const coupon = await getOrCreateBirthdayCoupon(customer);
      issued += 1;
      const sent = await sendBirthdayCouponEmail(customer, coupon);
      if (sent) emailed += 1;
    } catch (error) {
      console.error(
        `❌ Birthday coupon failed for customer ${customer._id}:`,
        error,
      );
    }
  }

  console.log(
    `🎂 Birthday job: ${birthdayCustomers.length} birthday(s) today, ${issued} coupon(s) issued, ${emailed} email(s) sent`,
  );
};

export const startBirthdayEmailCron = (): void => {
  const schedule = process.env.BIRTHDAY_EMAIL_CRON || "0 8 * * *";
  if (!cron.validate(schedule)) {
    console.error(
      `❌ Invalid BIRTHDAY_EMAIL_CRON expression "${schedule}" — cron not started`,
    );
    return;
  }
  cron.schedule(schedule, () => {
    runBirthdayEmailJob().catch((error) =>
      console.error("❌ Birthday email cron run failed:", error),
    );
  });
  console.log(`🎂 Birthday email cron scheduled: "${schedule}"`);
};
