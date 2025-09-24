const { AptosClient, AptosAccount, FaucetClient } = require('aptos');
const fs = require('fs');
const path = require('path');

// Configuration
const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com';
const FAUCET_URL = process.env.APTOS_FAUCET_URL || 'https://faucet.testnet.aptoslabs.com';

class AptosphereDeployer {
  constructor() {
    this.client = new AptosClient(NODE_URL);
    this.faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
    this.deployerAccount = null;
  }

  async initialize() {
    console.log('🚀 Initializing Aptosphere Deployer...');
    
    // Create or load deployer account
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (privateKey) {
      this.deployerAccount = AptosAccount.fromAptosAccountObject({
        privateKeyHex: privateKey
      });
    } else {
      // Create new account for deployment
      this.deployerAccount = new AptosAccount();
      console.log('📝 New deployer account created:');
      console.log(`   Address: ${this.deployerAccount.address()}`);
      console.log(`   Private Key: ${this.deployerAccount.toPrivateKeyObject().privateKeyHex}`);
      console.log('⚠️  Save this private key securely!');
    }

    // Fund the account
    console.log('💰 Funding deployer account...');
    await this.faucetClient.fundAccount(this.deployerAccount.address(), 100000000);
    
    console.log('✅ Deployer account ready');
  }

  async deployContracts() {
    console.log('📦 Deploying Aptosphere contracts...');
    
    try {
      // Deploy all contracts
      const packageMetadata = this.loadPackageMetadata();
      
      const transaction = await this.client.publishPackage(
        this.deployerAccount,
        packageMetadata,
        []
      );
      
      console.log('⏳ Waiting for transaction to complete...');
      const result = await this.client.waitForTransactionWithResult(transaction);
      
      if (result.success) {
        console.log('✅ Contracts deployed successfully!');
        console.log(`   Transaction Hash: ${result.hash}`);
        console.log(`   Contract Address: ${this.deployerAccount.address()}`);
        
        // Save deployment info
        this.saveDeploymentInfo(result);
        
        return result;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  loadPackageMetadata() {
    // This would load the compiled package metadata
    // For now, return a placeholder
    return {
      packageMetadata: 'placeholder',
      modules: []
    };
  }

  saveDeploymentInfo(result) {
    const deploymentInfo = {
      contractAddress: this.deployerAccount.address(),
      transactionHash: result.hash,
      timestamp: new Date().toISOString(),
      network: 'testnet',
      contracts: {
        world: `${this.deployerAccount.address()}::world`,
        items: `${this.deployerAccount.address()}::items`,
        payments: `${this.deployerAccount.address()}::payments`,
        defi: `${this.deployerAccount.address()}::defi`
      }
    };

    const deploymentPath = path.join(__dirname, '..', 'deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('💾 Deployment info saved to deployment.json');
  }

  async initializeContracts() {
    console.log('🔧 Initializing contracts...');
    
    const contracts = [
      { name: 'World', module: 'world', function: 'initialize' },
      { name: 'Items', module: 'items', function: 'initialize' },
      { name: 'Payments', module: 'payments', function: 'initialize' },
      { name: 'DeFi', module: 'defi', function: 'initialize' }
    ];

    for (const contract of contracts) {
      try {
        console.log(`   Initializing ${contract.name}...`);
        
        const payload = {
          type: 'entry_function_payload',
          function: `${this.deployerAccount.address()}::${contract.module}::${contract.function}`,
          arguments: []
        };

        const transaction = await this.client.generateTransaction(
          this.deployerAccount.address(),
          payload
        );
        
        const signedTxn = await this.client.signTransaction(this.deployerAccount, transaction);
        const result = await this.client.submitTransaction(signedTxn);
        
        await this.client.waitForTransactionWithResult(result);
        
        console.log(`   ✅ ${contract.name} initialized`);
      } catch (error) {
        console.error(`   ❌ Failed to initialize ${contract.name}:`, error);
      }
    }
  }

  async runDemo() {
    console.log('🎮 Running Aptosphere demo...');
    
    // Create test accounts
    const testAccounts = [];
    for (let i = 0; i < 3; i++) {
      const account = new AptosAccount();
      await this.faucetClient.fundAccount(account.address(), 10000000);
      testAccounts.push(account);
      console.log(`   Created test account ${i + 1}: ${account.address()}`);
    }

    // Demo: Players join world
    console.log('👥 Players joining world...');
    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      const username = `Player${i + 1}`;
      
      const payload = {
        type: 'entry_function_payload',
        function: `${this.deployerAccount.address()}::world::join_world`,
        arguments: [Buffer.from(username).toString('hex')]
      };

      const transaction = await this.client.generateTransaction(account.address(), payload);
      const signedTxn = await this.client.signTransaction(account, transaction);
      await this.client.submitTransaction(signedTxn);
      
      console.log(`   ${username} joined the world`);
    }

    // Demo: Players move around
    console.log('🚶 Players moving around...');
    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      const x = Math.floor(Math.random() * 20);
      const y = Math.floor(Math.random() * 20);
      
      const payload = {
        type: 'entry_function_payload',
        function: `${this.deployerAccount.address()}::world::move_player`,
        arguments: [x, y]
      };

      const transaction = await this.client.generateTransaction(account.address(), payload);
      const signedTxn = await this.client.signTransaction(account, transaction);
      await this.client.submitTransaction(signedTxn);
      
      console.log(`   Player${i + 1} moved to (${x}, ${y})`);
    }

    // Demo: Send tips
    console.log('💰 Players sending tips...');
    if (testAccounts.length >= 2) {
      const sender = testAccounts[0];
      const recipient = testAccounts[1].address();
      const amount = 1000;
      
      const payload = {
        type: 'entry_function_payload',
        function: `${this.deployerAccount.address()}::world::send_tip`,
        arguments: [recipient, amount]
      };

      const transaction = await this.client.generateTransaction(sender.address(), payload);
      const signedTxn = await this.client.signTransaction(sender, transaction);
      await this.client.submitTransaction(signedTxn);
      
      console.log(`   Player1 sent ${amount} to Player2`);
    }

    console.log('🎉 Demo completed successfully!');
  }
}

// Main deployment function
async function main() {
  const deployer = new AptosphereDeployer();
  
  try {
    await deployer.initialize();
    await deployer.deployContracts();
    await deployer.initializeContracts();
    await deployer.runDemo();
    
    console.log('🚀 Aptosphere deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AptosphereDeployer;
