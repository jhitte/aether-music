# Go-Live Instructions (after your nap)

The site has been heavily secured:

- PayPal order creation and capture now happen on **your server** (Vercel Functions in /api).
- Client Secret never leaves the server.
- Client ID is served dynamically.
- Clear license terms shown during checkout and after purchase.
- Payment must be verified server-side before download is allowed.

## Required Steps to Make It Live

1. **Add Environment Variables in Vercel (easiest way)**
   - Open the file `VERCEL_ENV_VALUES.txt` in this folder.
   - Copy the two variables exactly as they are.
   - Go to your Vercel project dashboard → Settings → Environment Variables.
   - Add both variables (select Production, Preview, and Development environments).
   - Save.

2. **Redeploy**
   - Vercel will automatically detect the new `/api` functions.
   - Trigger a new deployment (or just push any small change if it doesn't start automatically).
   - After the deployment succeeds, hard refresh your live site.

3. **Test the full flow**
   - Browse the site on the live URL.
   - Click "License" on a track.
   - Complete a real purchase (start with the $0.99 Personal License for testing if desired).
   - Confirm that after payment you get the "Thank You" screen and the MP3 downloads successfully.

4. **Recommended security step**
   - In the PayPal Developer Dashboard, restrict your app to only your Vercel domain(s) (e.g. https://aether-music-gamma.vercel.app).
   - Monitor your PayPal account for the first few transactions.

The site is now using secure server-side PayPal order creation and capture. The secret never touches the browser.

If anything goes wrong after deploy, check the Function logs in Vercel (go to the latest deployment → Functions tab).

When you wake up, just follow steps 1-3 above and you should be ready to promote and sell tracks. Sweet dreams!
