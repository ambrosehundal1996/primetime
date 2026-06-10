# Google Calendar Setup

Primetime reads your Google Calendar to find busy time and open slots, and can **create events** when you drag tasks onto the day schedule on `/today`.

## What you need

| Env variable | Purpose |
|--------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Long-lived token for server-side access |
| `GOOGLE_CALENDAR_ID` | Calendar to read/write (default: `primary`) |
| `CALENDAR_TIMEZONE` | Optional — display timezone (default: `America/Los_Angeles`) |

Set all four Google vars in `.env.local` locally and in the Vercel dashboard for production.

---

## Step 1: Create a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Calendar API**:
   - APIs & Services → Library → search "Google Calendar API" → Enable

---

## Step 2: Configure OAuth consent screen

1. APIs & Services → **OAuth consent screen**
2. User type: **External** (fine for personal use)
3. Fill in app name, support email
4. Scopes — add both:
   - `https://www.googleapis.com/auth/calendar.readonly` (read events)
   - `https://www.googleapis.com/auth/calendar.events` (create/update events when scheduling tasks)
5. Test users: add your Google account email (required while app is in "Testing" mode)

---

## Step 3: Create OAuth credentials

1. APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**
2. Application type: **Web application**
3. Authorized redirect URIs — add:
   - `https://developers.google.com/oauthplayground` (for getting the refresh token)
4. Save and copy **Client ID** and **Client Secret**

---

## Step 4: Get a refresh token

Use Google's OAuth Playground (easiest for a single-user app):

1. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) top right
3. Check **"Use your own OAuth credentials"**
4. Enter your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
5. In Step 1, find **Google Calendar API v3** → select:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click **Authorize APIs** → sign in with your Google account → Allow
7. Click **Exchange authorization code for tokens**
8. Copy the **Refresh token** from the response

The refresh token does not expire unless you revoke access. Store it in `GOOGLE_REFRESH_TOKEN`.

**Upgrading from read-only:** If you previously authorized with only `calendar.readonly`, you must re-run the playground with `calendar.events` included and replace `GOOGLE_REFRESH_TOKEN`.

---

## Step 5: Add to environment

```bash
# .env.local
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REFRESH_TOKEN=1//0xxxxxxxx
GOOGLE_CALENDAR_ID=primary
CALENDAR_TIMEZONE=America/Los_Angeles
```

Redeploy on Vercel after adding or updating these.

---

## Step 6: Run the migration

Apply `supabase/migrations/004_google_event_id.sql` in the Supabase SQL editor. This adds `google_event_id` on `action_tasks` so rescheduled tasks update the same Google event.

---

## Step 7: Verify it works

```bash
# Local (with dev server running)
curl "http://localhost:3000/api/calendar/events?date=2026-06-07"
```

Or open `/today` — you should see today's Google events in the day schedule. Drag an unscheduled task onto a time slot; it should appear on your Google Calendar.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Empty events, no error | Check refresh token is valid; re-run OAuth Playground |
| `invalid_grant` | Refresh token revoked — generate a new one |
| `access_denied` on authorize | Add your email as a test user on consent screen |
| Works locally, not on Vercel | Confirm all env vars are set in Vercel + redeployed |
| Wrong calendar | Set `GOOGLE_CALENDAR_ID` to your calendar's ID (find it in Google Calendar settings → Integrate calendar) |
| "write access required" when scheduling | Re-authorize with `calendar.events` scope and update refresh token |
| `insufficientPermissions` | Same as above — token only has read scope |

---

## Security notes

- Never commit tokens to git (`.env.local` is gitignored)
- The refresh token grants read/write access to your calendar — treat it like a password
- Primetime only writes events when you explicitly drag a task onto the schedule
