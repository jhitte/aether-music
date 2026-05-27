# Aether — Premium AI Music Licensing Site

A clean, professional public website for selling licenses to your AI-generated music tracks.

**Production Stack:**
- **Frontend**: Vercel (static site)
- **Media (audio + covers)**: Cloudflare R2 (`aether-music` bucket)

---

## Your R2 Public URL

You provided this public development URL:

**Base URL:** `https://pub-d36e4f8ccd12409cb5f92373630441e1.r2.dev`

All your audio and cover files will be served from here.

---

## Recommended Folder Structure in R2

Inside your `aether-music` bucket, create this structure:

```
aether-music/
├── audio/
│   ├── angela_open_up_your_heart.mp3
│   └── she_believed_in_me.mp3
└── covers/
    ├── angela_open_up_your_heart.jpg
    └── she_believed_in_me.jpg
```

**Upload your real files here.**

---

## How to Use This URL in the Site

### 1. Update `tracks.json`

All `audio` and `cover` fields should use your R2 public URL. Here are the current real tracks in your catalog:

```json
{
  "id": 1,
  "title": "Angela (Open Up Your Heart)",
  "artist": "Jeffrey Hitte",
  "duration": "4:12",
  "bpm": 72,
  "genre": "Blues",
  "subgenres": ["Slow Blues", "Soul Blues"],
  "mood": ["Emotional", "Longing", "Heartfelt", "Pleading"],
  "price": 0.99,
  "audio": "https://pub-d36e4f8ccd12409cb5f92373630441e1.r2.dev/audio/angela_open_up_your_heart.mp3",
  "cover": "https://pub-d36e4f8ccd12409cb5f92373630441e1.r2.dev/covers/angela_open_up_your_heart.jpg",
  "aiGenerated": true
},
{
  "id": 2,
  "title": "She Believed in Me",
  "artist": "Jeffrey Hitte",
  "duration": "4:45",
  "bpm": 68,
  "genre": "Country",
  "subgenres": ["Contemporary Country", "Power Ballad"],
  "mood": ["Heartfelt", "Emotional", "Uplifting", "Redemptive", "Powerful"],
  "price": 0.99,
  "audio": "https://pub-d36e4f8ccd12409cb5f92373630441e1.r2.dev/audio/she_believed_in_me.mp3",
  "cover": "https://pub-d36e4f8ccd12409cb5f92373630441e1.r2.dev/covers/she_believed_in_me.jpg",
  "aiGenerated": true
}
```

The `tracks.json` in this project is kept in sync with your current R2 uploads.

### 2. Add New Tracks

When you add a new track:
1. Upload the MP3 to `audio/` in R2.
2. Upload the cover image to `covers/` in R2.
3. Add a new entry in `tracks.json` with the full R2 URLs.
4. Deploy the updated `tracks.json` to Vercel.

---

## Important: CORS Configuration (Required)

Since your site will be on Vercel and audio will play from R2, you **must** configure CORS on your R2 bucket.

### Steps:

1. Go to your R2 bucket (`aether-music`) → **Settings** → **CORS**.
2. Add the following rule (replace with your actual Vercel domain):

```json
[
  {
    "AllowedOrigins": [
      "https://your-project.vercel.app",
      "https://www.yourdomain.com"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```

**Tip:** While testing, you can temporarily allow all origins with `"*"` (not recommended for production).

---

## Deployment to Vercel (Current Recommended Flow)

This site is a pure static site (no build step). We've prepared it with `vercel.json` + `.vercelignore` for a clean deploy.

### Step-by-step (using GitHub — best for ongoing updates):

1. **Create a GitHub repository**
   - Go to github.com → New repository
   - Name it `aether-music` (or `aether-ai-music`)
   - Make it **Public** (required for free Vercel hobby plan)

2. **Push your code from this folder** (run these in PowerShell / Terminal from inside `aether-ai-music/`):

   ```powershell
   git init
   git add .
   git commit -m "Initial Aether music catalog"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/aether-music.git
   git push -u origin main
   ```

3. **Deploy on Vercel**
   - Go to your dashboard: https://vercel.com/jeffreys-projects-f988d0a0
   - Click **Add New Project**
   - Import the GitHub repo you just created
   - Vercel should auto-detect it as a static site (no framework)
   - Click **Deploy**

4. **After first successful deploy**
   - Copy your production URL (e.g. `https://aether-music.vercel.app`)
   - **Critical**: Update CORS on your R2 bucket (see section below) with this URL

5. **Future updates** (when you add new tracks):
   - Edit `tracks.json` (use your local `add-track.html` tool)
   - `git add tracks.json`
   - `git commit -m "Add new track"`
   - `git push`
   - Vercel auto-deploys in ~30 seconds

### Alternative: Deploy without Git (quick test)
You can also drag & drop the folder onto Vercel, but GitHub route is strongly recommended.

---

## Local Development vs Production

| Environment       | How media is loaded                  | Notes                              |
|-------------------|--------------------------------------|------------------------------------|
| Local (VS Code Live Server) | Can still use `assets/` folder for testing | Good for developing new tracks     |
| Production (Vercel)         | Must use full R2 URLs                    | This is what the public sees       |

You can keep local files in `assets/` for easy testing while developing.

---

## Next Steps (Do These in Order)

1. **Make sure your real tracks are uploaded** to R2 (`audio/` and `covers/` folders).
2. **(Optional but recommended)** Use the local `add-track.html` tool to generate clean JSON for any new tracks and paste them into `tracks.json`.
3. **Set up CORS** on your R2 bucket (see important section above) — use your final Vercel URL.
4. **Deploy to Vercel** using the instructions below.
5. After deploy, add your exact Vercel domain to the R2 CORS settings.

---

## Easy Track Management Tool

A premium local tool is included: **[add-track.html](add-track.html)**

Open it directly in Chrome. It has:
- Beautiful dark theme matching the live site
- Live preview of how the track will look in the catalog
- Automatic R2 URL generation
- One-click "Copy JSON" ready to paste into `tracks.json`

This is the recommended way to add future tracks. Never edit `tracks.json` by hand.

---

---

**Ready to deploy?** Follow the Vercel instructions above. Once it's live, share the URL and I'll help you test playback, licensing flow, and make any final polish.