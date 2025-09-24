const { AptosClient, AptosAccount, FaucetClient } = require('aptos');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com';
const FAUCET_URL = process.env.APTOS_FAUCET_URL || 'https://faucet.testnet.aptoslabs.com';
const API_URL = process.env.API_URL || 'http://localhost:3001';

class AptosphereDemo {
  constructor() {
    this.client = new AptosClient(NODE_URL);
    this.faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
    this.contractAddress = null;
    this.demoAccounts = [];
  }

  async initialize() {
    console.log('🎮 Initializing Aptosphere Demo...');
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, '..', 'deployment.json');
    if (fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      this.contractAddress = deploymentInfo.contractAddress;
      console.log(`📋 Using contract address: ${this.contractAddress}`);
    } else {
      throw new Error('Deployment info not found. Please deploy contracts first.');
    }

    // Create demo accounts
    console.log('👥 Creating demo accounts...');
    for (let i = 0; i < 3; i++) {
      const account = new AptosAccount();
      await this.faucetClient.fundAccount(account.address(), 10000000);
      this.demoAccounts.push(account);
      console.log(`   Created demo account ${i + 1}: ${account.address()}`);
    }

    // Wait for backend to be ready
    await this.waitForBackend();
  }

  async waitForBackend() {
    console.log('⏳ Waiting for backend to be ready...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${API_URL}/api/health`);
        if (response.data.status === 'healthy') {
          console.log('✅ Backend is ready');
          return;
        }
      } catch (error) {
        // Backend not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Backend not ready after 30 seconds');
  }

  async runDemo() {
    console.log('🚀 Starting Aptosphere Demo...');
    
    try {
      // Step 1: Players join the world
      console.log('\n📝 Step 1: Players joining the world...');
      for (let i = 0; i < this.demoAccounts.length; i++) {
        const account = this.demoAccounts[i];
        const username = `DemoPlayer${i + 1}`;
        
        await this.joinWorld(account, username);
        console.log(`   ✅ ${username} joined the world`);
        
        // Small delay between joins
        await this.delay(1000);
      }

      // Step 2: Players move around
      console.log('\n🚶 Step 2: Players moving around...');
      for (let i = 0; i < this.demoAccounts.length; i++) {
        const account = this.demoAccounts[i];
        const x = Math.floor(Math.random() * 15) + 2;
        const y = Math.floor(Math.random() * 15) + 2;
        
        await this.movePlayer(account, x, y);
        console.log(`   ✅ DemoPlayer${i + 1} moved to (${x}, ${y})`);
        
        await this.delay(1000);
      }

      // Step 3: Send tips
      console.log('\n💰 Step 3: Players sending tips...');
      for (let i = 0; i < this.demoAccounts.length - 1; i++) {
        const sender = this.demoAccounts[i];
        const recipient = this.demoAccounts[i + 1].address();
        const amount = Math.floor(Math.random() * 500) + 100;
        
        await this.sendTip(sender, recipient, amount);
        console.log(`   ✅ DemoPlayer${i + 1} sent ${amount} to DemoPlayer${i + 2}`);
        
        await this.delay(1000);
      }

      // Step 4: Mint items
      console.log('\n🎒 Step 4: Players minting items...');
      const items = ['Sword', 'Shield', 'Potion', 'Gem', 'Scroll'];
      for (let i = 0; i < this.demoAccounts.length; i++) {
        const account = this.demoAccounts[i];
        const itemName = items[i % items.length];
        
        await this.mintItem(account, itemName);
        console.log(`   ✅ DemoPlayer${i + 1} minted ${itemName}`);
        
        await this.delay(1000);
      }

      // Step 5: Trade items
      console.log('\n🔄 Step 5: Players trading items...');
      if (this.demoAccounts.length >= 2) {
        const trader1 = this.demoAccounts[0];
        const trader2 = this.demoAccounts[1];
        
        await this.tradeItems(trader1, trader2, 1, 2);
        console.log('   ✅ DemoPlayer1 and DemoPlayer2 traded items');
        
        await this.delay(1000);
      }

      // Step 6: Create prediction market
      console.log('\n📈 Step 6: Creating prediction market...');
      const creator = this.demoAccounts[0];
      const currentTime = Math.floor(Date.now() / 1000);
      const endTime = currentTime + 3600; // 1 hour from now
        
      await this.createMarket(creator, 'Will it rain tomorrow?', 'Weather prediction market', endTime);
      console.log('   ✅ Prediction market created');
      
      await this.delay(1000);

      // Step 7: Place bets
      console.log('\n🎲 Step 7: Players placing bets...');
      for (let i = 1; i < this.demoAccounts.length; i++) {
        const bettor = this.demoAccounts[i];
        const marketId = 1;
        const outcome = Math.random() > 0.5 ? 1 : 2; // Random outcome
        const amount = Math.floor(Math.random() * 1000) + 500;
        
        await this.placeBet(bettor, marketId, outcome, amount);
        console.log(`   ✅ DemoPlayer${i + 1} placed bet on outcome ${outcome} with ${amount}`);
        
        await this.delay(1000);
      }

      // Step 8: Show final state
      console.log('\n📊 Step 8: Final world state...');
      await this.showWorldState();

      console.log('\n🎉 Demo completed successfully!');
      console.log('🌐 Open http://localhost:3000 to see the live world state');

    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  async joinWorld(account, username) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::world::join_world`,
      arguments: [Buffer.from(username).toString('hex')]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async movePlayer(account, x, y) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::world::move_player`,
      arguments: [x, y]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async sendTip(account, recipient, amount) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::world::send_tip`,
      arguments: [recipient, amount]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async mintItem(account, name) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::items::mint_item`,
      arguments: [Buffer.from(name).toString('hex')]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async tradeItems(account1, account2, item1Id, item2Id) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::items::trade_items`,
      arguments: [account2.address(), item1Id, item2Id]
    };

    const transaction = await this.client.generateTransaction(account1.address(), payload);
    const signedTxn = await this.client.signTransaction(account1, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async createMarket(account, title, description, endTime) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::defi::create_market`,
      arguments: [
        Buffer.from(title).toString('hex'),
        Buffer.from(description).toString('hex'),
        endTime
      ]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async placeBet(account, marketId, outcome, amount) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::defi::place_bet`,
      arguments: [marketId, outcome, amount]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    return await this.client.waitForTransactionWithResult(result);
  }

  async showWorldState() {
    try {
      const response = await axios.get(`${API_URL}/api/world-state`);
      const worldState = response.data;
      
      console.log('   📊 World Statistics:');
      console.log(`      Total Players: ${worldState.totalPlayers}`);
      console.log(`      Total Items: ${worldState.totalItems}`);
      console.log(`      Last Update: ${new Date(worldState.lastUpdate).toLocaleString()}`);
      
      if (worldState.players.length > 0) {
        console.log('   👥 Active Players:');
        worldState.players.forEach((player, index) => {
          console.log(`      ${index + 1}. ${player.username} at (${player.x}, ${player.y}) - Balance: ${player.balance}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Failed to get world state:', error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main demo function
async function main() {
  const demo = new AptosphereDemo();
  
  try {
    await demo.initialize();
    await demo.runDemo();
    
    console.log('\n🎮 Aptosphere demo completed successfully!');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend: http://localhost:3001');
    console.log('📡 WebSocket: ws://localhost:3001/ws');
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AptosphereDemo;
