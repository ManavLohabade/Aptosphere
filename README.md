# Aptosphere 🌍

**Parallel SocialFi Layer on Aptos - Real-time On-chain World State**

Aptosphere is a hackathon-ready project that demonstrates a **real-time, on-chain world state** where multiple users, bots, and apps can interact **simultaneously**, fully trustless and parallel on the Aptos blockchain.

## 🚀 Key Features

- **Real-time World State**: Multiple players moving simultaneously without conflicts
- **Atomic Operations**: All actions are atomic and parallel-safe using Move resources
- **Live Trading**: Real-time item trading and tipping system
- **Event-Driven**: Instant UI updates via on-chain events
- **Wallet Integration**: Martian Wallet support with React adapter

## 🏗️ Architecture

### Smart Contracts (Move)
- **World Contract**: Player management, movement, real-time state
- **Item Contract**: NFT-like items with atomic trading
- **Payment Contract**: Instant tipping system
- **Optional DeFi**: Prediction markets (stretch goal)

### Frontend (React + TypeScript)
- Real-time 2D world visualization
- Wallet integration with Martian Wallet
- Live event streaming from blockchain
- Atomic transaction handling

### Backend (Node.js)
- Event indexing and real-time updates
- WebSocket connections for live data
- Transaction monitoring and state sync

## 🛠️ Tech Stack

- **Blockchain**: Aptos Testnet
- **Smart Contracts**: Move
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket
- **Wallet**: Martian Wallet
- **Real-time**: WebSocket + Event streaming

## 📁 Project Structure

```
aptosphere/
├── contracts/           # Move smart contracts
├── backend/            # Node.js backend for event indexing
├── frontend/           # React frontend application
├── scripts/            # Deployment and demo scripts
└── docs/              # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Aptos CLI
- Martian Wallet browser extension

### Installation

1. **Clone and install dependencies**
```bash
git clone <repo-url>
cd aptosphere
npm install
```

2. **Setup Aptos CLI**
```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize Aptos account
aptos init --network testnet
```

3. **Deploy contracts**
```bash
npm run deploy:contracts
```

4. **Start development**
```bash
npm run dev
```

### Demo Flow

1. **Connect Wallet** → Join the world
2. **Move Avatar** → See real-time updates across multiple wallets
3. **Send Tips** → Balances update instantly on-chain
4. **Trade Items** → Ownership reflected immediately
5. **Parallel Actions** → Multiple users acting simultaneously

## 🎯 Hackathon MVP

### Must-Have Features
- ✅ 2-3 players moving in real-time
- ✅ Real-time tipping system
- ✅ One tradeable item
- ✅ Atomic operations with Move resources

### Stretch Goals
- 🔮 Prediction market
- 🏆 Leaderboards and achievements
- 🗺️ Larger arena with more players
- 🤖 Bot integration

## 🔧 Development

### Smart Contracts
```bash
cd contracts
aptos move test
aptos move publish
```

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## 📊 Demo Scripts

Run the demo with multiple test wallets:
```bash
npm run demo:multiplayer
```

## 🌟 Why Aptosphere?

> "No chain today runs a true real-time, on-chain world state. Everyone cheats with off-chain compute. Aptosphere proves this is possible on Aptos."

Aptosphere demonstrates:
- **True Parallelism**: Multiple users acting simultaneously
- **Atomic Operations**: All state changes are atomic
- **Real-time Updates**: Instant UI synchronization
- **Trustless Interactions**: No off-chain dependencies

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a hackathon project. Feel free to fork and extend!

---

**Built for Aptos Hackathon** 🚀