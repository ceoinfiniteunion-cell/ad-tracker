import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return NextResponse.json({ ok: true })
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 10 * 60 * 1000)
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { twoFactorCode: code, twoFactorExpiry: expiry } })
  const transporter = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.GMAIL_USER, pass:process.env.GMAIL_PASS } })
  await transporter.sendMail({
    from: `"Ad Tracker" <${process.env.GMAIL_USER}>`,
    to: user.email,
    subject: 'Код підтвердження входу — Ad Tracker',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;"><h2 style="text-align:center;color:#111;margin:0 0 8px;">Код підтвердження</h2><p style="text-align:center;color:#666;margin:0 0 32px;">Введіть цей код для входу в Ad Tracker</p><div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;"><span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#e60000;font-family:monospace;">${code}</span></div><p style="text-align:center;color:#999;font-size:13px;">Код дійсний 10 хвилин.</p></div>`
  })
  return NextResponse.json({ ok: true })
}
