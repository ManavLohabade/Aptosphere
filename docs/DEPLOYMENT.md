# Aptosphere Deployment Guide

This guide will help you deploy and run Aptosphere on Aptos Testnet.

## Prerequisites

- Node.js 18+
- Aptos CLI
- Martian Wallet browser extension
- Git

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aptosphere
```

2. **Install all dependencies**
```bash
npm run install:all
```

3. **Setup Aptos CLI**
```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize Aptos account
aptos init --network testnet
```

## Deployment Steps

### 1. Deploy Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Compile contracts
aptos move compile

# Test contracts
aptos move test

# Deploy to testnet
aptos move publish --profile default
```

**Important**: Save the contract address from the deployment output. You'll need it for the frontend configuration.

### 2. Configure Environment Variables

Create environment files for each component:

**Backend** (`backend/.env`):
```env
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com
APTOS_FAUCET_URL=https://faucet.testnet.aptoslabs.com
CONTRACT_ADDRESS=<your-contract-address>
PORT=3001
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS=<your-contract-address>
VITE_NETWORK=testnet
VITE_NODE_URL=https://fullnode.testnet.aptoslabs.com
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001` with WebSocket support on `ws://localhost:3001/ws`.

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 5. Run Demo

```bash
# Run the full demo
npm run full-demo

# Or run just the demo (if contracts are already deployed)
npm run demo
```

## Verification

1. **Check Backend Health**
```bash
curl http://localhost:3001/api/health
```

2. **Check World State**
```bash
curl http://localhost:3001/api/world-state
```

3. **Open Frontend**
Navigate to `http://localhost:3000` and connect your Martian Wallet.

## Demo Flow

The demo will automatically:

1. **Create Test Accounts** - 3 demo accounts with funded balances
2. **Join World** - All accounts join the Aptosphere world
3. **Move Players** - Players move to random positions
4. **Send Tips** - Players send tips to each other
5. **Mint Items** - Players mint various items
6. **Trade Items** - Players trade items with each other
7. **Create Markets** - Create prediction markets
8. **Place Bets** - Players place bets on market outcomes

## Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   - Ensure you have sufficient APT tokens
   - Check network connectivity
   - Verify Aptos CLI is properly configured

2. **Backend Connection Issues**
   - Check if backend is running on port 3001
   - Verify environment variables are set correctly
   - Check firewall settings

3. **Frontend Wallet Issues**
   - Ensure Martian Wallet is installed
   - Check if wallet is connected to Aptos Testnet
   - Verify contract address is correct

4. **WebSocket Connection Issues**
   - Check if backend WebSocket is running
   - Verify CORS settings
   - Check browser console for errors

### Debug Commands

```bash
# Check Aptos CLI configuration
aptos account list

# Check account balance
aptos account list --query balance

# View transaction history
aptos account list --query transactions

# Check contract resources
aptos account list --query resources
```

## Production Deployment

For production deployment:

1. **Use Mainnet** - Change network to mainnet
2. **Secure Environment** - Use proper environment variable management
3. **Load Balancing** - Set up load balancer for backend
4. **CDN** - Use CDN for frontend assets
5. **Monitoring** - Set up monitoring and logging
6. **SSL** - Use HTTPS for all connections

## Support

For issues and questions:

- Check the logs in each service
- Review the console output
- Check the browser developer tools
- Verify all environment variables are set correctly

## Next Steps

After successful deployment:

1. **Customize** - Modify the world size, game mechanics, etc.
2. **Add Features** - Implement additional DeFi features
3. **Scale** - Add more players and features
4. **Integrate** - Connect with other Aptos dApps
