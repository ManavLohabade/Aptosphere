import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface GameState {
  tick: number
  worldEnergy: number
  totalCommits: number
  gamePhase: 'waiting' | 'playing' | 'ended'
  timeLeft: number
  winner?: string
}

interface Player {
  id: string
  name: string
  x: number
  y: number
  color: string
  energy: number
  score: number
  commits: number
  isAlive: boolean
  avatar: string
  lastMove: number
}

interface Node {
  id: string
  x: number
  y: number
  type: string
  value: number
  isActive: boolean
  color: string
  size: number
}

interface GameData {
  gameState: GameState
  players: Player[]
  nodes: Node[]
}

export const useRealTimeGame = () => {
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws'
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleWebSocketMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    setWs(websocket)
  }, [])

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'game_state_update':
        setGameData(message.data)
        break
      case 'player_moved':
        if (message.data.playerId === currentPlayer?.id) {
          setCurrentPlayer(message.data.player)
        }
        break
      case 'node_collected':
        toast.success(`Collected ${message.data.nodeType} node! +${message.data.value} points`)
        break
      case 'world_state_committed':
        toast.success('World state committed! +100 points')
        break
      case 'game_ended':
        toast.success(`Game Over! Winner: ${message.data.winner}`)
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  // Create a new game
  const createGame = async (playerId: string, playerName: string, gameTime: number = 15) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          playerName,
          gameTime
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create game')
      }

      const data = await response.json()
      setGameId(data.gameId)
      setCurrentPlayer(data.player)
      setGameData({
        gameState: data.gameState,
        players: [data.player],
        nodes: []
      })

      return data
    } catch (error: any) {
      console.error('Failed to create game:', error)
      toast.error(`Failed to create game: ${error.message}`)
      throw error
    }
  }

  // Join an existing game
  const joinGame = async (gameId: string, playerId: string, playerName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          playerId,
          playerName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to join game')
      }

      const data = await response.json()
      setCurrentPlayer(data.player)
      setGameId(gameId)
      setGameData(prev => prev ? {
        ...prev,
        players: [...prev.players, data.player]
      } : null)

      return data
    } catch (error: any) {
      console.error('Failed to join game:', error)
      toast.error(`Failed to join game: ${error.message}`)
      throw error
    }
  }

  // Move player
  const movePlayer = async (x: number, y: number) => {
    if (!currentPlayer || !ws) return

    try {
      // Send via WebSocket for real-time updates
      ws.send(JSON.stringify({
        type: 'game_move',
        playerId: currentPlayer.id,
        x,
        y
      }))

      // Also send via HTTP for backup
      await fetch(`${import.meta.env.VITE_API_URL}/api/game/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          x,
          y
        })
      })
    } catch (error: any) {
      console.error('Failed to move player:', error)
      toast.error(`Failed to move: ${error.message}`)
    }
  }

  // Commit world state
  const commitWorldState = async (rootHash: string, tick: number) => {
    if (!currentPlayer || !ws) return

    try {
      // Send via WebSocket for real-time updates
      ws.send(JSON.stringify({
        type: 'game_commit',
        playerId: currentPlayer.id,
        rootHash,
        tick
      }))

      // Also send via HTTP for backup
      await fetch(`${import.meta.env.VITE_API_URL}/api/game/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          rootHash,
          tick
        })
      })
    } catch (error: any) {
      console.error('Failed to commit world state:', error)
      toast.error(`Failed to commit: ${error.message}`)
    }
  }

  // Get game state
  const getGameState = async (gameId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/state/${gameId}`)
      if (!response.ok) {
        throw new Error('Failed to get game state')
      }
      const data = await response.json()
      setGameData(data)
      return data
    } catch (error: any) {
      console.error('Failed to get game state:', error)
      toast.error(`Failed to get game state: ${error.message}`)
      throw error
    }
  }

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket()
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [connectWebSocket])

  return {
    gameData,
    currentPlayer,
    gameId,
    isConnected,
    createGame,
    joinGame,
    movePlayer,
    commitWorldState,
    getGameState
  }
}
