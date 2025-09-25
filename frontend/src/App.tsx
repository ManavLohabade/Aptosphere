import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SimpleArena2D } from './components/SimpleArena2D'
import { GameDashboard } from './components/GameDashboard'
import { SpaceWallet } from './components/SpaceWallet'
import { useWallet, WalletProvider } from './hooks/useWallet'
import { useSimpleWorld, SimpleWorldProvider } from './hooks/useSimpleWorld'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

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

const generatePlayerColor = (id: string): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ]
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

const generatePlayerAvatar = (name: string): string => {
  const avatars = ['⚔️', '🥷', '🚀', '👨‍🚀', '👩‍🚀', '🧙‍♂️', '🧙‍♀️', '🦸‍♂️', '🦸‍♀️']
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return avatars[hash % avatars.length]
}

const generateRandomName = (): string => {
  const names = ['CryptoWarrior', 'BlockchainNinja', 'DeFiMaster', 'NFTKing', 'TokenLord', 'ChainBreaker', 'HashSlayer', 'MerkleMage']
  const randomName = names[Math.floor(Math.random() * names.length)]
  return randomName
}

function AppContent() {
  const { account, isConnected } = useWallet()
  const { movePlayer, commitWorldState } = useSimpleWorld()

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
  const [selectedPlayer, setSelectedPlayer] = useState<ArenaPlayer | undefined>()
  const [spectating, setSpectating] = useState<string | null>(null)

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = () => {
    // Create mock players
    const mockPlayers: ArenaPlayer[] = [
      {
        id: 'player1',
        name: 'CryptoWarrior',
        x: 100,
        y: 100,
        color: generatePlayerColor('player1'),
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
        color: generatePlayerColor('player2'),
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
        name: generateRandomName(),
        x: 400,
        y: 300,
        color: generatePlayerColor(account),
        energy: 100,
        score: 0,
        commits: 0,
        isAlive: true,
        lastAction: 'spawn',
        avatar: generatePlayerAvatar(account),
        team: 'blue'
      }
      setCurrentPlayer(newPlayer)
      setPlayers(prev => [...prev, newPlayer])
    }
  }

  const handleMove = useCallback(async (playerId: string, x: number, y: number) => {
    try {
      await movePlayer(x, y)
      
      // Update local state immediately for smooth UX
      setPlayers(prev => 
        prev.map(p => p.id === playerId ? { ...p, x, y, energy: Math.max(0, p.energy - 0.5) } : p)
      )
      
      if (currentPlayer && currentPlayer.id === playerId) {
        setCurrentPlayer(prev => prev ? { ...prev, x, y, energy: Math.max(0, prev.energy - 0.5) } : undefined)
      }
    } catch (error) {
      console.error('Move failed:', error)
    }
  }, [currentPlayer, movePlayer])

  const handleCommit = useCallback(async (playerId: string, nodeId: string) => {
    try {
      const rootHash = '0x' + Math.random().toString(16).slice(2, 66)
      const tick = gameState.tick + 1
      
      await commitWorldState(rootHash, tick)
      
      // Update player stats
      setPlayers(prev => 
        prev.map(p => p.id === playerId ? { 
          ...p, 
          commits: p.commits + 1, 
          score: p.score + 100,
          lastAction: 'commit'
        } : p)
      )
      
      if (currentPlayer && currentPlayer.id === playerId) {
        setCurrentPlayer(prev => prev ? { 
          ...prev, 
          commits: prev.commits + 1, 
          score: prev.score + 100,
          lastAction: 'commit'
        } : undefined)
      }
      
      // Update game state
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
  }, [currentPlayer, commitWorldState, gameState.tick])

  const handleCollect = useCallback(async (playerId: string, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    // Handle different node types
    switch (node.type) {
      case 'energy':
        setPlayers(prev => 
          prev.map(p => p.id === playerId ? { 
            ...p, 
            energy: Math.min(100, p.energy + node.value),
            lastAction: 'collect_energy'
          } : p)
        )
        if (currentPlayer && currentPlayer.id === playerId) {
          setCurrentPlayer(prev => prev ? { 
            ...prev, 
            energy: Math.min(100, prev.energy + node.value),
            lastAction: 'collect_energy'
          } : undefined)
        }
        toast.success(`+${node.value} Energy!`)
        break
      case 'powerup':
        setPlayers(prev => 
          prev.map(p => p.id === playerId ? { 
            ...p, 
            score: p.score + node.value,
            lastAction: 'collect_powerup'
          } : p)
        )
        if (currentPlayer && currentPlayer.id === playerId) {
          setCurrentPlayer(prev => prev ? { 
            ...prev, 
            score: prev.score + node.value,
            lastAction: 'collect_powerup'
          } : undefined)
        }
        toast.success(`+${node.value} Score!`)
        break
      case 'blockchain':
        setPlayers(prev => 
          prev.map(p => p.id === playerId ? { 
            ...p, 
            score: p.score + node.value,
            commits: p.commits + 1,
            lastAction: 'collect_blockchain'
          } : p)
        )
        if (currentPlayer && currentPlayer.id === playerId) {
          setCurrentPlayer(prev => prev ? { 
            ...prev, 
            score: prev.score + node.value,
            commits: prev.commits + 1,
            lastAction: 'collect_blockchain'
          } : undefined)
        }
        toast.success(`+${node.value} Score & +1 Commit!`)
        break
    }

    // Deactivate node
    setNodes(prev => 
      prev.map(n => n.id === nodeId ? { ...n, isActive: false } : n)
    )
  }, [currentPlayer, nodes])

  const handlePlayerSelect = useCallback((player: ArenaPlayer) => {
    setSelectedPlayer(player)
    toast.success(`Selected player: ${player.name}`)
  }, [])

  const handleSpectate = useCallback((playerId: string) => {
    setSpectating(playerId)
    toast.success(`Spectating ${players.find(p => p.id === playerId)?.name}`)
  }, [players])

  const handleRestart = useCallback(() => {
    initializeGame()
    setSelectedPlayer(undefined)
    setSpectating(null)
    toast.success('Game restarted!')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              ⚔️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Aptosphere Arena</h1>
              <p className="text-sm text-gray-400">Blockchain Battle Royale on Aptos</p>
            </div>
          </div>
          <SpaceWallet />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 2D Arena Game */}
        <div className="flex-1 p-6">
          <SimpleArena2D />
        </div>

        {/* Game Dashboard */}
        <GameDashboard
          players={players}
          gameState={gameState}
          currentPlayer={currentPlayer}
          onPlayerSelect={handlePlayerSelect}
          onSpectate={handleSpectate}
          onRestart={handleRestart}
        />
      </div>

      {/* Selected Player Info Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSelectedPlayer(undefined)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 text-white">Player Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedPlayer.avatar}</div>
                  <div>
                    <div className="font-medium text-white">{selectedPlayer.name}</div>
                    <div className="text-sm text-gray-400">Team {selectedPlayer.team.toUpperCase()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400">Score</div>
                    <div className="text-white font-semibold">{selectedPlayer.score}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400">Commits</div>
                    <div className="text-white font-semibold">{selectedPlayer.commits}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400">Energy</div>
                    <div className="text-white font-semibold">{Math.floor(selectedPlayer.energy)}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400">Status</div>
                    <div className="text-white font-semibold">{selectedPlayer.isAlive ? 'Alive' : 'Eliminated'}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Last Action: {selectedPlayer.lastAction}
                </div>
                <div className="text-sm text-gray-400">
                  Position: ({Math.floor(selectedPlayer.x)}, {Math.floor(selectedPlayer.y)})
                </div>
              </div>
              
              <button
                onClick={() => setSelectedPlayer(undefined)}
                className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <WalletProvider>
      <SimpleWorldProvider>
        <AppContent />
      </SimpleWorldProvider>
    </WalletProvider>
  )
}