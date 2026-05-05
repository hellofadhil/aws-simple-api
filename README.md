# Simple API

REST API sederhana menggunakan `Hono`, `Bun`, `Prisma`, dan `PostgreSQL`.

## Setup

1. Copy `.env.example` menjadi `.env`
2. Isi `DATABASE_URL` sesuai koneksi PostgreSQL kamu
3. Generate Prisma client:

```bash
bun run prisma:generate
```

4. Jalankan migration pertama:

```bash
bun run prisma:migrate --name init
```

5. Jalankan server:

```bash
bun run dev
```

## Endpoint

- `GET /`
- `GET /health`
- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

## Contoh body

```json
{
  "title": "Belajar Hono dan Prisma",
  "done": false
}
```

## Catatan Prisma 7

Project ini memakai pola Prisma 7:

- koneksi database ada di `prisma.config.ts`
- Prisma Client digenerate ke `node_modules/@prisma/client`
- PostgreSQL diakses lewat adapter `@prisma/adapter-pg`
