const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const dotenv = require('dotenv');
const aptosService = require('./services/aptosService');
const worldStateService = require('./services/worldStateService');
const eventService = require('./services/eventService');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients
const clients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Generate unique client ID
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, ws);
  
  // Send initial world state
  ws.send(JSON.stringify({
    type: 'world_state',
    data: worldStateService.getWorldState()
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(clientId, data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

// Handle client messages
function handleClientMessage(clientId, data) {
  switch (data.type) {
    case 'subscribe_events':
      // Client wants to subscribe to specific events
      console.log(`Client ${clientId} subscribed to events:`, data.events);
      break;
    case 'ping':
      // Heartbeat
      clients.get(clientId)?.send(JSON.stringify({ type: 'pong' }));
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

// Broadcast to all connected clients
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    } else {
      clients.delete(clientId);
    }
  });
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connectedClients: clients.size
  });
});

app.get('/api/world-state', (req, res) => {
  res.json(worldStateService.getWorldState());
});

app.get('/api/players', (req, res) => {
  res.json(worldStateService.getPlayers());
});

app.get('/api/events', (req, res) => {
  res.json(eventService.getRecentEvents());
});

// Start event monitoring
async function startEventMonitoring() {
  try {
    console.log('Starting Aptos event monitoring...');
    
    // Start monitoring for world events
    await eventService.startMonitoring((event) => {
      console.log('New event received:', event);
      
      // Update world state based on event
      worldStateService.handleEvent(event);
      
      // Broadcast to all connected clients
      broadcastToClients({
        type: 'event',
        data: event
      });
      
      // Broadcast updated world state
      broadcastToClients({
        type: 'world_state',
        data: worldStateService.getWorldState()
      });
    });
    
    console.log('Event monitoring started successfully');
  } catch (error) {
    console.error('Failed to start event monitoring:', error);
  }
}

// Initialize services
async function initialize() {
  try {
    console.log('Initializing Aptosphere backend...');
    
    // Initialize Aptos connection
    await aptosService.initialize();
    
    // Start event monitoring
    await startEventMonitoring();
    
    console.log('Backend initialized successfully');
  } catch (error) {
    console.error('Failed to initialize backend:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Aptosphere backend running on port ${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}/ws`);
  
  // Initialize after server starts
  initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
