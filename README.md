# ⚔️ XO DUEL - Real-Time Multiplayer & Solo Game

A simple, fast, and responsive real-time Tic-Tac-Toe game that works across devices or solo against an AI Bot.

Built for the **Create a Multiplayer Game** mission.

---

## 🌟 Features

* **🤖 1-Player Solo Mode**: Play instantly against an intelligent AI Bot (no second player needed).
* **👥 2-Player Online Mode**:
  * Create a game room and get a unique 4-letter room code (e.g., `ABCD`).
  * 1-Click invite link sharing (`?room=ABCD`) across devices, phones, or separate browser windows.
  * Real-time turn indicator, score tracking, win animations, and rematch button.
* **⚡ Serverless & Netlify Ready**:
  * Backed by Netlify Functions at `netlify/functions/game.ts`.
  * Netlify Blobs integration with strong consistency and conditional updates.
  * Drag-and-drop ready via `netlify-ready-game.zip`.
* **🎨 Modern UI & Sound**:
  * Tactile, dark-themed responsive design with neon cyan and gold glow effects.
  * Procedural sound effects using the Web Audio API (zero audio file latency).
  * Confetti celebration on victory.

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open in your browser:
   * Local: `http://localhost:5173/`
   * Network (Mobile on same Wi-Fi): `http://<your-ip>:5173/`

---

## 📦 Deploy to Netlify (Drag & Drop)

1. Run the packaging script:
   ```bash
   npm run package
   ```
2. Upload the generated `netlify-ready-game.zip` to [https://app.netlify.com/drop](https://app.netlify.com/drop).
3. Your game is immediately live at a permanent public URL!

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS, TypeScript, Vite
* **Backend**: Netlify Functions (`netlify/functions/game.ts`), Netlify Blobs
* **FX**: Web Audio API, Canvas Confetti
