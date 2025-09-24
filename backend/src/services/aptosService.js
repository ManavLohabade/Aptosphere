const { AptosClient, AptosAccount, FaucetClient } = require('aptos');
const axios = require('axios');

class AptosService {
  constructor() {
    this.client = null;
    this.faucetClient = null;
    this.network = process.env.APTOS_NETWORK || 'testnet';
    this.nodeUrl = process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com';
    this.faucetUrl = process.env.APTOS_FAUCET_URL || 'https://faucet.testnet.aptoslabs.com';
  }

  async initialize() {
    try {
      console.log(`Connecting to Aptos ${this.network}...`);
      
      this.client = new AptosClient(this.nodeUrl);
      this.faucetClient = new FaucetClient(this.nodeUrl, this.faucetUrl);
      
      // Test connection
      const chainId = await this.client.getChainId();
      console.log(`Connected to Aptos ${this.network}, Chain ID: ${chainId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Aptos client:', error);
      throw error;
    }
  }

  async getAccountInfo(address) {
    try {
      const account = await this.client.getAccount(address);
      return account;
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }

  async getAccountResources(address) {
    try {
      const resources = await this.client.getAccountResources(address);
      return resources;
    } catch (error) {
      console.error('Failed to get account resources:', error);
      throw error;
    }
  }

  async getAccountResource(address, resourceType) {
    try {
      const resource = await this.client.getAccountResource(address, resourceType);
      return resource;
    } catch (error) {
      console.error('Failed to get account resource:', error);
      throw error;
    }
  }

  async getEventsByEventHandle(address, eventHandle, start = 0, limit = 25) {
    try {
      const events = await this.client.getEventsByEventHandle(
        address,
        eventHandle,
        { start, limit }
      );
      return events;
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }

  async submitTransaction(sender, payload) {
    try {
      const transaction = await this.client.generateTransaction(sender.address(), payload);
      const signedTxn = await this.client.signTransaction(sender, transaction);
      const pendingTxn = await this.client.submitTransaction(signedTxn);
      
      // Wait for transaction to complete
      const result = await this.client.waitForTransactionWithResult(pendingTxn.hash);
      return result;
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      throw error;
    }
  }

  async getTransactionByHash(hash) {
    try {
      const transaction = await this.client.getTransactionByHash(hash);
      return transaction;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  async getAccountSequenceNumber(address) {
    try {
      const account = await this.getAccountInfo(address);
      return account.sequence_number;
    } catch (error) {
      console.error('Failed to get sequence number:', error);
      throw error;
    }
  }

  async fundAccount(address, amount = 100000000) {
    try {
      if (this.network === 'testnet') {
        await this.faucetClient.fundAccount(address, amount);
        console.log(`Funded account ${address} with ${amount} octas`);
      } else {
        console.log('Faucet only available on testnet');
      }
    } catch (error) {
      console.error('Failed to fund account:', error);
      throw error;
    }
  }

  // Get contract address from deployed modules
  async getContractAddress() {
    // This would be set after contract deployment
    return process.env.CONTRACT_ADDRESS || null;
  }

  // Monitor for specific events
  async monitorEvents(contractAddress, eventHandles, callback) {
    try {
      console.log(`Starting event monitoring for contract: ${contractAddress}`);
      
      // Poll for events every 2 seconds
      setInterval(async () => {
        try {
          for (const eventHandle of eventHandles) {
            const events = await this.getEventsByEventHandle(
              contractAddress,
              eventHandle,
              0,
              10
            );
            
            for (const event of events) {
              callback({
                type: eventHandle,
                data: event.data,
                version: event.version,
                sequence_number: event.sequence_number,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error('Error monitoring events:', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start event monitoring:', error);
      throw error;
    }
  }

  // Get current gas price
  async getGasPrice() {
    try {
      const gasEstimate = await this.client.estimateGasPrice();
      return gasEstimate;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return { gas_estimate: 100 }; // Default fallback
    }
  }
}

module.exports = new AptosService();
