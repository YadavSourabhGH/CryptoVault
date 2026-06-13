# 🚀 CryptoVault - Cryptocurrency Exchange Simulation Platform

CryptoVault is a full-stack, high-performance cryptocurrency exchange simulator built on the MERN stack. Designed to mimic the aesthetics and responsiveness of Binance, it implements live ticker feeds, dynamic order book depth scales, interactive lightweight charts, and simulated limit/market execution loops.

## 🎯 Features

- **Binance Dark Design System**: Full black-and-gold aesthetics with glassmorphic depth scales, color-coded tickers, and monospaced numerical tables.
- **Geometric Brownian Motion price engine**: Ticks prices and aggregates volume every 1 second, constructing 1m, 5m, 15m, 1h, 4h, and 1d candlestick sets.
- **Limit/Market Order Matching**: Matches buy and sell orders against other users, as well as executing simulated ticks against the live price feed.
- **Admin Control Overrides**: Administrative price override injections, user deactivation switches, KYC states, and transaction audit logs.
- **Zustand State Management**: Decoupled, high-speed stores for authentication, symbols, and order triggers.

---

## 🛠 Project Structure

```
cryptovault/
├── docker-compose.yml           ← Multi-container setup
├── README.md
│
├── server/                      ← Node.js + Express API Backend
│   ├── server.js                ← Server entry point
│   ├── config/                  ← DB & constant variables
│   ├── models/                  ← MongoDB Mongoose schemas
│   ├── routes/                  ← REST endpoint controllers
│   ├── services/                ← Price, Matching, & Market Maker engines
│   └── utils/                   ← Historical OHLC generators & Seeding scripts
│
└── client/                      ← Vite + React Frontend
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx              ← React routes & context
    │   ├── lib/                 ← Axios and socket.io configurations
    │   ├── store/               ← Zustand stores
    │   ├── hooks/               ← Live socket subscribers & ticker listeners
    │   ├── components/          ← Pre-styled layout & trade terminals
    │   └── pages/               ← Landing, Wallet, Dashboard, Trade & Admin panels
```

---

## 🚀 Getting Started

### 1. Bootstrapping (Local Development)

First, make sure a local instance of MongoDB is running on `mongodb://localhost:27017`.

```bash
# 1. Setup Backend
cd server
npm install
npm run seed     # Seeds DB with 3 users, 3 wallets, 8000+ historical candles, 50 trades
npm run dev      # Starts API server on http://localhost:5000

# 2. Setup Frontend (Open new terminal)
cd client
npm install
npm run dev      # Starts Vite server on http://localhost:3000
```

### 2. Multi-Container Deployment (Docker Compose)

To build and run all services in Docker (MongoDB, Node API, Nginx Static Client):

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- API Backend: `http://localhost:5000/api`

---

## 🔑 Demo Access credentials

Seeded automatically on database start:

- **Admin account**: `admin@cryptovault.com` / `Admin@123` (Admin permissions)
- **Trader account**: `trader@cryptovault.com` / `Trader@123` (Trading permissions)
- **Viewer account**: `viewer@cryptovault.com` / `Viewer@123` (Read-only view)
