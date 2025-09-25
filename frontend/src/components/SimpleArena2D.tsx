import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import { useRealTimeGame } from '../hooks/useRealTimeGame'
import toast from 'react-hot-toast'

interface SimplePlayer {
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
}

interface SimpleNode {
  id: string
  x: number
  y: number
  type: 'energy' | 'commit' | 'powerup' | 'blockchain'
  value: number
  isActive: boolean
  color: string
  size: number
}

interface SimpleGameState {
  tick: number
  worldEnergy: number
  totalCommits: number
  gamePhase: 'waiting' | 'playing' | 'paused' | 'ended'
  winner?: string
  timeLeft: number
}

export const SimpleArena2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { account, isConnected } = useWallet()
  const { 
    gameData, 
    currentPlayer: realTimePlayer, 
    isConnected: wsConnected,
    createGame, 
    movePlayer, 
    commitWorldState 
  } = useRealTimeGame()
  
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [showNameModal, setShowNameModal] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [gameTime, setGameTime] = useState(15)

  // Initialize game
  useEffect(() => {
    if (isConnected && !realTimePlayer) {
      setShowNameModal(true)
    }
    setupEventListeners()
    
    return () => {
      cleanupEventListeners()
    }
  }, [isConnected, realTimePlayer])

  const initializeGame = () => {
    // Create mock players
    const mockPlayers: SimplePlayer[] = [
      {
        id: 'player1',
        name: 'CryptoWarrior',
        x: 100,
        y: 100,
        color: '#3b82f6',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        avatar: '⚔️'
      },
      {
        id: 'player2',
        name: 'BlockchainNinja',
        x: 700,
        y: 500,
        color: '#ef4444',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        avatar: '🥷'
      }
    ]

    // Create mock nodes
    const mockNodes: SimpleNode[] = [
      { id: 'node1', x: 200, y: 200, type: 'energy', value: 50, isActive: true, color: '#10b981', size: 20 },
      { id: 'node2', x: 600, y: 300, type: 'commit', value: 100, isActive: true, color: '#8b5cf6', size: 25 },
      { id: 'node3', x: 400, y: 400, type: 'powerup', value: 200, isActive: true, color: '#f59e0b', size: 30 },
      { id: 'node4', x: 300, y: 500, type: 'blockchain', value: 500, isActive: true, color: '#6366f1', size: 35 },
      { id: 'node5', x: 500, y: 150, type: 'energy', value: 75, isActive: true, color: '#10b981', size: 20 },
    ]

    setPlayers(mockPlayers)
    setNodes(mockNodes)
    setGameState(prev => ({ ...prev, gamePhase: 'waiting', timeLeft: 15 }))

    // Set current player if wallet connected
    if (isConnected && account) {
      const newPlayer: SimplePlayer = {
        id: account,
        name: 'You',
        x: 400,
        y: 300,
        color: '#8b5cf6',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        avatar: '🚀'
      }
      setCurrentPlayer(newPlayer)
      setPlayers(prev => [...prev, newPlayer])
      setGameState(prev => ({ ...prev, gamePhase: 'playing', timeLeft: 15 }))
    }
  }

  const setupEventListeners = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set([...prev, e.key.toLowerCase()]))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev)
        newKeys.delete(e.key.toLowerCase())
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }

  const cleanupEventListeners = () => {
    // Cleanup handled in setupEventListeners return
  }

  const handleNameSubmit = async () => {
    if (playerName.trim() && account) {
      try {
        await createGame(account, playerName.trim(), gameTime)
        setShowNameModal(false)
      } catch (error) {
        console.error('Failed to create game:', error)
      }
    }
  }

  // Game loop
  useEffect(() => {
    if (!gameData || gameData.gameState.gamePhase !== 'playing' || !isConnected || !realTimePlayer) return

    const gameLoop = setInterval(() => {
      updateGame()
    }, 16) // 60 FPS for smooth movement

    return () => clearInterval(gameLoop)
  }, [gameData?.gameState.gamePhase, isConnected, keys, realTimePlayer])

  const updateGame = () => {
    // Update player positions based on keys
    if (realTimePlayer) {
      let newX = realTimePlayer.x
      let newY = realTimePlayer.y
      let moved = false

      if (keys.has('w') || keys.has('arrowup')) {
        newY = Math.max(50, newY - 3)
        moved = true
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        newY = Math.min(550, newY + 3)
        moved = true
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        newX = Math.max(50, newX - 3)
        moved = true
      }
      if (keys.has('d') || keys.has('arrowright')) {
        newX = Math.min(750, newX + 3)
        moved = true
      }

      if (moved) {
        // Call the real-time move function
        movePlayer(newX, newY)
      }
    }
  }

  // Node collisions are now handled by the backend

  // Commits are now handled by the backend

  // Render game
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw arena background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1e293b')
    gradient.addColorStop(1, '#312e81')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw arena grid
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw nodes
    gameData?.nodes.forEach(node => {
      if (node.isActive) {
        // Node body
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
        ctx.fillStyle = node.color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()

        // Node type icon
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        const icons = { energy: '⚡', commit: '💾', powerup: '🚀', blockchain: '⛓️' }
        ctx.fillText(icons[node.type], node.x, node.y + 5)
      }
    })

    // Draw players
    gameData?.players.forEach(player => {
      if (player.isAlive) {
        // Player body
        ctx.beginPath()
        ctx.arc(player.x, player.y, 25, 0, 2 * Math.PI)
        ctx.fillStyle = player.color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()

        // Player avatar
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(player.avatar, player.x, player.y + 7)

        // Player name and stats
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(player.name, player.x, player.y - 35)
        
        ctx.font = '10px Arial'
        ctx.fillText(`⚡${Math.floor(player.energy)}`, player.x, player.y + 40)
        ctx.fillText(`🏆${player.score}`, player.x, player.y + 55)
      }
    })

    // Draw current player with special effects
    if (realTimePlayer && realTimePlayer.isAlive) {
      const time = Date.now() * 0.005
      const pulseSize = 30 + Math.sin(time) * 5
      
      // Pulsing ring
      ctx.beginPath()
      ctx.arc(realTimePlayer.x, realTimePlayer.y, pulseSize, 0, 2 * Math.PI)
      ctx.strokeStyle = realTimePlayer.color
      ctx.lineWidth = 4
      ctx.stroke()
    }
  }, [gameData])

  useEffect(() => {
    renderGame()
  }, [renderGame])

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-crosshair"
      />
      
      {/* Game HUD */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Players: {gameData?.players.length || 0}</span>
          </div>
          <div>World Tick: {gameData?.gameState.tick || 0}</div>
          <div>Total Commits: {gameData?.gameState.totalCommits || 0}</div>
          <div>World Energy: {gameData?.gameState.worldEnergy || 0}</div>
          <div>Time Left: {Math.floor((gameData?.gameState.timeLeft || 0) / 60)}:{((gameData?.gameState.timeLeft || 0) % 60).toString().padStart(2, '0')}</div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="text-sm space-y-1">
          <div>🎮 Controls:</div>
          <div>WASD / Arrow Keys: Move</div>
          <div>Collect glowing nodes to gain energy & score!</div>
          <div>Different colors = different rewards!</div>
        </div>
      </div>

      {/* Game Status */}
      <div className="absolute top-4 right-4">
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          gameData?.gameState.gamePhase === 'playing' ? 'bg-green-600/80 text-white' : 
          gameData?.gameState.gamePhase === 'ended' ? 'bg-red-600/80 text-white' :
          'bg-yellow-600/80 text-white'
        }`}>
          {gameData?.gameState.gamePhase === 'playing' ? '🎮 Playing' : 
           gameData?.gameState.gamePhase === 'ended' ? '🏁 Game Over' :
           '⏳ Waiting'}
        </div>
      </div>

      {/* Waiting Screen */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-xl text-center shadow-2xl max-w-md"
            >
              <div className="text-6xl mb-4">🌌</div>
              <div className="text-2xl font-bold mb-4">Welcome to Aptosphere Arena!</div>
              <div className="text-lg mb-6">Connect your wallet to start the battle</div>
              <div className="text-sm text-gray-300">
                Use WASD keys to move, collect glowing nodes for energy and score!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Input Modal */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl text-center shadow-2xl max-w-md"
            >
              <div className="text-6xl mb-4">🎮</div>
              <div className="text-2xl font-bold mb-4">Enter Your Name</div>
              <div className="mb-4">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your player name"
                  className="w-full px-4 py-3 rounded-lg text-black text-center text-lg font-medium"
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Game Duration (seconds)</label>
                <select
                  value={gameTime}
                  onChange={(e) => setGameTime(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg text-black text-center"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
              <button
                onClick={handleNameSubmit}
                disabled={!playerName.trim()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Start Game ({gameTime} seconds)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Announcement */}
      <AnimatePresence>
        {gameData?.gameState.gamePhase === 'ended' && gameData?.gameState.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-8 rounded-xl text-center shadow-2xl"
            >
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-3xl font-bold mb-2">ARENA CHAMPION!</div>
              <div className="text-xl">{gameData?.gameState.winner} Wins!</div>
              <div className="text-sm mt-4">Final Score: {gameData?.players.find(p => p.name === gameData?.gameState.winner)?.score}</div>
              <button
                onClick={() => {
                  // Reset game by creating a new one
                  if (account && playerName) {
                    createGame(account, playerName, gameTime)
                  }
                }}
                className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                🔄 Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
