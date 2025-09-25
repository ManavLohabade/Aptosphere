import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import { useWorld } from './hooks/useWorld'
import toast from 'react-hot-toast'

interface ArenaPlayer {
  id: string
  name: string
  x: number
  y: number
  color: string
  energy: number
  score: number
  commits: number
  isAlive: boolean
  lastAction: string
  avatar: string
  team: 'blue' | 'red'
}

interface ArenaNode {
  id: string
  x: number
  y: number
  type: 'energy' | 'commit' | 'powerup' | 'blockchain'
  value: number
  isActive: boolean
  color: string
  size: number
}

interface GameState {
  tick: number
  worldEnergy: number
  totalCommits: number
  gamePhase: 'waiting' | 'playing' | 'paused' | 'ended'
  winner?: string
  timeLeft: number
}

interface ArenaGameProps {
  onCommit: (playerId: string, nodeId: string) => Promise<void>
  onMove: (playerId: string, x: number, y: number) => void
  onCollect: (playerId: string, nodeId: string) => void
}

export const ArenaGame: React.FC<ArenaGameProps> = ({
  onCommit,
  onMove,
  onCollect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<any>(null)
  const { account, isConnected } = useWallet()
  
  const [players, setPlayers] = useState<ArenaPlayer[]>([])
  const [nodes, setNodes] = useState<ArenaNode[]>([])
  const [gameState, setGameState] = useState<GameState>({
    tick: 0,
    worldEnergy: 1000,
    totalCommits: 0,
    gamePhase: 'waiting',
    timeLeft: 300
  })
  const [currentPlayer, setCurrentPlayer] = useState<ArenaPlayer | undefined>()
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [particles, setParticles] = useState<any[]>([])
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })

  // Initialize game
  useEffect(() => {
    initializeGame()
    setupEventListeners()
    
    return () => {
      cleanupEventListeners()
    }
  }, [])

  const initializeGame = () => {
    // Create mock players
    const mockPlayers: ArenaPlayer[] = [
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
        lastAction: 'spawn',
        avatar: '⚔️',
        team: 'blue'
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
        lastAction: 'spawn',
        avatar: '🥷',
        team: 'red'
      }
    ]

    // Create mock nodes
    const mockNodes: ArenaNode[] = [
      { id: 'node1', x: 200, y: 200, type: 'energy', value: 50, isActive: true, color: '#10b981', size: 20 },
      { id: 'node2', x: 600, y: 300, type: 'commit', value: 100, isActive: true, color: '#8b5cf6', size: 25 },
      { id: 'node3', x: 400, y: 400, type: 'powerup', value: 200, isActive: true, color: '#f59e0b', size: 30 },
      { id: 'node4', x: 300, y: 500, type: 'blockchain', value: 500, isActive: true, color: '#6366f1', size: 35 },
      { id: 'node5', x: 500, y: 150, type: 'energy', value: 75, isActive: true, color: '#10b981', size: 20 },
    ]

    setPlayers(mockPlayers)
    setNodes(mockNodes)
    setGameState(prev => ({ ...prev, gamePhase: 'playing' }))

    // Set current player if wallet connected
    if (isConnected && account) {
      const newPlayer: ArenaPlayer = {
        id: account,
        name: 'You',
        x: 400,
        y: 300,
        color: '#8b5cf6',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        lastAction: 'spawn',
        avatar: '🚀',
        team: 'blue'
      }
      setCurrentPlayer(newPlayer)
      setPlayers(prev => [...prev, newPlayer])
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

  // Game loop
  useEffect(() => {
    if (gameState.gamePhase !== 'playing') return

    const gameLoop = setInterval(() => {
      updateGame()
    }, 16) // 60 FPS

    return () => clearInterval(gameLoop)
  }, [gameState.gamePhase, keys, players, nodes])

  const updateGame = () => {
    // Update player positions based on keys
    if (currentPlayer) {
      let newX = currentPlayer.x
      let newY = currentPlayer.y
      let moved = false

      if (keys.has('w') || keys.has('arrowup')) {
        newY = Math.max(50, newY - 5)
        moved = true
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        newY = Math.min(550, newY + 5)
        moved = true
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        newX = Math.max(50, newX - 5)
        moved = true
      }
      if (keys.has('d') || keys.has('arrowright')) {
        newX = Math.min(750, newX + 5)
        moved = true
      }

      if (moved) {
        setCurrentPlayer(prev => prev ? { ...prev, x: newX, y: newY, energy: Math.max(0, prev.energy - 0.5) } : undefined)
        setPlayers(prev => 
          prev.map(p => p.id === currentPlayer.id ? { ...p, x: newX, y: newY, energy: Math.max(0, p.energy - 0.5) } : p)
        )
        onMove(currentPlayer.id, newX, newY)
      }

      // Check for node collisions
      nodes.forEach(node => {
        if (node.isActive) {
          const distance = Math.sqrt((newX - node.x) ** 2 + (newY - node.y) ** 2)
          if (distance < node.size + 25) {
            handleNodeCollision(node)
          }
        }
      })
    }

    // Update game state
    setGameState(prev => ({
      ...prev,
      tick: prev.tick + 1,
      timeLeft: Math.max(0, prev.timeLeft - 1)
    }))

    // Check win condition
    if (gameState.timeLeft <= 0) {
      const winner = players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      )
      setGameState(prev => ({ ...prev, gamePhase: 'ended', winner: winner.name }))
    }
  }

  const handleNodeCollision = (node: ArenaNode) => {
    if (!currentPlayer) return

    // Create particle effect
    createParticleEffect(node.x, node.y, node.color)

    // Handle different node types
    switch (node.type) {
      case 'energy':
        setCurrentPlayer(prev => prev ? { ...prev, energy: Math.min(100, prev.energy + node.value) } : undefined)
        toast.success(`+${node.value} Energy!`)
        break
      case 'commit':
        handleCommit(node.id)
        break
      case 'powerup':
        setCurrentPlayer(prev => prev ? { ...prev, score: prev.score + node.value } : undefined)
        toast.success(`+${node.value} Score!`)
        break
      case 'blockchain':
        setCurrentPlayer(prev => prev ? { ...prev, score: prev.score + node.value, commits: prev.commits + 1 } : undefined)
        toast.success(`+${node.value} Score & +1 Commit!`)
        break
    }

    // Deactivate node
    setNodes(prev => 
      prev.map(n => n.id === node.id ? { ...n, isActive: false } : n)
    )

    onCollect(currentPlayer.id, node.id)
  }

  const handleCommit = async (nodeId: string) => {
    if (!currentPlayer) return

    try {
      await onCommit(currentPlayer.id, nodeId)
      
      setCurrentPlayer(prev => prev ? { 
        ...prev, 
        commits: prev.commits + 1, 
        score: prev.score + 100,
        lastAction: 'commit'
      } : undefined)
      
      setGameState(prev => ({ 
        ...prev, 
        totalCommits: prev.totalCommits + 1,
        worldEnergy: prev.worldEnergy + 50
      }))
      
      // Create commit particle effect
      createParticleEffect(currentPlayer.x, currentPlayer.y, '#8b5cf6', 'commit')
      toast.success('Blockchain Commit Successful! +100 Score')
    } catch (error) {
      console.error('Commit failed:', error)
      toast.error('Commit failed!')
    }
  }

  const createParticleEffect = (x: number, y: number, color: string, type: string = 'collect') => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: `particle-${Date.now()}-${i}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 60,
      color,
      type,
      size: Math.random() * 5 + 2
    }))
    
    setParticles(prev => [...prev, ...newParticles])
  }

  // Update particles
  useEffect(() => {
    const particleLoop = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 1,
          vx: p.vx * 0.98,
          vy: p.vy * 0.98
        })).filter(p => p.life > 0)
      )
    }, 16)

    return () => clearInterval(particleLoop)
  }, [])

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
    nodes.forEach(node => {
      if (node.isActive) {
        // Node glow
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 2)
        glowGradient.addColorStop(0, node.color + '80')
        glowGradient.addColorStop(1, node.color + '00')
        ctx.fillStyle = glowGradient
        ctx.fillRect(node.x - node.size, node.y - node.size, node.size * 2, node.size * 2)

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
    players.forEach(player => {
      if (player.isAlive) {
        // Player glow
        const playerGlow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 40)
        playerGlow.addColorStop(0, player.color + '60')
        playerGlow.addColorStop(1, player.color + '00')
        ctx.fillStyle = playerGlow
        ctx.fillRect(player.x - 40, player.y - 40, 80, 80)

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
    if (currentPlayer && currentPlayer.isAlive) {
      const time = Date.now() * 0.005
      const pulseSize = 30 + Math.sin(time) * 5
      
      // Pulsing ring
      ctx.beginPath()
      ctx.arc(currentPlayer.x, currentPlayer.y, pulseSize, 0, 2 * Math.PI)
      ctx.strokeStyle = currentPlayer.color
      ctx.lineWidth = 4
      ctx.stroke()

      // Energy beam
      ctx.strokeStyle = currentPlayer.color + '80'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(currentPlayer.x, currentPlayer.y - 40)
      ctx.lineTo(currentPlayer.x, currentPlayer.y - 60)
      ctx.stroke()
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI)
      ctx.fillStyle = particle.color + Math.floor(particle.life / 60 * 255).toString(16).padStart(2, '0')
      ctx.fill()
    })
  }, [players, nodes, currentPlayer, particles])

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
            <span>Players: {players.length}</span>
          </div>
          <div>World Tick: {gameState.tick}</div>
          <div>Total Commits: {gameState.totalCommits}</div>
          <div>World Energy: {gameState.worldEnergy}</div>
          <div>Time Left: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}</div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="text-sm space-y-1">
          <div>🎮 Controls:</div>
          <div>WASD / Arrow Keys: Move</div>
          <div>Space: Commit (when on commit node)</div>
          <div>Collect nodes to gain energy & score!</div>
        </div>
      </div>

      {/* Game Status */}
      <div className="absolute top-4 right-4">
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          gameState.gamePhase === 'playing' ? 'bg-green-600/80 text-white' : 
          gameState.gamePhase === 'ended' ? 'bg-red-600/80 text-white' :
          'bg-yellow-600/80 text-white'
        }`}>
          {gameState.gamePhase === 'playing' ? '🎮 Playing' : 
           gameState.gamePhase === 'ended' ? '🏁 Game Over' :
           '⏳ Waiting'}
        </div>
      </div>

      {/* Winner Announcement */}
      <AnimatePresence>
        {gameState.gamePhase === 'ended' && gameState.winner && (
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
              <div className="text-3xl font-bold mb-2">GAME OVER!</div>
              <div className="text-xl">{gameState.winner} Wins!</div>
              <div className="text-sm mt-4">Final Score: {players.find(p => p.name === gameState.winner)?.score}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
