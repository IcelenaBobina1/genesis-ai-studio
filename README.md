# Genesis AI Studio — Local Starter

What this gives you:
- User registration/login (sessions)
- Upload images saved to ./storage/images
- Thumbnails generated in ./storage/thumbs using sharp
- SQLite DB file at ./data/database.sqlite
- Character create/list endpoints

Requirements:
- Node.js (LTS >= 16)
- npm

Install & Run:
1. git clone https://github.com/Icelenabobina1/genesis-ai-studio
2. cd genesis-ai-studio
3. npm install
4. mkdir -p data storage/images storage/thumbs
5. npm run dev    # requires nodemon OR npm start

Open: http://localhost:3000

Notes:
- This is a local dev starter. It uses in-memory session by default and a dev session secret. For any real deployment change session store & secret.
- No external subscriptions required — all local.
- When you are ready to add AI features, read the "AI options" section below.

AI options later (no-cost / low-cost):
- If you have an NVIDIA GPU: install Automatic1111 or a GPU-enabled Stable Diffusion runner. You can host locally and call its REST API.
- If you have no GPU: consider small CPU-only models for demos, but expect slow inference.
- Voice: Coqui TTS or other open-source TTS can be run locally for demos.
- Lip-sync / video: resource-heavy; postpone until you have a GPU or use occasional paid APIs to prototype.

If you'd like, I can:
- Commit these files into your GitHub repo (Icelenabobina1/genesis-ai-studio) if you say “Commit remaining files”.
- Or walk you through running this locally step-by-step.
