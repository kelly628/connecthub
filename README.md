# ConnectHub — Archbishop Chapelle High School

Event planning for school staff. Every event is a board of **dots** — one dot per
person, each holding that person's checklist. Fill them in, press **Connect the
Dots** to send the plan to the office, and the office approves it.

Built with React 19 + Vite, Supabase for shared data, and Netlify Functions for
anything a regular staff member isn't allowed to do.

---

## How staff use it

1. **Sign in** with the staff code the office gives out. One code for everyone.
2. **Pick your name** from the team list. That's how the app knows which tasks
   are yours.
3. **Open an event.** Each dot is one person. Tap a dot to add their tasks.
4. **Connect the Dots** when the plan is ready — that sends it to the office.
5. **The office approves it.** Only then can anyone start ticking things off.
6. **Check off your own tasks** as you finish them. Everyone sees the progress.
7. **Download a summary** as a PDF, PNG or JPEG at any time.

Two things worth knowing:

- **Only an admin can approve a project, delete one, or change the team roster.**
  This is enforced by the database, not just hidden in the interface.
- **You tick your own boxes.** An admin can tick anyone's.

---

## Local development

```bash
npm install
npm run dev
```

Opens on `http://localhost:5174` (the port is pinned in `vite.config.js`).

`npm run dev` runs the front end only — sign-in and admin actions will fail
because they need the Netlify Functions. For the whole thing:

```bash
npm run dev:full
```

That's `netlify dev`, which serves the functions alongside Vite. You'll need a
`.env` with the values from `.env.example`.

Other commands:

```bash
npm run build      # production build into dist/
npm run preview    # serve the built output
npm run lint       # eslint, should be clean
```

---

## First-time setup

### 1. Supabase

Create a new, empty Supabase project — **not** the one ChapelleHub uses. That
one holds student names, parent emails and access codes; a service-role key
leaking from this site must not be able to reach it.

Then, in the SQL editor, run:

1. `supabase/ctd-provision.sql` — tables, row-level security, the admin
   boundary, and the helper functions.
2. `supabase/ctd-storage.sql` — the two image buckets.

Both are idempotent; re-running them changes nothing.

Finally, under **Authentication → Users → Add user**, create the one shared
staff identity (auto-confirm it). Use the email and password you're going to put
in `STAFF_AUTH_EMAIL` / `STAFF_AUTH_PASSWORD`. Nobody types these — the
staff-login function uses them on the staff's behalf once the staff code checks
out.

### 2. Netlify

Connect the GitHub repo and let it build from `netlify.toml` (`npm run build`
→ `dist/`). Then set every variable in `.env.example` under **Site settings →
Environment variables**.

Only `VITE_`-prefixed variables end up in the browser bundle. Everything else
stays on the server — **never** add a `VITE_` prefix to `SUPABASE_SERVICE_ROLE_KEY`,
`STAFF_CODE`, `ADMIN_PASSWORD` or `ADMIN_TOKEN_SECRET`.

---

## How the pieces fit

```
Browser (React)  ──  supabase-js, restricted by RLS  ──▶  Supabase Postgres
                 ──  /.netlify/functions/*           ──▶  service-role (admin only)
```

**The schema goes all the way down to one row per task.** That looks like more
work than storing each project as a single JSON blob, and it's the point:
checking a box is one UPDATE to one column of one row, so two staff ticking
their own tasks at the same moment can't overwrite each other. A blob would lose
one of them silently — and that's the app's single most common interaction.

**The admin boundary lives in Postgres.** `ctd-provision.sql` revokes approve,
delete and roster writes from the ordinary staff role. Forcing the admin flag on
in devtools makes the buttons appear, and the database still refuses the write.

**Everyone's screen stays current** via a 30-second poll plus a refresh whenever
you switch back to the tab. Both skip while you're mid-edit or a dialog is open.

One honest limitation: because all staff share a single sign-in, the database
can't tell Sarah from James. "Only Sarah ticks Sarah's boxes" is a courtesy rail
in the interface, not a security boundary. What *is* enforced is the part that
matters — staff cannot approve, delete, or edit the roster.

---

## Notes for whoever works on this next

**The pink is deliberate.** `#E46E88` (Deep Blush) is the shared PacketHub brand
accent, used across all of the Hub apps with ChapelleHub as the reference.

**The CSS variable names lie, on purpose.** `--blue` holds a green (`#175933`)
and `--yellow` holds the pink. They're inherited byte-for-byte from ChapelleHub.
Renaming them here would make this the only Hub that disagrees with the
reference, across 100+ references. Leave them.

**PDF export loads on demand.** `html2canvas` and `jsPDF` are ~550 kB together
and only a small share of sessions export anything, so they're behind a dynamic
`import()` in `ProjectDetail.jsx`. It also waits on `document.fonts.ready` first
— without that, the export races the webfonts and quietly comes out in Times New
Roman, which a warm local cache hides completely.

**Test the export on the deployed URL with a cold cache**, and on a real phone.
It behaves differently there than on localhost.
