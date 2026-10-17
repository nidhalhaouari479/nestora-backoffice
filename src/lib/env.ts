function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

// Server-only values. Never import this object from a Client Component.
export function serverEnv() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    twoFactorSecret: process.env.ADMIN_2FA_SECRET ?? "",
    codeTtlSeconds: readNumber(process.env.ADMIN_2FA_CODE_TTL_SECONDS, 300),
    maxAttempts: readNumber(process.env.ADMIN_2FA_MAX_ATTEMPTS, 5),
    resendSeconds: readNumber(process.env.ADMIN_2FA_RESEND_SECONDS, 30),
    smtp: {
      host: process.env.SMTP_HOST ?? "",
      port: readNumber(process.env.SMTP_PORT, 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
      senderEmail: process.env.SMTP_SENDER_EMAIL ?? "",
      senderName: process.env.SMTP_SENDER_NAME ?? "Nestora Ops",
    },
  };
}
