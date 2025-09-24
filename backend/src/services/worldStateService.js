class WorldStateService {
  constructor() {
    this.players = new Map();
    this.items = new Map();
    this.transactions = [];
    this.lastUpdate = new Date().toISOString();
  }

  getWorldState() {
    return {
      players: Array.from(this.players.values()),
      items: Array.from(this.items.values()),
      totalPlayers: this.players.size,
      totalItems: this.items.size,
      lastUpdate: this.lastUpdate,
      timestamp: new Date().toISOString()
    };
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getPlayer(address) {
    return this.players.get(address);
  }

  addPlayer(playerData) {
    const player = {
      address: playerData.address,
      username: playerData.username,
      x: playerData.x || 0,
      y: playerData.y || 0,
      balance: playerData.balance || 0,
      inventory: playerData.inventory || [],
      joinedAt: new Date().toISOString(),
      lastMove: new Date().toISOString()
    };
    
    this.players.set(playerData.address, player);
    this.lastUpdate = new Date().toISOString();
    
    console.log(`Player added: ${player.username} at (${player.x}, ${player.y})`);
    return player;
  }

  updatePlayerPosition(address, x, y) {
    const player = this.players.get(address);
    if (player) {
      player.x = x;
      player.y = y;
      player.lastMove = new Date().toISOString();
      this.lastUpdate = new Date().toISOString();
      
      console.log(`Player ${player.username} moved to (${x}, ${y})`);
      return player;
    }
    return null;
  }

  removePlayer(address) {
    const player = this.players.get(address);
    if (player) {
      this.players.delete(address);
      this.lastUpdate = new Date().toISOString();
      
      console.log(`Player removed: ${player.username}`);
      return player;
    }
    return null;
  }

  updatePlayerBalance(address, newBalance) {
    const player = this.players.get(address);
    if (player) {
      player.balance = newBalance;
      this.lastUpdate = new Date().toISOString();
      
      console.log(`Player ${player.username} balance updated to ${newBalance}`);
      return player;
    }
    return null;
  }

  addItem(itemData) {
    const item = {
      id: itemData.id,
      name: itemData.name,
      owner: itemData.owner,
      createdAt: new Date().toISOString(),
      lastTrade: null
    };
    
    this.items.set(itemData.id, item);
    this.lastUpdate = new Date().toISOString();
    
    console.log(`Item added: ${item.name} (ID: ${item.id}) owned by ${item.owner}`);
    return item;
  }

  transferItem(itemId, newOwner) {
    const item = this.items.get(itemId);
    if (item) {
      const oldOwner = item.owner;
      item.owner = newOwner;
      item.lastTrade = new Date().toISOString();
      this.lastUpdate = new Date().toISOString();
      
      console.log(`Item ${item.name} transferred from ${oldOwner} to ${newOwner}`);
      return item;
    }
    return null;
  }

  getItem(itemId) {
    return this.items.get(itemId);
  }

  getItemsByOwner(ownerAddress) {
    return Array.from(this.items.values()).filter(item => item.owner === ownerAddress);
  }

  addTransaction(transactionData) {
    const transaction = {
      id: transactionData.id || Math.random().toString(36).substr(2, 9),
      type: transactionData.type,
      from: transactionData.from,
      to: transactionData.to,
      amount: transactionData.amount,
      itemId: transactionData.itemId,
      timestamp: new Date().toISOString(),
      hash: transactionData.hash
    };
    
    this.transactions.push(transaction);
    this.lastUpdate = new Date().toISOString();
    
    console.log(`Transaction added: ${transaction.type} from ${transaction.from} to ${transaction.to}`);
    return transaction;
  }

  getRecentTransactions(limit = 10) {
    return this.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Handle events from blockchain
  handleEvent(event) {
    try {
      console.log('Handling event:', event);
      
      switch (event.type) {
        case 'player_joined':
          this.addPlayer({
            address: event.data.player_address,
            username: event.data.username,
            x: event.data.x || 0,
            y: event.data.y || 0,
            balance: event.data.balance || 0
          });
          break;
          
        case 'player_moved':
          this.updatePlayerPosition(
            event.data.player_address,
            event.data.new_x,
            event.data.new_y
          );
          break;
          
        case 'player_left':
          this.removePlayer(event.data.player_address);
          break;
          
        case 'tip_sent':
          this.addTransaction({
            type: 'tip',
            from: event.data.sender,
            to: event.data.recipient,
            amount: event.data.amount,
            hash: event.data.transaction_hash
          });
          break;
          
        case 'item_traded':
          this.transferItem(
            event.data.item_id,
            event.data.new_owner
          );
          this.addTransaction({
            type: 'trade',
            from: event.data.old_owner,
            to: event.data.new_owner,
            itemId: event.data.item_id,
            hash: event.data.transaction_hash
          });
          break;
          
        case 'item_minted':
          this.addItem({
            id: event.data.item_id,
            name: event.data.item_name,
            owner: event.data.owner
          });
          break;
          
        default:
          console.log('Unknown event type:', event.type);
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  // Get players in a specific area (for collision detection, etc.)
  getPlayersInArea(x, y, radius = 1) {
    return Array.from(this.players.values()).filter(player => {
      const distance = Math.sqrt(
        Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2)
      );
      return distance <= radius;
    });
  }

  // Get leaderboard by balance
  getLeaderboard(limit = 10) {
    return Array.from(this.players.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }

  // Reset world state (for testing)
  reset() {
    this.players.clear();
    this.items.clear();
    this.transactions = [];
    this.lastUpdate = new Date().toISOString();
    console.log('World state reset');
  }
}

module.exports = new WorldStateService();
