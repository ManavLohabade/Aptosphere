const { AptosClient, AptosAccount, FaucetClient } = require('aptos');
const fs = require('fs');
const path = require('path');

// Configuration
const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com';
const FAUCET_URL = process.env.APTOS_FAUCET_URL || 'https://faucet.testnet.aptoslabs.com';

class AptosphereTester {
  constructor() {
    this.client = new AptosClient(NODE_URL);
    this.faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
    this.contractAddress = null;
    this.testAccounts = [];
  }

  async initialize() {
    console.log('🧪 Initializing Aptosphere Tester...');
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, '..', 'deployment.json');
    if (fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      this.contractAddress = deploymentInfo.contractAddress;
      console.log(`📋 Using contract address: ${this.contractAddress}`);
    } else {
      throw new Error('Deployment info not found. Please deploy contracts first.');
    }

    // Create test accounts
    for (let i = 0; i < 5; i++) {
      const account = new AptosAccount();
      await this.faucetClient.fundAccount(account.address(), 10000000);
      this.testAccounts.push(account);
      console.log(`   Created test account ${i + 1}: ${account.address()}`);
    }
  }

  async testWorldContract() {
    console.log('🌍 Testing World Contract...');
    
    const results = {
      joinWorld: false,
      movePlayer: false,
      sendTip: false,
      leaveWorld: false
    };

    try {
      // Test: Join world
      console.log('   Testing join_world...');
      const account = this.testAccounts[0];
      const username = 'TestPlayer';
      
      const joinPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::world::join_world`,
        arguments: [Buffer.from(username).toString('hex')]
      };

      const joinTxn = await this.client.generateTransaction(account.address(), joinPayload);
      const signedJoinTxn = await this.client.signTransaction(account, joinTxn);
      const joinResult = await this.client.submitTransaction(signedJoinTxn);
      await this.client.waitForTransactionWithResult(joinResult);
      
      results.joinWorld = true;
      console.log('   ✅ join_world test passed');

      // Test: Move player
      console.log('   Testing move_player...');
      const movePayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::world::move_player`,
        arguments: [5, 10]
      };

      const moveTxn = await this.client.generateTransaction(account.address(), movePayload);
      const signedMoveTxn = await this.client.signTransaction(account, moveTxn);
      const moveResult = await this.client.submitTransaction(signedMoveTxn);
      await this.client.waitForTransactionWithResult(moveResult);
      
      results.movePlayer = true;
      console.log('   ✅ move_player test passed');

      // Test: Send tip
      console.log('   Testing send_tip...');
      const recipient = this.testAccounts[1].address();
      const amount = 1000;
      
      const tipPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::world::send_tip`,
        arguments: [recipient, amount]
      };

      const tipTxn = await this.client.generateTransaction(account.address(), tipPayload);
      const signedTipTxn = await this.client.signTransaction(account, tipTxn);
      const tipResult = await this.client.submitTransaction(signedTipTxn);
      await this.client.waitForTransactionWithResult(tipResult);
      
      results.sendTip = true;
      console.log('   ✅ send_tip test passed');

      // Test: Leave world
      console.log('   Testing leave_world...');
      const leavePayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::world::leave_world`,
        arguments: []
      };

      const leaveTxn = await this.client.generateTransaction(account.address(), leavePayload);
      const signedLeaveTxn = await this.client.signTransaction(account, leaveTxn);
      const leaveResult = await this.client.submitTransaction(signedLeaveTxn);
      await this.client.waitForTransactionWithResult(leaveResult);
      
      results.leaveWorld = true;
      console.log('   ✅ leave_world test passed');

    } catch (error) {
      console.error('   ❌ World contract test failed:', error);
    }

    return results;
  }

  async testItemsContract() {
    console.log('🎒 Testing Items Contract...');
    
    const results = {
      mintItem: false,
      transferItem: false,
      tradeItems: false
    };

    try {
      // Test: Mint item
      console.log('   Testing mint_item...');
      const account = this.testAccounts[0];
      const itemName = 'TestItem';
      
      const mintPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::items::mint_item`,
        arguments: [Buffer.from(itemName).toString('hex')]
      };

      const mintTxn = await this.client.generateTransaction(account.address(), mintPayload);
      const signedMintTxn = await this.client.signTransaction(account, mintTxn);
      const mintResult = await this.client.submitTransaction(signedMintTxn);
      await this.client.waitForTransactionWithResult(mintResult);
      
      results.mintItem = true;
      console.log('   ✅ mint_item test passed');

      // Test: Transfer item
      console.log('   Testing transfer_item...');
      const recipient = this.testAccounts[1].address();
      const itemId = 1;
      
      const transferPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::items::transfer_item`,
        arguments: [recipient, itemId]
      };

      const transferTxn = await this.client.generateTransaction(account.address(), transferPayload);
      const signedTransferTxn = await this.client.signTransaction(account, transferTxn);
      const transferResult = await this.client.submitTransaction(signedTransferTxn);
      await this.client.waitForTransactionWithResult(transferResult);
      
      results.transferItem = true;
      console.log('   ✅ transfer_item test passed');

    } catch (error) {
      console.error('   ❌ Items contract test failed:', error);
    }

    return results;
  }

  async testPaymentsContract() {
    console.log('💳 Testing Payments Contract...');
    
    const results = {
      sendTip: false,
      batchTips: false
    };

    try {
      // Test: Send tip
      console.log('   Testing send_tip...');
      const sender = this.testAccounts[0];
      const recipient = this.testAccounts[1].address();
      const amount = 500;
      
      const tipPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::payments::send_tip`,
        arguments: [recipient, amount]
      };

      const tipTxn = await this.client.generateTransaction(sender.address(), tipPayload);
      const signedTipTxn = await this.client.signTransaction(sender, tipTxn);
      const tipResult = await this.client.submitTransaction(signedTipTxn);
      await this.client.waitForTransactionWithResult(tipResult);
      
      results.sendTip = true;
      console.log('   ✅ send_tip test passed');

    } catch (error) {
      console.error('   ❌ Payments contract test failed:', error);
    }

    return results;
  }

  async testDeFiContract() {
    console.log('📈 Testing DeFi Contract...');
    
    const results = {
      createMarket: false,
      placeBet: false,
      resolveMarket: false
    };

    try {
      // Test: Create market
      console.log('   Testing create_market...');
      const creator = this.testAccounts[0];
      const currentTime = Math.floor(Date.now() / 1000);
      const endTime = currentTime + 3600; // 1 hour from now
      
      const createPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::defi::create_market`,
        arguments: [
          Buffer.from('Test Market').toString('hex'),
          Buffer.from('Will it rain tomorrow?').toString('hex'),
          endTime
        ]
      };

      const createTxn = await this.client.generateTransaction(creator.address(), createPayload);
      const signedCreateTxn = await this.client.signTransaction(creator, createTxn);
      const createResult = await this.client.submitTransaction(signedCreateTxn);
      await this.client.waitForTransactionWithResult(createResult);
      
      results.createMarket = true;
      console.log('   ✅ create_market test passed');

      // Test: Place bet
      console.log('   Testing place_bet...');
      const bettor = this.testAccounts[1];
      const marketId = 1;
      const outcome = 1; // OUTCOME_A
      const amount = 1000;
      
      const betPayload = {
        type: 'entry_function_payload',
        function: `${this.contractAddress}::defi::place_bet`,
        arguments: [marketId, outcome, amount]
      };

      const betTxn = await this.client.generateTransaction(bettor.address(), betPayload);
      const signedBetTxn = await this.client.signTransaction(bettor, betTxn);
      const betResult = await this.client.submitTransaction(signedBetTxn);
      await this.client.waitForTransactionWithResult(betResult);
      
      results.placeBet = true;
      console.log('   ✅ place_bet test passed');

    } catch (error) {
      console.error('   ❌ DeFi contract test failed:', error);
    }

    return results;
  }

  async runAllTests() {
    console.log('🧪 Running all Aptosphere tests...');
    
    const results = {
      world: await this.testWorldContract(),
      items: await this.testItemsContract(),
      payments: await this.testPaymentsContract(),
      defi: await this.testDeFiContract()
    };

    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(results).forEach(([contract, tests]) => {
      console.log(`\n${contract.toUpperCase()} Contract:`);
      Object.entries(tests).forEach(([test, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${test}`);
      });
    });

    // Calculate overall success rate
    const allTests = Object.values(results).flat();
    const passedTests = allTests.filter(test => test === true).length;
    const totalTests = allTests.length;
    const successRate = (passedTests / totalTests) * 100;

    console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
    
    if (successRate === 100) {
      console.log('🎉 All tests passed! Aptosphere is ready for deployment.');
    } else {
      console.log('⚠️  Some tests failed. Please check the logs above.');
    }

    return results;
  }
}

// Main test function
async function main() {
  const tester = new AptosphereTester();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
    
    console.log('🧪 Aptosphere testing completed!');
  } catch (error) {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AptosphereTester;
