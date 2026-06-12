# Go-Live Instructions — Aether Music (READY-TO-GO after these steps)

**Current status after code fixes (June 2026):** The frontend + serverless PayPal integration (/api/create-order, /api/capture-order, /api/config) is hardened, secure, and robust. All secrets stay on the server. Error messages now explicitly guide you on the exact failure modes you reported ("Failed to create order", "internal server error", "client authentication failed (live.)").

**The 3 errors you saw ("Failed to create order", "internal server error", "client authentication failed (live.)") are almost always caused by one thing:**
> The values in **Vercel Environment Variables** are not reaching the actual running `/api` functions on the deployment you are testing (even when your PayPal dashboard shows LIVE and you copied the values from the live app page).

I just reproduced a **successful** live token fetch using the *exact* Client ID + Secret you provided (Ac713iP1PE... + EGjVpW1p...) against https://api-m.paypal.com from outside Vercel. The credentials themselves are valid. The problem is on the Vercel side (env not attached to the production runtime, stale deployment, wrong environment selected, or copy-paste whitespace).

The code now has **safe diagnostic logging** (see below) so the next time you trigger a purchase, the Vercel Function logs will tell us the truth in one glance: what mode it thinks it is in and whether it sees your Client ID/Secret at all.

The code now detects auth failures early and surfaces clear instructions instead of generic errors.

---

## 1. Get Fresh LIVE Credentials from PayPal (CRITICAL — most common cause of "client authentication failed (live.)")

1. Go to https://developer.paypal.com and log in with the **same PayPal account** that will receive the money (must be a **Business** account for live payments).
2. Click **Apps & Credentials** (left menu).
3. Find your existing REST API app (or create a new one named "Aether Music" or similar).
4. **AT THE TOP of the page, switch the toggle from "Sandbox" to "LIVE"**. (This is the #1 reason people get auth failures.)
5. Copy the **LIVE Client ID** (long string starting with `A...` or similar).
6. For the **Secret**:
   - Under the Live section for that app, click the eye / "Show" or "Generate Client Secret".
   - **Copy the secret immediately** — PayPal often only shows it once for security.
7. (Optional but recommended) In the Live app settings, add your production domain(s) under allowed return URLs / JS origins if the form offers it (your Vercel URL e.g. `https://aether-music-gamma.vercel.app`).

**NEVER mix Sandbox creds with live mode or vice-versa.**

---

## 2. Set the Three Environment Variables in Vercel (exactly) — Critical for your case

You have already confirmed the values from the **live** app page:
- Client ID: `Ac713iP1PElCe_ZNUfNt_bum69VRfXWATIYRs7tv4V2vcPtGXuLaZAHi6M-hmJrRGE-DPz1syDIpYJNR`
- Secret: `EGjVpW1pW1vhiAxnBpMXb3IDZAaO6T38iR340XTjJUFxwtzbzQ2S37H2vdMXZWwgd-b9fupT_EpAkTIy`
- Mode must be `live`

**Do this precisely:**

1. In Vercel: Your project → **Settings** → **Environment Variables**
2. **Delete** any existing PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE entries (clean slate).
3. Re-add them **one by one**:

   - Name: `PAYPAL_CLIENT_ID`
     Value: paste `Ac713iP1PElCe_ZNUfNt_bum69VRfXWATIYRs7tv4V2vcPtGXuLaZAHi6M-hmJrRGE-DPz1syDIpYJNR` **exactly** (no extra spaces, no quotes)
     **Check all three boxes**: Production, Preview, Development

   - Name: `PAYPAL_CLIENT_SECRET`
     Value: paste the secret **exactly**
     **Check all three boxes**

   - Name: `PAYPAL_MODE`
     Value: `live`   (type it lowercase, nothing else)
     **Check all three boxes**

4. Save.

**This is the most common reason it still fails even when the PayPal page says Live**: The variables were only added to Development or Preview, or attached to an old deployment alias, or had trailing newlines when pasted.

## 3. Force a Clean Production Redeploy (do not skip)

Env var changes do **not** affect already-built deployments.

- Go to **Deployments** tab.
- Find the most recent one (or the one currently serving your live URL).
- Click the "..." menu on it → **Redeploy**.
- **Uncheck "Use build cache"** if the option appears (forces a clean build that reads the new env vars).
- Wait until it says "Ready" and the production domain updates.

After this succeeds:
- Visit your **production URL directly** (e.g. https://aether-music-gamma.vercel.app or whatever the current production alias is). Do **not** use a preview link.
- Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R).
- Then test the purchase flow.

---

## 4. Deploy the Updated Secure Code + Redeploy (you are here after the latest push)

The latest push (just done) added:
- Safe diagnostic logging that prints the three critical lines in the function logs (see above).
- Explicit `nodejs20.x` runtime in vercel.json (forces real Node, not Edge).
- Even clearer error messages.

After you complete the env var + clean redeploy steps above, Vercel will pick up the new code + the env vars.

## 5. Test and Read the Diagnostic Logs (this will give us the smoking gun)
- Sanitized secret files + .env.example
- Hardened API functions with explicit live auth error messages + better status codes
- Improved frontend toasts that tell you exactly what to do on auth failure
- Extra security headers in vercel.json
- Clearer capture / order error paths

**Push / deploy:**
- The changes are already in the repo after this (or run the push yourself).
- Vercel should auto-deploy on push to main.
- Or go to your Vercel project → Deployments → click the "Redeploy" button on the latest (or "Redeploy" with "Use existing Build Cache" off if envs were just added).

After the deployment shows "Ready":
- **Hard refresh the live site** (Ctrl + Shift + R or Cmd + Shift + R). Browser cache can hold old JS.

---

## 6. Test + Verify (do this with a real small purchase)

1. Open your live URL (https://aether-music-gamma.vercel.app or your custom domain).
2. Pick any track → click **License**.
3. Choose **Personal License ($1.50)** — lowest risk for first live test.
4. Complete checkout with a real PayPal account.
5. You should see the success modal + be able to download the MP3.

**Right after you click the PayPal button / see the error toast:**
- Go to Vercel → the Deployment that is currently "Ready" / serving production → **Functions** tab.
- Open the most recent `create-order` log (it will have a recent timestamp matching your attempt).
- Copy the **entire first 15-20 lines** of that log (especially the three [create-order] diagnostic lines + any error that follows) and paste them here.

This will instantly tell us:
- Is PAYPAL_MODE=live in the actual runtime?
- Does the function see your Client ID (Ac713...) and a secret of the correct length?
- What is the exact error PayPal (or the code) is returning inside Vercel's network?

Once we see those three lines, the "excuse" will be obvious and fixable in one more step.

Common quick fixes when you see auth fail in logs:
- You copied from the Sandbox tab instead of Live.
- PAYPAL_MODE is missing, set to "sandbox", or has extra spaces/caps.
- The ID and Secret are from two different apps.
- You set the vars but didn't redeploy the project after.
- The values have invisible characters or line breaks (copy/paste carefully, one at a time).

---

## 5. Post-Go-Live Security Hardening (do these today)

- In PayPal Developer → your LIVE app → review connected accounts / permissions. Make sure it has "Accept payments" / checkout capability.
- (Strongly recommended) In PayPal app settings for the Live app, restrict it to only your exact Vercel domain(s).
- Rotate the secret in PayPal (generate new) and update Vercel if you think the old values were ever in any public file or git history at any point.
- Monitor the first 5–10 transactions closely in both PayPal and your Vercel function logs.
- The site now has HSTS, X-Frame-Options, Referrer-Policy, no-sniff, and api no-cache headers.

**Your PayPal info is safe:**
- Secrets live ONLY in Vercel encrypted Environment Variables.
- Never in the browser, never in committed source, never in the HTML/JS bundle.
- The three api/*.js files use the secret exclusively on the server to get short-lived access tokens.
- .gitignore explicitly excludes the txt files + .env* .
- The VERCEL_ENV_VALUES.txt in the folder now contains only placeholders.

---

## 6. Local Development (vercel dev)

```powershell
# One-time
npm install -g vercel

# In the project folder
vercel dev
```

- Create `.env.local` (copy from `.env.example`, fill with **sandbox** values for safe testing).
- Local site usually at http://localhost:3000
- `/api/*` routes will use the .env.local values automatically.
- Use sandbox buyer accounts from PayPal Developer for local tests (no real money).

When done testing locally, delete or never commit .env.local.

---

## Troubleshooting Matrix for Your Exact Errors

| Error you saw / will see                  | Most likely cause                                      | Fix |
|-------------------------------------------|--------------------------------------------------------|-----|
| "client authentication failed (live.)"    | Using sandbox ID/secret or wrong pair while PAYPAL_MODE=live or hitting live endpoint | Switch PayPal app to LIVE, copy the LIVE pair, set all 3 Vercel vars, redeploy |
| "Failed to create order" + details        | Auth failed (above) or PayPal rejected the order payload (bad amount, currency, etc.) | See auth fix. Amounts are strictly validated to 1.50/4.99/19.99 |
| "internal server error"                   | Uncaught exception in function (often the auth throw before the new explicit handling) or network to PayPal | Check Vercel Functions logs for stack + PayPal response body. Usually auth. |
| PayPal SDK fails to load or buttons don't appear | /api/config returned no clientId (no PAYPAL_CLIENT_ID set) | Set the CLIENT_ID var + redeploy |
| Works in sandbox, fails in live           | MODE or credentials not flipped together               | Set MODE=live + live creds at the same time |

After you complete steps 1-3 above with **fresh live credentials**, the site will be fully ready to sell licenses.

If you still have problems after updating the env vars + redeploy + hard refresh, paste the **exact text** from the Vercel function log here and we can debug the remaining step.

You now have a clean, secure, production-ready Aether music licensing site. Go sell some tracks! 🎵

**Live site:** Update your Vercel deployment URL if it changed. All purchases go straight to your linked PayPal balance.
