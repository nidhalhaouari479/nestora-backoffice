import nodemailer from "nodemailer";
import { serverEnv } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export async function sendTwoFactorEmail({ to, name, code, ttlMinutes }: { to: string; name: string; code: string; ttlMinutes: number }) {
  const { smtp } = serverEnv();

  if (!smtp.host) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is not configured.");
    console.info(`[2FA] SMTP not configured — code for ${to}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  await transporter.sendMail({
    from: { name: smtp.senderName, address: smtp.senderEmail || smtp.user },
    to,
    subject: `${code} — ton code d’accès Nestora Ops`,
    text: `Bonjour ${name},\n\nTon code de vérification Nestora Ops est : ${code}\nIl expire dans ${ttlMinutes} minutes.\n\nSi tu n’es pas à l’origine de cette connexion, préviens immédiatement l’équipe sécurité.`,
    html: `<!doctype html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#f6efe5;font-family:Inter,Arial,sans-serif;color:#20303a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fffaf4;border:1px solid #e7d7c6;border-radius:18px"><tr><td style="padding:32px">
<p style="margin:0;color:#069982;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Vérification renforcée</p>
<h1 style="margin:10px 0 8px;font-family:Georgia,serif;font-size:26px">Confirme ton accès.</h1>
<p style="margin:0;color:#758690;font-size:14px;line-height:1.5">Bonjour ${escapeHtml(name)}, voici ton code à six chiffres pour ouvrir le portail Nestora Ops.</p>
<p style="margin:24px 0;font-size:34px;font-weight:800;letter-spacing:10px;color:#0e3b4d">${code}</p>
<p style="margin:0;color:#758690;font-size:12px;line-height:1.5">Il expire dans ${ttlMinutes} minutes. Si tu n’es pas à l’origine de cette connexion, préviens immédiatement l’équipe sécurité.</p>
</td></tr></table></body></html>`,
  });
}
