import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const newPassword = process.env.NEW_ADMIN_PASSWORD
  if (!newPassword) {
    console.error('Вкажіть NEW_ADMIN_PASSWORD в env')
    process.exit(1)
  }
  if (newPassword.length < 12) {
    console.error('Пароль має бути мінімум 12 символів')
    process.exit(1)
  }
  const hash = await bcrypt.hash(newPassword, 12)
  const user = await prisma.user.update({
    where: { email: 'admin@youragency.com' },
    data: { password: hash }
  })
  console.log(`✓ Пароль оновлено для ${user.email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
