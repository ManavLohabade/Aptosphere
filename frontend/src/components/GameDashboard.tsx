import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'

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

interface GameState {
  tick: number
  worldEnergy: number
  totalCommits: number
  gamePhase: 'waiting' | 'playing' | 'paused' | 'ended'
  winner?: string
  timeLeft: number
}

interface GameDashboardProps {
  players: ArenaPlayer[]
  gameState: GameState
  currentPlayer?: ArenaPlayer
  onPlayerSelect: (player: ArenaPlayer) => void
  onSpectate: (playerId: string) => void
  onRestart: () => void
}

export const GameDashboard: React.FC<GameDashboardProps> = ({
  players,
  gameState,
  currentPlayer,
  onPlayerSelect,
  onSpectate,
  onRestart
}) => {
  const { account, isConnected } = useWallet()
  const [activeTab, setActiveTab] = useState<'players' | 'stats' | 'leaderboard' | 'spectate'>('players')
  const [selectedPlayer, setSelectedPlayer] = useState<ArenaPlayer | undefined>()
  const [spectating, setSpectating] = useState<string | null>(null)

  const handlePlayerSelect = (player: ArenaPlayer) => {
    setSelectedPlayer(player)
    onPlayerSelect(player)
  }

  const handleSpectate = (playerId: string) => {
    setSpectating(playerId)
    onSpectate(playerId)
  }

  const getPlayerRank = (player: ArenaPlayer) => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    return sortedPlayers.findIndex(p => p.id === player.id) + 1
  }

  const getTeamColor = (team: string) => {
    return team === 'blue' ? 'text-blue-400' : 'text-red-400'
  }

  const getTeamBg = (team: string) => {
    return team === 'blue' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'
  }

  return (
    <div className="w-96 bg-gradient-to-b from-gray-900 to-black border-l border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            ⚔️
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Aptosphere Arena</h2>
            <p className="text-sm text-gray-400">Blockchain Battle Royale</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-300">
            {isConnected ? `Connected: ${account?.slice(0, 8)}...` : 'Not Connected'}
          </span>
        </div>

        {/* Game Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Game Phase</div>
            <div className="text-white font-semibold capitalize">{gameState.gamePhase}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Time Left</div>
            <div className="text-white font-semibold">
              {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* World Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">World Tick</div>
            <div className="text-white font-semibold">{gameState.tick}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Total Commits</div>
            <div className="text-white font-semibold">{gameState.totalCommits}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'players', label: 'Players', icon: '👥' },
          { id: 'stats', label: 'Stats', icon: '📊' },
          { id: 'leaderboard', label: 'Rankings', icon: '🏆' },
          { id: 'spectate', label: 'Spectate', icon: '👁️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'players' && (
            <motion.div
              key="players"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Battle Players</h3>
                <div className="text-sm text-gray-400">{players.length} in arena</div>
              </div>
              
              <div className="space-y-3">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handlePlayerSelect(player)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      currentPlayer?.id === player.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className={`text-sm ${getTeamColor(player.team)}`}>
                            Team {player.team.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${player.isAlive ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-gray-400">Energy</div>
                        <div className="text-white font-semibold">{Math.floor(player.energy)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Score</div>
                        <div className="text-white font-semibold">{player.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Commits</div>
                        <div className="text-white font-semibold">{player.commits}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-400">Last Action: {player.lastAction}</div>
                      <div className="text-xs text-gray-400">Position: ({Math.floor(player.x)}, {Math.floor(player.y)})</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <h3 className="font-semibold text-white mb-4">Game Statistics</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400 mb-2">World Energy</div>
                  <div className="text-2xl font-bold text-white">{gameState.worldEnergy}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(gameState.worldEnergy / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400 mb-2">Total Commits</div>
                  <div className="text-2xl font-bold text-white">{gameState.totalCommits}</div>
                  <div className="text-sm text-gray-400">Blockchain transactions</div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400 mb-2">Active Players</div>
                  <div className="text-2xl font-bold text-white">{players.filter(p => p.isAlive).length}</div>
                  <div className="text-sm text-gray-400">Still in battle</div>
                </div>

                {currentPlayer && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-sm font-medium text-purple-400 mb-2">Your Stats</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Score</div>
                        <div className="text-white font-semibold">{currentPlayer.score}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Commits</div>
                        <div className="text-white font-semibold">{currentPlayer.commits}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Energy</div>
                        <div className="text-white font-semibold">{Math.floor(currentPlayer.energy)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Rank</div>
                        <div className="text-white font-semibold">#{getPlayerRank(currentPlayer)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <h3 className="font-semibold text-white mb-4">Battle Rankings</h3>
              
              <div className="space-y-3">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg ${
                        index < 3 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                          : 'bg-gray-800/30 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className={`text-sm ${getTeamColor(player.team)}`}>
                              Team {player.team.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{player.score}</div>
                          <div className="text-xs text-gray-400">{player.commits} commits</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'spectate' && (
            <motion.div
              key="spectate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <h3 className="font-semibold text-white mb-4">Spectate Mode</h3>
              
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      spectating === player.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                    }`}
                    onClick={() => handleSpectate(player.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-sm text-gray-400">
                            Score: {player.score} | Energy: {Math.floor(player.energy)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {spectating === player.id ? '👁️ Watching' : '👁️ Watch'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Panel */}
      <div className="p-4 border-t border-gray-800">
        <div className="space-y-3">
          {gameState.gamePhase === 'ended' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-all"
            >
              🔄 Restart Game
            </motion.button>
          )}
          
          <div className="text-xs text-gray-400 text-center">
            Use WASD/Arrow keys to move, collect nodes to gain energy & score!
          </div>
        </div>
      </div>
    </div>
  )
}
