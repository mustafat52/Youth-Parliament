# ITM University Raipur: Youth Parliament Registration

Next.js (Vercel) + Supabase. One politician can be claimed by one student only (enforced by a database UNIQUE constraint).

## 1. Supabase
1. Create a free project at supabase.com.
2. Open SQL Editor > New query, paste `supabase/schema.sql`, and run it.
3. The file already contains the 150 Lok Sabha members from your PDF (name, party, constituency, role). Edit the final `insert` first if you want a different list.
4. Project Settings > API: copy the **Project URL** and the **service_role** key.

## 2. Run locally
```
npm install
cp .env.example .env.local     # then fill in both values
npm run dev                    # http://localhost:3000
```

## 3. Deploy on Vercel
1. Push this folder to a GitHub repo.
2. Import the repo at vercel.com/new.
3. Before deploying, add Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` (pick a long password).
4. Deploy and share the link.

## Admin panel
Open `/admin` (e.g. `https://your-site.vercel.app/admin`) and sign in with `ADMIN_PASSWORD`. You can search and filter all registrations, see stats, download a CSV for Excel, and delete a registration (which frees that politician). Sessions last 12 hours. The page is not linked from the public form and is hidden from search engines.

## Managing the event
- **See / export registrations:** Supabase > Table Editor > `registrations` > Export CSV.
- **Free a politician:** delete that student's row in `registrations`. The politician becomes available again.
- **Add or rename politicians:** edit the `politicians` table.
- Never share the service_role key or commit `.env.local`.
