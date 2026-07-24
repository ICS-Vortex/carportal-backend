import nodemailer from "nodemailer";

import { env } from "../config/env";
import { pool } from "../db/pool";
import { getDueReminderEmails, markReminderSent } from "../services/reminder-service";

const POLL_INTERVAL_MS = 1000 * 60 * 60;

async function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

async function processReminders(): Promise<void> {
  const transport = await createTransport();
  const reminders = await getDueReminderEmails();

  if (!transport) {
    console.info(`SMTP is not configured. ${reminders.length} reminder(s) are pending.`);
    return;
  }

  for (const reminder of reminders) {
    await transport.sendMail({
      from: env.SMTP_FROM,
      to: reminder.email,
      subject: `Нагадування про ТО: ${reminder.vehicle_name}`,
      text: `Вітаємо, ${reminder.full_name}. Для автомобіля ${reminder.vehicle_name} наближається процедура "${reminder.procedure_title}". Запланована дата: ${reminder.due_date ?? "уточнюється"}.`
    });

    await markReminderSent(reminder.reminder_id);
  }
}

let timer: NodeJS.Timeout | null = null;

async function runCycle(): Promise<void> {
  try {
    await processReminders();
  } catch (error) {
    console.error("Reminder worker cycle failed", error);
  }
}

async function shutdown(): Promise<void> {
  if (timer) {
    clearInterval(timer);
  }

  await pool.end();
  process.exit(0);
}

void runCycle();
timer = setInterval(() => {
  void runCycle();
}, POLL_INTERVAL_MS);

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
