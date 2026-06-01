# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Vibe ERP is a deliberately minimal **Accounts Payable** slice of an ERP, built as an interview/take-home sandbox. A `Bill` represents money owed to a vendor. The app has three screens: a dashboard (Total Outstanding), a bills table (with "days past due"), and a CSV import page that ingests `fixtures/bills.csv`.

## Commands

```bash
npm run dev      # start dev server on :3000 — note it forces TZ=UTC (see "Dates" below)
npm run build    # production build
npm start        # run the production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npm run migrate  # prisma migrate dev && prisma generate — run after editing schema.prisma
npm run seed     # wipe Bills, reseed hardcoded bills, then import fixtures/bills.csv
npm run reset    # rm dev.db && migrate && seed — the fastest way to a clean, known DB state
```

There is **no test runner configured** (no Jest/Vitest, no test files). Adding one means installing it and a test script; there is currently no "run a single test" command.

## Architecture

- **Stack:** Next.js 15 (App Router), React 18, TypeScript, Prisma ORM over **SQLite** (`prisma/dev.db`), Tailwind v4. `DATABASE_URL` lives in `.env`.
- **No backend tier / no global state.** Server Components query the database directly via Prisma — e.g. `src/app/page.tsx` and `src/app/bills/page.tsx` import `prisma` and call it inline, then serialize results (Decimal → string, Date → ISO string) before passing to `"use client"` leaf components (`BillsTable.tsx`, `ImportButton.tsx`). SWR is a dependency but is not actually used.
- **Mutations go through API routes** under `src/app/api/`: `POST /api/import` (reads the fixture CSV and inserts Bills), `GET /api/profile` (returns the first user). There is no auth and a single hardcoded user (`test@test.com`).
- **Shared logic in `lib/`:** `db.ts` (Prisma singleton, globalized in dev), `csv.ts` (CSV split + row parsing), `dates.ts` (`daysPastDue`).
- **Data model** (`prisma/schema.prisma`): `User` and `Bill` are **not related** — bills are not scoped to a user. `Bill.amount` is `Decimal`; `invoiceNumber` is optional and **not unique**.

## Import path alias

`@/*` maps to the **project root**, not `src/`. So `@/lib/db` resolves to `./lib/db` while pages live under `./src/app`. Keep `lib/` at the repo root, not inside `src/`.

## Critical gotchas (these are intentional landmines in this codebase)

- **The CSV spec does not match the actual fixture.** `docs/bill_format_spec.pdf.txt` and the comments/positional indexing in `lib/csv.ts` assume the order `Vendor, Amount, DueDate, InvoiceNumber`. The real `fixtures/bills.csv` header is `vendor, amount, invoice_date, invoice_number, payment_method, tax_id, shipping_address, due_date`. As written, `parseBillRow` reads `row[2]` (the *invoice date*) as the due date and never reads the real `due_date` column (index 7). Import "succeeds" but stores wrong due dates. **Parse by header name, not by position**, and treat the file (not the stale spec) as truth.
- **Money is summed as a float.** `src/app/page.tsx` does `sum + Number(b.amount)`, and the seed uses 3-decimal amounts (`99.995`, `250.005`). Use Decimal arithmetic / integer cents and format to 2dp; never convert money to JS `number`.
- **Import is not idempotent.** `/api/import` always `create`s; re-running (the UI button literally offers "(re-)import") duplicates bills because `invoiceNumber` has no unique constraint and there is no upsert.
- **CSV parsing is naive.** `splitCsv` uses `line.split(",")` with no quote/escape handling, so any quoted field containing a comma breaks alignment.
- **Dates are timezone-fragile.** `new Date("YYYY-MM-DD")` is parsed as UTC midnight, and `BillsTable` renders with `toLocaleDateString()` in the *client's* timezone, so dates can shift a day. The dev script pins `TZ=UTC` to mask this in development. `daysPastDue` also returns negatives for not-yet-due bills.
- **Import is not transactional/validated.** One malformed row throws mid-loop and 500s, partially importing.

When changing schema, run `npm run migrate`; when you need a clean DB to verify behavior, `npm run reset`.
