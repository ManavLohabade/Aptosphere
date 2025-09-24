const { AptosClient, AptosAccount } = require('aptos');

class ContractHelpers {
  constructor(contractAddress, nodeUrl) {
    this.contractAddress = contractAddress;
    this.client = new AptosClient(nodeUrl);
  }

  // World contract functions
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

  async leaveWorld(account) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::world::leave_world`,
      arguments: []
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

  // Items contract functions
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

  async transferItem(account, recipient, itemId) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::items::transfer_item`,
      arguments: [recipient, itemId]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    
    return await this.client.waitForTransactionWithResult(result);
  }

  async tradeItems(account, recipient, myItemId, theirItemId) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::items::trade_items`,
      arguments: [recipient, myItemId, theirItemId]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    
    return await this.client.waitForTransactionWithResult(result);
  }

  // Payments contract functions
  async sendPaymentTip(account, recipient, amount) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::payments::send_tip`,
      arguments: [recipient, amount]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    
    return await this.client.waitForTransactionWithResult(result);
  }

  // DeFi contract functions
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

  async resolveMarket(account, marketId, outcome) {
    const payload = {
      type: 'entry_function_payload',
      function: `${this.contractAddress}::defi::resolve_market`,
      arguments: [marketId, outcome]
    };

    const transaction = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, transaction);
    const result = await this.client.submitTransaction(signedTxn);
    
    return await this.client.waitForTransactionWithResult(result);
  }

  // View functions
  async getPlayerInfo(address) {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::world::Player`
      );
      return resource.data;
    } catch (error) {
      console.error('Error getting player info:', error);
      return null;
    }
  }

  async getWorldState() {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::world::WorldState`
      );
      return resource.data;
    } catch (error) {
      console.error('Error getting world state:', error);
      return null;
    }
  }

  async getItemInfo(itemId) {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::items::ItemStore`
      );
      return resource.data;
    } catch (error) {
      console.error('Error getting item info:', error);
      return null;
    }
  }

  async getMarketInfo(marketId) {
    try {
      const resource = await this.client.getAccountResource(
        this.contractAddress,
        `${this.contractAddress}::defi::DeFiStore`
      );
      return resource.data;
    } catch (error) {
      console.error('Error getting market info:', error);
      return null;
    }
  }
}

module.exports = ContractHelpers;
