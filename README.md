# Ad Tracker — Клієнтський портал аналітики реклами

## Стек
- **Next.js 14** (App Router) + TypeScript
- **PostgreSQL** + **Prisma ORM**
- **NextAuth.js** — авторизація (email/пароль)
- **Tailwind CSS** + кастомні компоненти
- **Recharts** — графіки

## Швидкий старт

### 1. Встановіть залежності
```bash
npm install
```

### 2. Налаштуйте базу даних
Відредагуйте `.env.local`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/ad_tracker"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Ініціалізуйте БД
```bash
npm run db:push     # Створює таблиці
npm run db:seed     # Заповнює тестовими даними
```

### 4. Запустіть проект
```bash
npm run dev
```

Відкрийте http://localhost:3000

## Тестові акаунти (після seed)
| Роль  | Email | Пароль |
|-------|-------|--------|
| Admin | admin@youragency.com | admin123 |
| Client | client@example.com | client123 |

## Структура проекту
```
src/
├── app/
│   ├── auth/login/          # Сторінка входу
│   ├── dashboard/           # Дашборд клієнта
│   ├── admin/
│   │   ├── clients/         # Список клієнтів
│   │   └── new-client/      # Форма нового клієнта
│   └── api/
│       ├── auth/            # NextAuth
│       ├── clients/         # CRUD клієнтів
│       └── metrics/         # Дані аналітики
├── components/
│   ├── charts/              # Recharts компоненти
│   ├── layout/              # Sidebar, Providers
│   └── ui/                  # StatCard та ін.
├── lib/                     # prisma, auth, utils
├── types/                   # TypeScript типи
└── middleware.ts            # Захист маршрутів
prisma/
├── schema.prisma            # Схема БД
└── seed.ts                  # Тестові дані
```

## Наступні кроки
1. Підключити реальні API (Meta, Google Ads, TikTok)
2. Додати вибір діапазону дат
3. Додати сторінку деталей клієнта для адміна
4. Email-нотифікації
5. Деплой на Vercel + Supabase (PostgreSQL)
