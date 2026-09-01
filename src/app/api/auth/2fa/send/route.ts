import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch {}
  
  const email = body.email?.toLowerCase()?.trim()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ ok: true })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.user.update({
    where: { email },
    data: { twoFactorCode: code, twoFactorExpiry: expiry }
  })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
  })

  try {
    await transporter.sendMail({
      from: `"Ad Tracker" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Код підтвердження — Ad Tracker',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="text-align:center;color:#111;">Код підтвердження</h2>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#e60000;font-family:monospace;">${code}</span>
        </div>
        <p style="text-align:center;color:#999;font-size:13px;">Код дійсний 10 хвилин.</p>
      </div>`
    })
  } catch (e) {
    console.error('[2FA SEND ERROR]', e)
    return NextResponse.json({ error: 'Помилка відправки листа: ' + String(e) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
