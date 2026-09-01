import { Resend } from 'resend'

export async function sendTwoFactorCode(email: string, code: string, name: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  const { error } = await resend.emails.send({
    from: 'Infinite Union Ad Tracker <onboarding@resend.dev>',
    to: email,
    subject: `🔐 Код підтвердження 2FA — ${code}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#e60000;padding:28px 32px">
      <span style="color:#fff;font-size:18px;font-weight:800">Infinite Union</span>
      <div style="color:rgba(255,255,255,0.8);font-size:10px;letter-spacing:0.15em;margin-top:4px">AD TRACKER · ДВОФАКТОРНА АВТЕНТИФІКАЦІЯ</div>
    </div>
    <div style="padding:32px">
      <p style="font-size:15px;color:#111;margin:0 0 20px">Привіт, <strong>${name}</strong>!</p>
      <p style="font-size:13px;color:#555;margin:0 0 24px">Ваш код для підтвердження:</p>
      <div style="background:#111;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-family:monospace;font-size:36px;font-weight:800;letter-spacing:0.3em;color:#e60000">${code}</div>
      </div>
      <p style="font-size:12px;color:#999;margin:0 0 8px">⏱ Код дійсний <strong>10 хвилин</strong></p>
      <p style="font-size:12px;color:#999;margin:0">🔒 Якщо ви не запитували цей код — ігноруйте цей лист.</p>
    </div>
    <div style="background:#111;padding:14px 32px">
      <span style="color:rgba(255,255,255,0.5);font-size:10px">Infinite Union · Ad Tracker</span>
    </div>
  </div>
</body>
</html>`,
  })

  if (error) throw new Error(error.message)
}
