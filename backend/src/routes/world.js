const express = require('express');
const router = express.Router();
const worldStateService = require('../services/worldStateService');
const eventService = require('../services/eventService');

// Get world state
router.get('/state', async (req, res) => {
  try {
    const worldState = worldStateService.getWorldState();
    res.json(worldState);
  } catch (error) {
    console.error('Error getting world state:', error);
    res.status(500).json({ error: 'Failed to get world state' });
  }
});

// Get all players
router.get('/players', async (req, res) => {
  try {
    const players = worldStateService.getPlayers();
    res.json(players);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: 'Failed to get players' });
  }
});

// Get specific player
router.get('/players/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const player = worldStateService.getPlayer(address);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error getting player:', error);
    res.status(500).json({ error: 'Failed to get player' });
  }
});

// Get players in area
router.get('/players/area/:x/:y/:radius?', async (req, res) => {
  try {
    const { x, y, radius = 1 } = req.params;
    const players = worldStateService.getPlayersInArea(
      parseInt(x), 
      parseInt(y), 
      parseInt(radius)
    );
    res.json(players);
  } catch (error) {
    console.error('Error getting players in area:', error);
    res.status(500).json({ error: 'Failed to get players in area' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = worldStateService.getLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get recent events
router.get('/events', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const events = eventService.getRecentEvents(parseInt(limit));
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get events by type
router.get('/events/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    const events = eventService.getEventsByType(type, parseInt(limit));
    res.json(events);
  } catch (error) {
    console.error('Error getting events by type:', error);
    res.status(500).json({ error: 'Failed to get events by type' });
  }
});

// Get events by address
router.get('/events/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 10 } = req.query;
    const events = eventService.getEventsByAddress(address, parseInt(limit));
    res.json(events);
  } catch (error) {
    console.error('Error getting events by address:', error);
    res.status(500).json({ error: 'Failed to get events by address' });
  }
});

// Get event statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = eventService.getEventStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting event stats:', error);
    res.status(500).json({ error: 'Failed to get event stats' });
  }
});

// Reset world state (for testing)
router.post('/reset', async (req, res) => {
  try {
    worldStateService.reset();
    res.json({ message: 'World state reset successfully' });
  } catch (error) {
    console.error('Error resetting world state:', error);
    res.status(500).json({ error: 'Failed to reset world state' });
  }
});

module.exports = router;
