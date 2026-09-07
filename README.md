# 🏛️ Viraasat (विरासत)
> AI-powered cultural heritage explorer for India.

Viraasat is an interactive, highly-stylized digital passport system and interactive map designed for the **SIH 2026 (PS 26197)** challenge. It visualizes the rich, diverse cultural heritage of India through an immersive "Neo-Brutalist Tactile Paper" aesthetic.

![Viraasat Map](https://github.com/SohamFr/Viraasat/raw/main/assets/preview.png)

## 🚀 Features
- **Cinematic Heritage Map:** An interactive map powered by `maplibregl` and `MapTiler` showcasing historic monuments across India.
- **Dynamic Zoom Hierarchy:** Seamlessly transitions from State labels -> City markers -> Detailed Monument pins as you zoom in.
- **Monument Inspector:** Explore deep histories, architectural styles, and live ticketing data.
- **AI Heritage Lens (Planned):** Camera-based monument recognition.
- **Digital Passport:** Save visited monuments, collect stamps, and track your travels.
- **Full Backend Integration:** Built with a Supabase PostgreSQL backend, supporting rapid upserts and live logistics data.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, GSAP (Animations), MapLibre GL
- **Backend**: Node.js, Supabase (PostgreSQL), TypeScript
- **Design Language**: Custom Neo-Brutalist & Liquid Glass Theme

## 📥 Setup
### Prerequisites
- Node.js (v18+)
- Supabase Account

### 1. Backend Setup
```bash
cd backend
npm install
# Set your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
npx tsx scripts/run_schema.ts
npx tsx scripts/insert_rich.ts
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📜 Design Philosophy
Viraasat avoids generic UI patterns in favor of a **Tactile Paper Neo-Brutalist** aesthetic. This evokes the feeling of physical travel documents, old journals, and heritage passports, ensuring the user feels a deep connection to history.

## 🤝 Contributing
Built by SohamFr for Smart India Hackathon (SIH 2026).
