# Weather Polymarket Dashboard

Мониторинг погодных рынков Polymarket с анализом статистического преимущества (edge).

## Стек

- **Next.js 14** (App Router + TypeScript)
- **Tailwind CSS** — стили
- **Chart.js** — графики
- **Prisma ORM** — работа с БД
- **Vercel Postgres / Supabase** — база данных
- **Vercel Cron Jobs** — фоновое обновление данных

## Источники данных

- **weather.gov** (NWS API) — официальный прогноз погоды США
- **Open-Meteo API** — исторические данные для расчёта статической ошибки прогнозов
- **Polymarket CLOB API** — рыночные цены

## Локальный запуск

```bash
npm install
cp .env.local.example .env.local
# отредактируйте .env.local — укажите DATABASE_URL
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

## Деплой на Vercel

1. Создайте репозиторий на GitHub и загрузите код.
2. Подключите репозиторий в [Vercel](https://vercel.com).
3. В настройках проекта Vercel добавьте переменные окружения:
   - `DATABASE_URL` — строка подключения к Vercel Postgres или Supabase
   - `CRON_SECRET` — секретный токен для защиты cron-эндпоинта
   - `USER_AGENT` — User-Agent для запросов к weather.gov API
4. Выполните деплой.
5. Прогоните миграции БД: `npx prisma migrate deploy`
6. Заполните города: `npx tsx prisma/seed.ts`
7. Cron-задача `/api/cron/update-data` будет запускаться ежедневно в 6:00 UTC автоматически.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CRON_SECRET` | Secret token for cron endpoint auth |
| `USER_AGENT` | User-Agent for weather.gov API |

## API Endpoints

- `GET /api/signals` — все текущие сигналы, сортировка по edge
- `GET /api/weather?cityId=N` — прогноз погоды для города
- `GET /api/markets?cityId=N` — рыночные цены для города
- `GET /api/cities` — список городов
- `POST /api/cron/update-data` — ручной запуск обновления данных (cron)

## Города

В проекте настроены 44 города по всему миру. Список определён в `src/lib/cities.ts`.
