# New app checklist

*The five steps Adam runs by hand for a new app (SPEC item 8), in his order, then the hand-off to the agents. Written 2026-11-07. This file is the record. `docs/new-app-checklist.html` is the page built from it by `node scripts/build-checklist-page.mjs`, which copies every command from here.*

- Every command is Windows **cmd**, not PowerShell. Run them in one window, starting in the folder that holds your repos. Step 1 clones the new repo there. After it, every command runs inside the new repo's folder (in a new window, run step 1's `cd` lines again). Paste a block into the window with Ctrl+V or a right-click: each line runs as it lands, and the last one waits for Enter.
- Tick a step when its Expect box matches what you see. Fill a field when its step gives you the value: every command on the page picks it up. Ticks and fields are saved.
- About 40 minutes in one sitting. No time of day matters: nothing here touches an existing project or any app's data.
- What is on you is only what needs your accounts or your consent. Everything after step 5 is the agents', except the two items the hand-off names.

**Never paste a key, password or token into a message, a file in the repo, or a field on this page. A key goes only into the cmd window or the dashboard form it belongs to.**

---

## 1. GitHub: a new repo from the template

Decide public or private for this app before you create the repo:
- Private: GitHub's required checks on a private repo need a paid GitHub plan (about $4 a month).
- Public: a public repo shows the app's code, never its data, to anyone.
- The demo and client apps carry the product core, your main business asset; the demo's spec decides its repo.

1. Open [the starter](https://github.com/adamjuszczyk/starter) and press **Use this template**, then **Create a new repository**.
2. Choose the owner, give the repo its name, choose **Public** or **Private**, leave **Include all branches** unticked, and press **Create repository**.
3. In the new repo, open **Settings** > **General** > **Pull Requests** and tick **Automatically delete head branches**. A new repo does not inherit it from the template.

Field `<owner>`: The GitHub account or organization that owns the new repo.

Field `<repo>`: The new repo's name.

Field `<repos-folder>`: The folder that holds your repos, for example `C:\Users\you\repos`.

```cmd
cd /d "<repos-folder>"
git clone https://github.com/<owner>/<repo>.git
cd <repo>
git branch --show-current
git log --oneline -3
dir /b
```

Expect:
- The starter's page shows a green **Use this template** button. It is there because the starter is marked as a template repository (your to-do, done 2026-11-06).
- The new repo's **Settings** > **General** shows **Automatically delete head branches** ticked.
- `git clone` ends without an error. For a private repo it may open a GitHub sign-in window the first time: sign in as yourself.
- `git branch --show-current` prints `main`.
- `git log` prints one line, `Initial commit`: a repo made from a template starts with one commit.
- `dir /b` lists, among others, `app.config.ts`, `package.json`, `src` and `supabase`.

Stop if:
- The starter's page has no **Use this template** button. The template flag is off. Switch it on under **Settings** > **General** > **Template repository** on the starter, then start step 1 again.
- `git clone` says the repository was not found, or keeps asking for a password. Check the `<owner>` and `<repo>` fields; if they are right, stop and tell me.
- `git branch --show-current` prints anything but `main`, or `git log` prints more than one line.

---

## 2. Supabase: the project, sign-ups off, the first account

Everything but the last two blocks of commands is in the Supabase dashboard.

1. Press **New project**, in the organization the app belongs to. Name it after the app. Let the dashboard generate the database password and keep it in your password manager; nothing in this checklist needs it.
2. Choose an EU region, for example Central EU (Frankfurt). A project's region cannot be moved later, so check it before you press **Create new project**. Wait until the project is ready (a few minutes).
3. Open **Authentication** > **Sign In / Providers**. Under **User Signups**, switch **Allow new users to sign up** off and save. Leave the **Email** provider on. The repo's `supabase/config.toml` already says sign-ups off, but a hosted project never reads it (the file has no `[remotes]` block), so this switch is the one that counts. With sign-ups on, a stranger could create an account.
4. Open **Authentication** > **Users** > **Add user** > **Create new user**. Enter the first account's e-mail and a password, tick **Auto Confirm User**, and press **Create user**.
5. Copy the project's reference id into the field below: the 20 letters after `/project/` in the dashboard's address. The anon key is under **Project Settings** > **API Keys** (the `anon` `public` key; on a project that shows only a publishable key, use that one).

Field `<project-ref>`: The project's reference id, 20 letters.

The key is public by design, but it still goes only into the cmd window. The first command asks for it and waits:

```cmd
set /p ANON_KEY=Paste the anon key, then Enter:
```

Then, in one block:

```cmd
curl -s https://<project-ref>.supabase.co/auth/v1/settings -H "apikey: %ANON_KEY%" > "%TEMP%\auth-settings.json"
type "%TEMP%\auth-settings.json"
echo.
findstr /r /c:"disable_signup.:true" "%TEMP%\auth-settings.json" >nul && echo OK sign-ups are off || echo STOP sign-ups are still on
findstr /r /c:"email.:true" "%TEMP%\auth-settings.json" >nul && echo OK e-mail sign-in is on || echo STOP e-mail sign-in is off
set ANON_KEY=
```

Expect:
- The first block shows its prompt and waits. After you paste the key and press Enter, the second block prints one line of JSON, an empty line, then two `OK` lines.
- The JSON line holds `"disable_signup":true` and, among the providers listed inside `"external":{…}`, `"email":true`.
- **Authentication** > **Users** lists the first account.

Stop if:
- A line starts with `STOP`. The switch did not save, or it is on another project. Check **User Signups**, wait a minute, and run the second block again. If it still says `STOP`, tell me.
- The JSON line is a message about the key (for example `Invalid API key`), or `curl` printed nothing: the key or the `<project-ref>` field is wrong.
- You created the project in a non-EU region. It cannot be moved: delete it (nothing uses it yet), make another, and start the step again.

---

## 3. Supabase to GitHub: migrations deploy by themselves

Everything but the last block is in the Supabase dashboard.

1. Open **Project Settings** > **Integrations** > **GitHub Integration** and press **Authorize GitHub**. On GitHub, press **Authorize Supabase** (if it asks which repositories, include the new repo).
2. Back on the Integrations page, choose the new repo. Set **Working directory** to `.` (the `supabase/` folder is at the repo root). The production branch is `main`.
3. Switch **Deploy to production** on. Leave **Automatic branching** off: it adds a paid preview environment for every pull request, which SPEC item 8 does not ask for, and the `migration-replay` check already covers the migrations.
4. Press **Enable integration**.

Nothing deploys yet: `supabase/migrations` is empty. The first migration the first build adds is the first deploy, and the agents read that run.

```cmd
git fetch origin
git ls-tree -r --name-only origin/main supabase/migrations
```

Expect:
- The Integrations page shows the new repo, the production branch `main` and **Deploy to production** switched on.
- `git ls-tree` prints `supabase/migrations/.gitkeep`: the folder the link deploys from exists on `main`.

Stop if:
- The new repo is not in the list: the Supabase GitHub app has no access to it. On GitHub, open **Settings** > **Applications** > **Supabase** > **Configure**, add the repo, and reload.
- **Enable integration** is refused, or asks for a paid plan: tell me.
- The production branch is not `main`.

---

## 4. Vercel: the app online

Everything but the last command is in the Vercel dashboard.

1. Press **Add New...** > **Project**, find the new repo under **Import Git Repository** and press **Import**. If the repo is not listed, press **Adjust GitHub App Permissions** and add it.
2. Leave the framework (Vite) and the build settings as Vercel detects them.

Open **Environment Variables** and add both of these before the first deploy. Vite reads them while it builds, so a variable added later needs a redeploy:
- `VITE_SUPABASE_URL`: the **Project URL** from Supabase **Project Settings** > **API** (it ends in `.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: the anon key from step 2, pasted into this form and nowhere else.

3. Press **Deploy** and wait for the build to finish.
4. Copy the production address Vercel shows into the field below, without `https://`.

Field `<vercel-url>`: The app's address on Vercel without `https://`, for example `my-app.vercel.app`.

```cmd
curl -s -o NUL -w "%{http_code}\n" https://<vercel-url>/
```

Expect:
- The deployment reads **Ready** and **Production**, from the commit `Initial commit`. It took about a minute: a real build, not a 2-second **Canceled** row.
- `curl` prints `200`.

Stop if:
- The deployment reads **Error** or **Canceled**: open its log and send me the last lines.
- `curl` prints anything but `200`: send me the number.

---

## 5. Check: the app opens and the first account signs in

Open the app on its address and sign in with the first account.

```cmd
start https://<vercel-url>/
```

Expect:
- The sign-in page: the title **Zaloguj się**, the fields **E-mail** and **Hasło**, and no "create an account" link.
- After you sign in, the app opens on its only tab, **Ustawienia**, with **Konto** (and **Wyloguj się**), **Wygląd** and **O aplikacji**. At the bottom the build line reads `Wersja 0.1.0 · build`, a hash and a time.

Stop if:
- The sign-in page shows `Nieprawidłowy e-mail lub hasło.` for an e-mail and password you know are right.
- The sign-in page shows `Nie udało się zalogować. Powód:` and a reason (the reason is Supabase's, in English): send me the reason. `Email not confirmed` means the account was not auto-confirmed in step 2: open it under **Authentication** > **Users** and confirm it, or create it again with **Auto Confirm User** ticked.
- The sign-in page shows `Brak połączenia. Spróbuj ponownie, gdy wróci.` while your internet works: the app cannot reach the project, so `VITE_SUPABASE_URL` is wrong. Fix it in Vercel, redeploy, and try again.
- The page is blank: the two variables were missing when Vercel built it. Add them and redeploy.

---

## After step 5: the hand-off to the agents

Steps 1 to 5 leave a repo, a project and a deployed sign-in. Everything after them is the agents'. The first build's session starts from this list. Two items need you: the first (it needs the project) and the sixth (it needs your token and your consent).

1. **`supabase/postgres-image`**: the project's Postgres version, so the replay runs the database production runs. The two blocks below print it. Tell the session the number; it writes `supabase/postgres:<number>` into the file.
2. **`app.config.ts`**: the app's name, short name, description, theme colour, icons and locale, with the three files in `public/` replaced.
3. **`CONTEXT.md`, "Repo facts"**: the three lines the agent definitions read: `Base branch:`, `Default branch:` and `Staging:`. A new app has `Staging: no` until it has real users.
4. **`design/0.1/`**: the frozen prototype's reference screenshots. They stay in the repo as the design reference until the app's first prototype replaces them.
5. **`supabase/verify-rls-seed.sql`** (optional): the app's replay seed for verify-rls, two users and a row in each table. The first build that adds a table adds it; without it a non-empty access list fails.
6. **The environment for the app's sessions**: a personal cloud environment for this app, so its sessions do not share the Default one. It holds the read-only Docker Hub token as a network secret for `auth.docker.io` (type `basic`). The session asks for it through a secure form: the token never enters a chat or a file (your answer to Q1, 2026-11-06).
7. **The first build's TASKS**: the app's own SPEC.md and TASKS.md, written for the app. The starter's copies are gone after item 8.
8. **The new app's first commit: the starter's own records out.** "Use this template" copies every file, the starter's build history included, and a client's repo must not hold it. Before anything else, the first session's first commit resets `CONTEXT.md`, `DECISIONS.md`, `LEARNINGS.md`, `NEXT.md` and `HISTORY.md` to their empty templates (each file's title and header paragraph only, every entry removed; `CONTEXT.md` keeps its section headings and gets the "Repo facts" lines of item 3), and deletes the starter's `SPEC.md`, `TASKS.md` and every `docs/release-*-notes.md`. `RULES.md`, the skills, the agent definitions, `design/0.1/` and this checklist stay. The commit's message names the starter version the app was made from (for example `From the starter v0.1.0`), so the app can later tell which starter parts it has.

The first block may ask for the database password: press Enter, it is not needed. It is a block of its own because it can wait for an answer.

```cmd
npx --yes supabase@2.119.0 link --project-ref <project-ref>
```

```cmd
type supabase\.temp\postgres-version
git status --short
```

Expect:
- The first block prints `Finished supabase link.` If it says `Access token not provided`, run `npx --yes supabase@2.119.0 login` (it opens a browser), then run it again.
- The second block prints one line, the version (for example `17.6.1.155`), and then nothing: `link` writes only the git-ignored `supabase\.temp` folder.

Stop if:
- `git status --short` prints a changed file. Do not commit it; tell me.
- The second block prints anything but a version number.
