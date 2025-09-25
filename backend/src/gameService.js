const EventEmitter = require('events');

class GameService extends EventEmitter {
  constructor() {
    super();
    this.games = new Map();
    this.players = new Map();
    this.gameId = 1;
  }

  createGame(playerId, playerName, gameTime = 15) {
    const gameId = `game_${this.gameId++}`;
    const game = {
      id: gameId,
      players: new Map(),
      nodes: this.generateNodes(),
      gameState: {
        tick: 0,
        worldEnergy: 1000,
        totalCommits: 0,
        gamePhase: 'playing',
        timeLeft: gameTime,
        startTime: Date.now()
      },
      gameTime: gameTime
    };

    // Add player to game
    const player = {
      id: playerId,
      name: playerName,
      x: 400,
      y: 300,
      color: this.generatePlayerColor(playerId),
      energy: 100,
      score: 0,
      commits: 0,
      isAlive: true,
      avatar: '🚀',
      lastMove: Date.now()
    };

    game.players.set(playerId, player);
    this.games.set(gameId, game);
    this.players.set(playerId, { gameId, player });

    // Start game timer
    this.startGameTimer(gameId);

    // Emit initial game state with nodes
    this.emit('gameStateUpdate', {
      gameId,
      gameState: game.gameState,
      players: Array.from(game.players.values()),
      nodes: Array.from(game.nodes.values())
    });

    return { 
      gameId, 
      player, 
      gameState: game.gameState,
      nodes: Array.from(game.nodes.values())
    };
  }

  joinGame(gameId, playerId, playerName) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.gameState.gamePhase !== 'playing') {
      throw new Error('Game is not active');
    }

    const player = {
      id: playerId,
      name: playerName,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      color: this.generatePlayerColor(playerId),
      energy: 100,
      score: 0,
      commits: 0,
      isAlive: true,
      avatar: '🚀',
      lastMove: Date.now()
    };

    game.players.set(playerId, player);
    this.players.set(playerId, { gameId, player });

    this.emit('playerJoined', { gameId, player });
    return { player, gameState: game.gameState };
  }

  movePlayer(playerId, x, y) {
    const playerData = this.players.get(playerId);
    if (!playerData) {
      throw new Error('Player not found');
    }

    const game = this.games.get(playerData.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const player = game.players.get(playerId);
    if (!player) {
      throw new Error('Player not in game');
    }

    // Only update if position changed significantly (throttle updates)
    const positionChanged = Math.abs(player.x - x) > 5 || Math.abs(player.y - y) > 5;
    
    if (positionChanged) {
      // Update player position
      player.x = Math.max(50, Math.min(750, x));
      player.y = Math.max(50, Math.min(550, y));
      player.energy = Math.max(0, player.energy - 0.5);
      player.lastMove = Date.now();

      // Check for node collisions
      this.checkNodeCollisions(game, player);

      this.emit('playerMoved', { 
        gameId: playerData.gameId, 
        playerId, 
        x: player.x, 
        y: player.y,
        energy: player.energy 
      });
    }

    return { player, gameState: game.gameState };
  }

  commitWorldState(playerId, rootHash, tick) {
    const playerData = this.players.get(playerId);
    if (!playerData) {
      throw new Error('Player not found');
    }

    const game = this.games.get(playerData.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const player = game.players.get(playerId);
    if (!player) {
      throw new Error('Player not in game');
    }

    // Update player stats
    player.commits += 1;
    player.score += 100;
    game.gameState.totalCommits += 1;
    game.gameState.worldEnergy += 50;

    this.emit('worldStateCommitted', { 
      gameId: playerData.gameId, 
      playerId, 
      rootHash, 
      tick,
      commits: player.commits,
      score: player.score
    });

    return { player, gameState: game.gameState };
  }

  checkNodeCollisions(game, player) {
    game.nodes.forEach((node, nodeId) => {
      if (!node.isActive) return;

      const distance = Math.sqrt(
        Math.pow(player.x - node.x, 2) + Math.pow(player.y - node.y, 2)
      );

      if (distance < node.size + 25) {
        this.handleNodeCollision(game, player, node, nodeId);
      }
    });
  }

  handleNodeCollision(game, player, node, nodeId) {
    switch (node.type) {
      case 'energy':
        player.energy = Math.min(100, player.energy + node.value);
        break;
      case 'commit':
        this.commitWorldState(player.id, '0x' + Math.random().toString(16).slice(2, 66), game.gameState.tick);
        break;
      case 'powerup':
        player.score += node.value;
        break;
      case 'blockchain':
        player.score += node.value;
        player.commits += 1;
        break;
    }

    // Deactivate node
    node.isActive = false;

    this.emit('nodeCollected', {
      gameId: game.id,
      playerId: player.id,
      nodeId,
      nodeType: node.type,
      value: node.value,
      playerScore: player.score,
      playerEnergy: player.energy
    });
  }

  startGameTimer(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const timer = setInterval(() => {
      if (game.gameState.gamePhase !== 'playing') {
        clearInterval(timer);
        return;
      }

      game.gameState.tick += 1;
      game.gameState.timeLeft = Math.max(0, game.gameState.timeLeft - 1);

      // Only emit game state update every 5 seconds to reduce spam
      if (game.gameState.tick % 5 === 0) {
        this.emit('gameStateUpdate', {
          gameId,
          gameState: game.gameState,
          players: Array.from(game.players.values()),
          nodes: Array.from(game.nodes.values())
        });
      }

      // Check if game should end
      if (game.gameState.timeLeft <= 0) {
        this.endGame(gameId);
      }
    }, 1000); // Update every second

    game.timer = timer;
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    game.gameState.gamePhase = 'ended';
    
    // Find winner
    const players = Array.from(game.players.values());
    const winner = players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );

    game.gameState.winner = winner.name;

    // Clear timer
    if (game.timer) {
      clearInterval(game.timer);
    }

    this.emit('gameEnded', {
      gameId,
      winner: winner.name,
      finalScore: winner.score,
      players: players
    });
  }

  generateNodes() {
    const nodes = new Map();
    const nodeTypes = ['energy', 'commit', 'powerup', 'blockchain'];
    const colors = {
      energy: '#10b981',
      commit: '#8b5cf6',
      powerup: '#f59e0b',
      blockchain: '#6366f1'
    };

    for (let i = 0; i < 5; i++) {
      const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      const node = {
        id: `node_${i}`,
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        type,
        value: Math.floor(Math.random() * 200) + 50,
        isActive: true,
        color: colors[type],
        size: 20 + Math.random() * 15
      };
      nodes.set(node.id, node);
    }

    return nodes;
  }

  generatePlayerColor(playerId) {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    const hash = playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  getGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    return {
      gameState: game.gameState,
      players: Array.from(game.players.values()),
      nodes: Array.from(game.nodes.values())
    };
  }

  getPlayerGame(playerId) {
    const playerData = this.players.get(playerId);
    if (!playerData) return null;

    return this.getGameState(playerData.gameId);
  }
}

module.exports = new GameService();
