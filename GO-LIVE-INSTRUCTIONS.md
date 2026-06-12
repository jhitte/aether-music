# Go-Live Instructions — Aether Music (READY-TO-GO after these steps)

**Current status after code fixes (June 2026):** The frontend + serverless PayPal integration (/api/create-order, /api/capture-order, /api/config) is hardened, secure, and robust. All secrets stay on the server. Error messages now explicitly guide you on the exact failure modes you reported ("Failed to create order", "internal server error", "client authentication failed (live.)").

**The 3 errors you saw are almost always caused by one thing:**
> Incorrect, outdated, or Sandbox (instead of Live) PayPal Client ID + Secret set in **Vercel Environment Variables**, or PAYPAL_MODE not exactly "live".

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

## 2. Set the Three Environment Variables in Vercel (exactly)

Open the (sanitized) file `VERCEL_ENV_VALUES.txt` in this project folder as a template.

In Vercel Dashboard:
- Your project → **Settings** → **Environment Variables**
- Add **three separate variables**:

  Name: `PAYPAL_CLIENT_ID`  
  Value: `the LIVE client ID you just copied`  
  Environments: check **Production**, **Preview**, **Development**

  Name: `PAYPAL_CLIENT_SECRET`  
  Value: `the LIVE secret you just copied`  
  Environments: **all three**

  Name: `PAYPAL_MODE`  
  Value: `live`   (lowercase, no quotes, exact)
  Environments: **all three**

- Click Save / Add for each.
- **Important**: After changing env vars, you must trigger a new deployment for the api functions to pick them up.

---

## 3. Deploy the Updated Secure Code + Redeploy

The code changes (this push) include:
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

## 4. Test + Verify (do this with a real small purchase)

1. Open your live URL (https://aether-music-gamma.vercel.app or your custom domain).
2. Pick any track → click **License**.
3. Choose **Personal License ($0.99)** — lowest risk for first live test.
4. Complete checkout with a real PayPal account (or your buyer test account if still testing).
5. You should see the success modal + be able to download the MP3.
6. Check your PayPal account (seller) for the payment.
7. Also check buyer email for PayPal receipt.

**If you hit the old errors again:**
- The new code will show a much more specific toast.
- Go immediately to Vercel → latest successful Deployment → **Functions** tab.
- Click the log for `create-order` or `capture-order`.
- The raw error from PayPal + the mode it used will be printed.
- 99% of the time you'll see the exact "Client Authentication failed" coming from PayPal because the env vars still have old/sandbox values.

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
| "Failed to create order" + details        | Auth failed (above) or PayPal rejected the order payload (bad amount, currency, etc.) | See auth fix. Amounts are strictly validated to 0.99/4.99/19.99 |
| "internal server error"                   | Uncaught exception in function (often the auth throw before the new explicit handling) or network to PayPal | Check Vercel Functions logs for stack + PayPal response body. Usually auth. |
| PayPal SDK fails to load or buttons don't appear | /api/config returned no clientId (no PAYPAL_CLIENT_ID set) | Set the CLIENT_ID var + redeploy |
| Works in sandbox, fails in live           | MODE or credentials not flipped together               | Set MODE=live + live creds at the same time |

After you complete steps 1-3 above with **fresh live credentials**, the site will be fully ready to sell licenses.

If you still have problems after updating the env vars + redeploy + hard refresh, paste the **exact text** from the Vercel function log here and we can debug the remaining step.

You now have a clean, secure, production-ready Aether music licensing site. Go sell some tracks! 🎵

**Live site:** Update your Vercel deployment URL if it changed. All purchases go straight to your linked PayPal balance.
