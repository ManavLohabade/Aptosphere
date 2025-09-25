# Aptosphere Frontend

A modern React.js frontend for the Aptosphere Parallel SocialFi Layer on Aptos blockchain. This frontend provides a real-time 2D world interface where multiple players can interact simultaneously.

## 🚀 Features

### Core Features
- **2D Canvas World**: Interactive grid-based world where players can move in real-time
- **Real-time Cursor Movement**: Smooth animations for player movements
- **Wallet Integration**: Connect with Martian Wallet, Petra Wallet, or other Aptos wallets
- **World State Management**: Commit new world states to the blockchain
- **Player Management**: Track multiple players with stats and status
- **App Registry**: Register and manage different applications in the ecosystem

### UI Components
- **WorldCanvas**: 2D interactive world with grid-based movement
- **Sidebar**: Player list, app registry, and statistics
- **WalletConnection**: Connect/disconnect Aptos wallets
- **CommitState**: Commit world state changes to blockchain
- **Real-time Updates**: WebSocket integration for live updates

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **React Hooks**: Custom hooks for wallet and world state management
- **Framer Motion**: Smooth animations and transitions
- **Tailwind CSS**: Modern, responsive styling
- **WebSocket**: Real-time communication with backend
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **Socket.io Client** for real-time communication
- **Aptos SDK** for blockchain integration

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
   VITE_NETWORK=testnet
   VITE_NODE_URL=https://fullnode.testnet.aptoslabs.com
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## 🎮 Usage

### Connecting Wallet
1. Click "Connect Wallet" button
2. Select your preferred Aptos wallet (Martian, Petra, etc.)
3. Approve the connection in your wallet

### Moving in the World
1. Click anywhere on the canvas to move your player
2. Drag to move continuously
3. Your position updates in real-time

### Committing World State
1. Use the "Quick Commit" button for automatic state commits
2. Use "Show Details" for custom root hash and tick number
3. Commits are sent to the Aptos blockchain

### Managing Apps
1. Switch to "Apps" tab in the sidebar
2. Click "Register" to add new applications
3. View app statistics and player counts

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── WorldCanvas.tsx      # 2D world interface
│   ├── Sidebar.tsx          # Player/app management
│   ├── WalletConnection.tsx # Wallet integration
│   └── CommitState.tsx      # State commitment UI
├── hooks/
│   ├── useWallet.tsx        # Wallet state management
│   └── useWorld.tsx         # World state management
├── utils/
│   ├── worldService.ts      # API communication
│   └── eventService.ts      # WebSocket events
└── styles/
    └── index.css           # Custom styles
```

### State Management
- **Wallet State**: Connection status, account info, transaction signing
- **World State**: Player positions, app data, latest commits
- **Real-time Updates**: WebSocket events for live synchronization

### Data Flow
1. **User Actions** → Component Events
2. **Component Events** → Custom Hooks
3. **Custom Hooks** → API Calls / Blockchain Transactions
4. **API Responses** → State Updates
5. **State Updates** → UI Re-renders

## 🎨 Styling

### Design System
- **Colors**: Blue primary, green success, red danger, gray neutrals
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth transitions with Framer Motion

### Responsive Design
- **Desktop**: Full sidebar + canvas layout
- **Tablet**: Collapsible sidebar
- **Mobile**: Stacked layout with touch-friendly controls

### Custom CSS Classes
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- `.card`, `.card-header`, `.card-body`
- `.input`, `.input-error`
- `.player-cursor`, `.status-online`, `.status-offline`

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for state management
- **Utils**: Utility functions and services
- **Types**: TypeScript type definitions

### Best Practices
- Use TypeScript for all components
- Implement proper error handling
- Use React hooks for state management
- Follow component composition patterns
- Write responsive CSS with Tailwind

## 🔌 Integration

### Backend Integration
- **API Endpoints**: RESTful API for world state
- **WebSocket**: Real-time event streaming
- **Authentication**: Wallet-based authentication

### Blockchain Integration
- **Aptos SDK**: Transaction signing and submission
- **Move Contracts**: Smart contract interactions
- **Event Monitoring**: Blockchain event listening

### Wallet Support
- **Martian Wallet**: Primary wallet support
- **Petra Wallet**: Secondary wallet support
- **Generic Aptos Wallets**: Fallback support

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
- `VITE_API_URL`: Backend API URL
- `VITE_CONTRACT_ADDRESS`: Deployed contract address
- `VITE_NETWORK`: Aptos network (testnet/mainnet)
- `VITE_NODE_URL`: Aptos node URL

### Hosting
- Static files in `dist/` directory
- Compatible with Vercel, Netlify, GitHub Pages
- Requires HTTPS for wallet connections

## 🐛 Troubleshooting

### Common Issues
1. **Wallet Connection Failed**: Check if wallet extension is installed
2. **Canvas Not Loading**: Verify WebSocket connection to backend
3. **Transactions Failing**: Check network and gas settings
4. **Styling Issues**: Ensure Tailwind CSS is properly configured

### Debug Mode
- Open browser DevTools
- Check Console for errors
- Monitor Network tab for API calls
- Verify WebSocket connections

## 📱 Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Aptos Documentation](https://aptos.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
