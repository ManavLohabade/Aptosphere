import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Box, Torus, Octahedron } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import toast from 'react-hot-toast'

interface ArenaPlayer {
  id: string
  name: string
  position: [number, number, number]
  color: string
  energy: number
  score: number
  commits: number
  isAlive: boolean
  lastAction: string
  avatar: string
  team: 'blue' | 'red'
  rotation: number
}

interface ArenaNode {
  id: string
  position: [number, number, number]
  type: 'energy' | 'commit' | 'powerup' | 'blockchain'
  value: number
  isActive: boolean
  color: string
  size: number
  rotation: number
}

interface GameState {
  tick: number
  worldEnergy: number
  totalCommits: number
  gamePhase: 'waiting' | 'playing' | 'paused' | 'ended'
  winner?: string
  timeLeft: number
}

// 3D Player Component
const Player3D: React.FC<{ player: ArenaPlayer; isCurrent: boolean }> = ({ player, isCurrent }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + player.position[0]) * 0.2
      
      if (isCurrent) {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1)
      }
    }
  })

  return (
    <group position={player.position}>
      {/* Player Body - Clean and Simple */}
      <Octahedron ref={meshRef} args={[1]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={player.color} 
          emissive={player.color}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </Octahedron>
      
      {/* Player Name - Only show for current player */}
      {isCurrent && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {player.name}
        </Text>
      )}
    </group>
  )
}

// 3D Node Component
const Node3D: React.FC<{ node: ArenaNode; onCollect: (nodeId: string) => void }> = ({ node, onCollect }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  const getNodeShape = () => {
    switch (node.type) {
      case 'energy':
        return <Sphere args={[node.size / 20, 16, 16]} />
      case 'commit':
        return <Box args={[node.size / 15, node.size / 15, node.size / 15]} />
      case 'powerup':
        return <Octahedron args={[node.size / 20]} />
      case 'blockchain':
        return <Torus args={[node.size / 20, node.size / 40, 8, 16]} />
      default:
        return <Sphere args={[node.size / 20, 16, 16]} />
    }
  }

  const getNodeIcon = () => {
    const icons = { energy: '⚡', commit: '💾', powerup: '🚀', blockchain: '⛓️' }
    return icons[node.type]
  }

  return (
    <group position={node.position}>
      {/* Node Body - Clean and Simple */}
      <mesh
        ref={meshRef}
        onClick={() => onCollect(node.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {getNodeShape()}
        <meshStandardMaterial 
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered ? 0.6 : 0.3}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Node Icon - Only show when hovered */}
      {hovered && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {getNodeIcon()}
        </Text>
      )}
    </group>
  )
}

// 3D Arena Environment
const ArenaEnvironment: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <group>
      {/* Arena Floor - Simple and Clean */}
      <Box args={[20, 0.1, 20]} position={[0, -2, 0]}>
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.8}
          roughness={0.2}
        />
      </Box>
      
      {/* Arena Walls - Simple and Clean */}
      <Box args={[20, 4, 0.1]} position={[0, 0, 10]}>
        <meshStandardMaterial color="#16213e" />
      </Box>
      <Box args={[20, 4, 0.1]} position={[0, 0, -10]}>
        <meshStandardMaterial color="#16213e" />
      </Box>
      <Box args={[0.1, 4, 20]} position={[10, 0, 0]}>
        <meshStandardMaterial color="#16213e" />
      </Box>
      <Box args={[0.1, 4, 20]} position={[-10, 0, 0]}>
        <meshStandardMaterial color="#16213e" />
      </Box>
    </group>
  )
}

// Main Arena Component
export const InsaneArena3D: React.FC = () => {
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
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 0 })

  // Initialize game
  useEffect(() => {
    if (isConnected) {
      initializeGame()
    }
    setupEventListeners()
    
    return () => {
      cleanupEventListeners()
    }
  }, [isConnected])

  const initializeGame = () => {
    // Create mock players
    const mockPlayers: ArenaPlayer[] = [
      {
        id: 'player1',
        name: 'CryptoWarrior',
        position: [-5, 0, -5],
        color: '#3b82f6',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        lastAction: 'spawn',
        avatar: '⚔️',
        team: 'blue',
        rotation: 0
      },
      {
        id: 'player2',
        name: 'BlockchainNinja',
        position: [5, 0, 5],
        color: '#ef4444',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        lastAction: 'spawn',
        avatar: '🥷',
        team: 'red',
        rotation: 0
      }
    ]

    // Create mock nodes
    const mockNodes: ArenaNode[] = [
      { id: 'node1', position: [-3, 0, -3], type: 'energy', value: 50, isActive: true, color: '#10b981', size: 20, rotation: 0 },
      { id: 'node2', position: [3, 0, 3], type: 'commit', value: 100, isActive: true, color: '#8b5cf6', size: 25, rotation: 0 },
      { id: 'node3', position: [0, 0, 0], type: 'powerup', value: 200, isActive: true, color: '#f59e0b', size: 30, rotation: 0 },
      { id: 'node4', position: [-2, 0, 2], type: 'blockchain', value: 500, isActive: true, color: '#6366f1', size: 35, rotation: 0 },
      { id: 'node5', position: [2, 0, -2], type: 'energy', value: 75, isActive: true, color: '#10b981', size: 20, rotation: 0 },
    ]

    setPlayers(mockPlayers)
    setNodes(mockNodes)
    setGameState(prev => ({ ...prev, gamePhase: 'waiting' }))

    // Set current player if wallet connected
    if (isConnected && account) {
      const newPlayer: ArenaPlayer = {
        id: account,
        name: 'You',
        position: [0, 0, 0],
        color: '#8b5cf6',
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        lastAction: 'spawn',
        avatar: '🚀',
        team: 'blue',
        rotation: 0
      }
      setCurrentPlayer(newPlayer)
      setPlayers(prev => [...prev, newPlayer])
      setGameState(prev => ({ ...prev, gamePhase: 'playing' }))
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
      let newX = currentPlayer.position[0]
      let newZ = currentPlayer.position[2]
      let moved = false

      if (keys.has('w') || keys.has('arrowup')) {
        newZ = Math.max(-8, newZ - 0.1)
        moved = true
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        newZ = Math.min(8, newZ + 0.1)
        moved = true
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        newX = Math.max(-8, newX - 0.1)
        moved = true
      }
      if (keys.has('d') || keys.has('arrowright')) {
        newX = Math.min(8, newX + 0.1)
        moved = true
      }

      if (moved) {
        setCurrentPlayer(prev => prev ? { 
          ...prev, 
          position: [newX, prev.position[1], newZ],
          energy: Math.max(0, prev.energy - 0.5) 
        } : undefined)
        setPlayers(prev => 
          prev.map(p => p.id === currentPlayer.id ? { 
            ...p, 
            position: [newX, p.position[1], newZ],
            energy: Math.max(0, p.energy - 0.5) 
          } : p)
        )
      }

      // Check for node collisions
      nodes.forEach(node => {
        if (node.isActive) {
          const distance = Math.sqrt(
            (newX - node.position[0]) ** 2 + 
            (newZ - node.position[2]) ** 2
          )
          if (distance < 1) {
            handleNodeCollision(node)
          }
        }
      })
    }

    // Update game state - only countdown when actually playing
    setGameState(prev => ({
      ...prev,
      tick: prev.tick + 1,
      timeLeft: prev.gamePhase === 'playing' ? Math.max(0, prev.timeLeft - 1) : prev.timeLeft
    }))

    // Check win condition - only if game is actually playing and time is up
    if (gameState.gamePhase === 'playing' && gameState.timeLeft <= 0 && players.length > 0) {
      const winner = players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      )
      setGameState(prev => ({ ...prev, gamePhase: 'ended', winner: winner.name }))
    }
  }

  const handleNodeCollision = (node: ArenaNode) => {
    if (!currentPlayer) return

    // Handle different node types
    switch (node.type) {
      case 'energy':
        setCurrentPlayer(prev => prev ? { 
          ...prev, 
          energy: Math.min(100, prev.energy + node.value),
          lastAction: 'collect_energy'
        } : undefined)
        toast.success(`+${node.value} Energy!`)
        break
      case 'commit':
        handleCommit(node.id)
        break
      case 'powerup':
        setCurrentPlayer(prev => prev ? { 
          ...prev, 
          score: prev.score + node.value,
          lastAction: 'collect_powerup'
        } : undefined)
        toast.success(`+${node.value} Score!`)
        break
      case 'blockchain':
        setCurrentPlayer(prev => prev ? { 
          ...prev, 
          score: prev.score + node.value,
          commits: prev.commits + 1,
          lastAction: 'collect_blockchain'
        } : undefined)
        toast.success(`+${node.value} Score & +1 Commit!`)
        break
    }

    // Deactivate node
    setNodes(prev => 
      prev.map(n => n.id === node.id ? { ...n, isActive: false } : n)
    )
  }

  const handleCommit = async (nodeId: string) => {
    if (!currentPlayer) return

    try {
      // Simulate blockchain commit
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
      
      toast.success('Blockchain Commit Successful! +100 Score')
    } catch (error) {
      console.error('Commit failed:', error)
      toast.error('Commit failed!')
    }
  }

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        style={{ background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 100%)' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 5, 0]} intensity={1} color="#8b5cf6" />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#ec4899" />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#3b82f6" />
        
        <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
        
        <ArenaEnvironment />
        
        {/* Render Players */}
        {players.map((player) => (
          <Player3D 
            key={player.id} 
            player={player} 
            isCurrent={currentPlayer?.id === player.id} 
          />
        ))}
        
        {/* Render Nodes */}
        {nodes.map((node) => (
          <Node3D 
            key={node.id} 
            node={node} 
            onCollect={handleNodeCollision} 
          />
        ))}
      </Canvas>
      
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
          <div>🎮 3D Controls:</div>
          <div>WASD / Arrow Keys: Move</div>
          <div>Mouse: Rotate Camera</div>
          <div>Scroll: Zoom</div>
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
          {gameState.gamePhase === 'playing' ? '🎮 3D Arena Active' : 
           gameState.gamePhase === 'ended' ? '🏁 Game Over' :
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
              <div className="text-lg mb-6">Connect your wallet to start the 3D battle</div>
              <div className="text-sm text-gray-300">
                This is a blockchain-powered 3D multiplayer arena where you can collect nodes, 
                commit transactions, and battle for the highest score!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="text-3xl font-bold mb-2">3D ARENA CHAMPION!</div>
              <div className="text-xl">{gameState.winner} Wins!</div>
              <div className="text-sm mt-4">Final Score: {players.find(p => p.name === gameState.winner)?.score}</div>
              <button
                onClick={() => {
                  setGameState(prev => ({ ...prev, gamePhase: 'playing', timeLeft: 300, winner: undefined }))
                  initializeGame()
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
