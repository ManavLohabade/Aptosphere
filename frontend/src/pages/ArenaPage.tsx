import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useWorld } from '../hooks/useWorld'
import { 
  Trophy, 
  Users, 
  Zap, 
  TrendingUp,
  Star,
  Award,
  Target,
  Flame
} from 'lucide-react'
import { motion } from 'framer-motion'

export function ArenaPage() {
  const { isConnected } = useWallet()
  const { worldState, players } = useWorld()
  const [selectedGame, setSelectedGame] = useState<'battle' | 'race' | 'collect'>('battle')

  const leaderboard = players
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)

  const games = [
    {
      id: 'battle',
      name: 'Battle Arena',
      description: 'Fight other players in real-time combat',
      icon: Target,
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'race',
      name: 'Speed Race',
      description: 'Race to collect items across the world',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'collect',
      name: 'Treasure Hunt',
      description: 'Find and collect rare items',
      icon: Star,
      color: 'from-yellow-500 to-orange-500'
    }
  ]

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300">Please connect your Martian Wallet to enter the arena</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Aptosphere Arena</h1>
          <p className="text-gray-300 text-lg">
            Compete with other players in real-time games and challenges
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Games Selection */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Choose Your Game</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                {games.map((game) => (
                  <motion.div
                    key={game.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`card p-6 cursor-pointer transition-all ${
                      selectedGame === game.id 
                        ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedGame(game.id as any)}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${game.color} rounded-lg flex items-center justify-center mb-4`}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {game.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {game.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Game Details */}
              <div className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {games.find(g => g.id === selectedGame)?.name} Details
                  </h3>
                  
                  {selectedGame === 'battle' && (
                    <div className="space-y-4">
                      <p className="text-gray-300">
                        Enter the battle arena and fight other players in real-time combat. 
                        Use your items and skills to defeat opponents and climb the leaderboard.
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{players.length} players online</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Flame className="w-4 h-4" />
                          <span>Real-time combat</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedGame === 'race' && (
                    <div className="space-y-4">
                      <p className="text-gray-300">
                        Race against other players to collect items scattered across the world. 
                        The fastest player wins!
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>Speed challenge</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>Item collection</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedGame === 'collect' && (
                    <div className="space-y-4">
                      <p className="text-gray-300">
                        Explore the world to find and collect rare items. 
                        The more items you collect, the higher your score!
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>Exploration</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Award className="w-4 h-4" />
                          <span>Rare items</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <button className="btn btn-primary w-full">
                      Start Game
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Leaderboard</span>
              </h3>
              
              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <motion.div
                    key={player.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                      index === 1 ? 'bg-gray-500/20 border border-gray-500/30' :
                      index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                      'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-500 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{player.username}</div>
                        <div className="text-gray-400 text-xs">
                          Position: ({player.x}, {player.y})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{player.balance}</div>
                      <div className="text-gray-400 text-xs">balance</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>World Stats</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Players:</span>
                  <span className="text-white font-semibold">{worldState.totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Items:</span>
                  <span className="text-white font-semibold">{worldState.totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Update:</span>
                  <span className="text-white font-semibold">
                    {new Date(worldState.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
