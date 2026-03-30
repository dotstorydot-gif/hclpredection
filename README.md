# UCL Prediction Game - Live Deployment

This project is a high-speed, interactive Champions League prediction game with a live "Golden Buzzer" feature.

## 🚀 One-Click Deploy to Vercel

If you have connected this repository to Vercel, use the following settings:

### Required Environment Variables

To make the app function live, you **MUST** add these in the Vercel Project Dashboard:

- `VITE_SUPABASE_URL`: `https://lmmorwefspauazsfgkwe.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbW9yd2Vmc3BhdWF6c2Zna3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzM4NTYsImV4cCI6MjA4OTg0OTg1Nn0.SLK5E-ZaXWIlPi5DUvGGQ_8mrKdzoa5CgOPUY46JwjE`

### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 🎮 How to Play

1.  **Register**: Enter your name, phone, and select your venue.
2.  **Predict**: Choose the winners for upcoming UCL matches.
3.  **Live Action**: During the match, stay alert! When a goal occurs, the **Golden Buzzer** will appear on your screen. The fastest response at each venue wins.

---

## 🛠 Admin Controls
Navigate to `https://your-deployment-url.vercel.app/#admin` to:
- Update live scores.
- Trigger the Golden Buzzer globally.
- Manage match status (Upcoming/Live/Finished).

> [!IMPORTANT]
> Ensure you have executed the [schema_v2.sql](file:///Volumes/sameh/Games/UCL-Predection%20game/supabase/schema_v2.sql) in your Supabase SQL Editor before use.
