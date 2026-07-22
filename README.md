# Weather Polymarket Dashboard

Мониторинг погодных рынков Polymarket с анализом статистического преимущества (edge).

## Стек

- **Next.js 14** (App Router + TypeScript)
- **Tailwind CSS** — стили
- **Chart.js** — графики
- **Firebase Firestore** — база данных
- **Vercel Cron Jobs** — фоновое обновление данных

## Источники данных

- **weather.gov** (NWS API) — официальный прогноз погоды США
- **Open-Meteo API** — исторические данные для расчёта статической ошибки прогнозов
- **Polymarket CLOB API** — рыночные цены

## Локальный запуск

```bash
npm install
npm run dev
```

## Деплой на Vercel

1. Создайте репозиторий на GitHub и загрузите код.
2. Подключите репозиторий в [Vercel](https://vercel.com).
3. В настройках проекта Vercel добавьте переменные окружения:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `FIREBASE_SERVICE_ACCOUNT` — JSON-ключ сервисного аккаунта Firebase Admin SDK
   - `CRON_SECRET` — секретный токен для защиты cron/seed эндпоинтов
   - `USER_AGENT` — User-Agent для запросов к weather.gov API
4. Выполните деплой.
5. Заполните базу: `curl -X POST https://your-site.vercel.app/api/seed -H "Authorization: Bearer ваш-cron-secret"`
6. Cron-задача `/api/cron/update-data` будет запускаться ежедневно в 6:00 UTC.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Web App config (публичные) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON сервисного аккаунта Firebase Admin |
| `CRON_SECRET` | Secret token for cron/seed endpoint auth |
| `USER_AGENT` | User-Agent для weather.gov API |

## API Endpoints

- `GET /api/signals` — все текущие сигналы, сортировка по edge
- `GET /api/weather?cityId=N` — прогноз погоды для города
- `GET /api/markets?cityId=N` — рыночные цены для города
- `GET /api/cities` — список городов
- `POST /api/seed` — заполнить БД городами и рынками (требуется CRON_SECRET)
- `POST /api/cron/update-data` — обновить данные (cron)

## Города

В проекте настроены 44 города по всему миру. Список определён в `src/lib/cities.ts`.
