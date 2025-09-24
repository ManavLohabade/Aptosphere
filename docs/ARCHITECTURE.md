# Aptosphere Architecture

## Overview

Aptosphere is a parallel SocialFi layer on Aptos that demonstrates real-time, on-chain world state where multiple users can interact simultaneously without conflicts. The architecture consists of three main components:

1. **Smart Contracts** (Move) - On-chain logic and state management
2. **Backend** (Node.js) - Event indexing and real-time updates
3. **Frontend** (React) - User interface and wallet integration

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Smart          │
│   (React)       │◄──►│   (Node.js)      │◄──►│   Contracts      │
│                 │    │                 │    │   (Move)         │
│ • Wallet Connect│    │ • Event Monitor │    │                 │
│ • Real-time UI  │    │ • WebSocket     │    │ • World State   │
│ • World View    │    │ • API Server    │    │ • Player Mgmt   │
│ • Trading       │    │ • State Sync    │    │ • Items/Trading │
└─────────────────┘    └─────────────────┘    │ • Payments     │
                                                 │ • DeFi Markets │
                                                 └─────────────────┘
```

## Smart Contracts (Move)

### World Contract (`world.move`)
- **Purpose**: Core world state management
- **Key Resources**:
  - `Player`: Stores player data (position, balance, inventory)
  - `WorldState`: Global world state
- **Key Functions**:
  - `join_world()`: Add new player
  - `leave_world()`: Remove player
  - `move_player()`: Update player position
  - `send_tip()`: Transfer tokens between players

### Items Contract (`items.move`)
- **Purpose**: NFT-like item management
- **Key Resources**:
  - `Item`: Individual item data
  - `ItemStore`: Global item registry
- **Key Functions**:
  - `mint_item()`: Create new items
  - `transfer_item()`: Transfer item ownership
  - `trade_items()`: Atomic item swaps

### Payments Contract (`payments.move`)
- **Purpose**: Payment and tipping system
- **Key Resources**:
  - `Payment`: Payment records
  - `PaymentStore`: Payment registry
- **Key Functions**:
  - `send_tip()`: Send tips to other players
  - `send_batch_tips()`: Send multiple tips

### DeFi Contract (`defi.move`)
- **Purpose**: Prediction markets (stretch goal)
- **Key Resources**:
  - `Market`: Prediction market data
  - `Bet`: User bet information
- **Key Functions**:
  - `create_market()`: Create new prediction market
  - `place_bet()`: Place bet on market
  - `resolve_market()`: Resolve market outcome

## Backend (Node.js)

### Core Services

#### AptosService
- **Purpose**: Blockchain interaction layer
- **Responsibilities**:
  - Connect to Aptos network
  - Submit transactions
  - Monitor events
  - Query account data

#### WorldStateService
- **Purpose**: In-memory world state management
- **Responsibilities**:
  - Maintain player data
  - Track item ownership
  - Manage payment records
  - Handle state updates

#### EventService
- **Purpose**: Real-time event processing
- **Responsibilities**:
  - Monitor blockchain events
  - Process event data
  - Broadcast updates to clients
  - Maintain event history

### API Endpoints

```
GET  /api/health              - Health check
GET  /api/world-state         - Current world state
GET  /api/players             - All players
GET  /api/players/:address    - Specific player
GET  /api/events              - Recent events
GET  /api/leaderboard         - Player rankings
```

### WebSocket Events

```
world_state    - Complete world state update
player_joined  - New player joined
player_moved   - Player position changed
player_left    - Player left world
tip_sent       - Tip transaction
item_traded    - Item trade completed
```

## Frontend (React)

### Component Architecture

```
App
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Footer
├── Pages
│   ├── HomePage
│   ├── WorldPage
│   ├── ArenaPage
│   └── ProfilePage
├── Components
│   ├── WalletButton
│   ├── WorldGrid
│   └── PlayerAvatar
└── Hooks
    ├── useWallet
    ├── useWorld
    └── useEvents
```

### State Management

- **Wallet State**: Connection status, account info
- **World State**: Players, items, events
- **UI State**: Modals, forms, navigation

### Real-time Updates

- WebSocket connection to backend
- Event-driven state updates
- Optimistic UI updates
- Error handling and reconnection

## Data Flow

### 1. Player Joins World
```
User → Frontend → Wallet → Smart Contract → Event → Backend → WebSocket → Frontend
```

### 2. Player Moves
```
User → Frontend → Wallet → Smart Contract → Event → Backend → WebSocket → All Clients
```

### 3. Real-time Updates
```
Smart Contract → Event → Backend → WebSocket → Frontend → UI Update
```

## Security Considerations

### Smart Contracts
- **Resource Safety**: Move's resource model prevents double-spending
- **Access Control**: Only authorized functions can modify state
- **Atomic Operations**: All state changes are atomic

### Backend
- **Input Validation**: All inputs are validated
- **Rate Limiting**: Prevent spam and abuse
- **CORS**: Proper cross-origin configuration

### Frontend
- **Wallet Security**: No private key storage
- **Transaction Signing**: All transactions signed by user
- **Input Sanitization**: Prevent XSS attacks

## Scalability

### Horizontal Scaling
- **Backend**: Multiple instances with load balancer
- **Database**: Distributed state management
- **CDN**: Static asset delivery

### Performance Optimization
- **Caching**: Redis for frequently accessed data
- **Compression**: Gzip for API responses
- **Lazy Loading**: Frontend code splitting

## Monitoring

### Metrics
- **Transaction Volume**: Number of on-chain transactions
- **Active Players**: Concurrent users
- **Event Processing**: Backend event handling
- **Error Rates**: System reliability

### Logging
- **Structured Logs**: JSON format for easy parsing
- **Log Levels**: Debug, Info, Warn, Error
- **Correlation IDs**: Track requests across services

## Future Enhancements

### Phase 2
- **Persistent Storage**: Database for historical data
- **Advanced Trading**: Order books, auctions
- **Social Features**: Chat, friends, guilds

### Phase 3
- **Cross-chain**: Multi-blockchain support
- **Mobile App**: Native mobile experience
- **AI Integration**: Smart NPCs, recommendations

## Development Workflow

### Local Development
1. Start backend: `npm run backend:dev`
2. Start frontend: `npm run frontend:dev`
3. Deploy contracts: `npm run deploy:contracts`
4. Run demo: `npm run demo`

### Testing
1. Unit tests for smart contracts
2. Integration tests for backend
3. E2E tests for frontend
4. Load testing for scalability

### Deployment
1. Deploy contracts to testnet/mainnet
2. Deploy backend to cloud provider
3. Deploy frontend to CDN
4. Configure monitoring and alerts
