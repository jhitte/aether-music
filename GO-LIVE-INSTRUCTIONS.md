# Go-Live Instructions (after your nap)

The site has been heavily secured:

- PayPal order creation and capture now happen on **your server** (Vercel Functions in /api).
- Client Secret never leaves the server.
- Client ID is served dynamically.
- Clear license terms shown during checkout and after purchase.
- Payment must be verified server-side before download is allowed.

## Required Steps to Make It Live

1. **Get your PayPal Client Secret**
   - Go to https://developer.paypal.com/dashboard/applications
   - Open your "Aether Music" app
   - Under "API Credentials" or the app details, click to show the **Client Secret** (not just the ID).

2. **Add Environment Variables in Vercel**
   - Go to your Vercel project (aether-music or whatever it's called)
   - Settings → Environment Variables
   - Add these (Production + Preview + Development if you want local testing):
     - Name: `PAYPAL_CLIENT_ID`
       Value: `Ac713iP1PElCe_ZNUfNt_bum69VRfXWATIYRs7tv4V2vcPtGXuLaZAHi6M-hmJrRGE-DPz1syDIpYJNR` (or your current public ID)
     - Name: `PAYPAL_CLIENT_SECRET`
       Value: (paste the secret you just got from PayPal — keep this private!)

3. **Redeploy**
   - Vercel should auto-detect the new api/ folder and trigger a deployment when you push (or trigger manually).
   - After deploy, hard refresh the live site.

4. **Test**
   - Go through a full purchase on the live site (start with the $0.99 tier if testing with real money).
   - Confirm the download works after payment.

5. **Optional but recommended**
   - In PayPal Developer Dashboard, restrict your app to only your Vercel domain(s).
   - Monitor your PayPal transactions for the first few sales.

The site should now be much more secure for taking real payments while still being a mostly static site.

If anything breaks, check the Vercel Function logs (Deployments → the latest one → Functions tab).

Enjoy the nap! The site should be ready to promote when you're back.
