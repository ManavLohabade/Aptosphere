const aptosService = require('./aptosService');

class EventService {
  constructor() {
    this.events = [];
    this.monitoring = false;
    this.eventHandles = [
      'player_joined',
      'player_moved', 
      'player_left',
      'tip_sent',
      'item_traded',
      'item_minted'
    ];
    this.contractAddress = null;
  }

  async startMonitoring(callback) {
    try {
      if (this.monitoring) {
        console.log('Event monitoring already started');
        return;
      }

      // Get contract address
      this.contractAddress = await aptosService.getContractAddress();
      if (!this.contractAddress) {
        console.log('Contract address not set, using mock events for demo');
        this.startMockEventGeneration(callback);
        return;
      }

      console.log(`Starting event monitoring for contract: ${this.contractAddress}`);
      
      // Start monitoring Aptos events
      await aptosService.monitorEvents(
        this.contractAddress,
        this.eventHandles,
        (event) => {
          this.addEvent(event);
          callback(event);
        }
      );
      
      this.monitoring = true;
    } catch (error) {
      console.error('Failed to start event monitoring:', error);
      // Fallback to mock events
      this.startMockEventGeneration(callback);
    }
  }

  startMockEventGeneration(callback) {
    console.log('Starting mock event generation for demo...');
    
    // Generate mock events every 5-10 seconds
    const generateMockEvent = () => {
      const eventTypes = [
        'player_joined',
        'player_moved',
        'tip_sent',
        'item_traded'
      ];
      
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const mockEvent = this.generateMockEvent(eventType);
      
      this.addEvent(mockEvent);
      callback(mockEvent);
      
      // Schedule next event
      const delay = Math.random() * 5000 + 5000; // 5-10 seconds
      setTimeout(generateMockEvent, delay);
    };
    
    // Start generating events after 2 seconds
    setTimeout(generateMockEvent, 2000);
  }

  generateMockEvent(type) {
    const baseEvent = {
      type,
      timestamp: new Date().toISOString(),
      version: Math.floor(Math.random() * 1000000),
      sequence_number: Math.floor(Math.random() * 1000)
    };

    switch (type) {
      case 'player_joined':
        return {
          ...baseEvent,
          data: {
            player_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            username: `Player${Math.floor(Math.random() * 1000)}`,
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20),
            balance: Math.floor(Math.random() * 1000)
          }
        };

      case 'player_moved':
        return {
          ...baseEvent,
          data: {
            player_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            old_x: Math.floor(Math.random() * 20),
            old_y: Math.floor(Math.random() * 20),
            new_x: Math.floor(Math.random() * 20),
            new_y: Math.floor(Math.random() * 20)
          }
        };

      case 'tip_sent':
        return {
          ...baseEvent,
          data: {
            sender: `0x${Math.random().toString(16).substr(2, 40)}`,
            recipient: `0x${Math.random().toString(16).substr(2, 40)}`,
            amount: Math.floor(Math.random() * 100) + 1,
            transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
          }
        };

      case 'item_traded':
        return {
          ...baseEvent,
          data: {
            item_id: Math.floor(Math.random() * 1000),
            old_owner: `0x${Math.random().toString(16).substr(2, 40)}`,
            new_owner: `0x${Math.random().toString(16).substr(2, 40)}`,
            transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
          }
        };

      case 'item_minted':
        return {
          ...baseEvent,
          data: {
            item_id: Math.floor(Math.random() * 1000),
            item_name: `Item${Math.floor(Math.random() * 1000)}`,
            owner: `0x${Math.random().toString(16).substr(2, 40)}`
          }
        };

      default:
        return baseEvent;
    }
  }

  addEvent(event) {
    this.events.unshift(event); // Add to beginning
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    
    console.log(`Event added: ${event.type} at ${event.timestamp}`);
  }

  getRecentEvents(limit = 20) {
    return this.events.slice(0, limit);
  }

  getEventsByType(type, limit = 10) {
    return this.events
      .filter(event => event.type === type)
      .slice(0, limit);
  }

  getEventsByAddress(address, limit = 10) {
    return this.events
      .filter(event => {
        const data = event.data;
        return data && (
          data.player_address === address ||
          data.sender === address ||
          data.recipient === address ||
          data.owner === address ||
          data.old_owner === address ||
          data.new_owner === address
        );
      })
      .slice(0, limit);
  }

  // Get event statistics
  getEventStats() {
    const stats = {
      total: this.events.length,
      byType: {},
      lastEvent: this.events[0]?.timestamp || null,
      monitoring: this.monitoring
    };

    this.events.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    });

    return stats;
  }

  // Stop monitoring
  stopMonitoring() {
    this.monitoring = false;
    console.log('Event monitoring stopped');
  }

  // Clear all events
  clearEvents() {
    this.events = [];
    console.log('All events cleared');
  }
}

module.exports = new EventService();
