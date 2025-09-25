import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'

interface SpacePlayer {
  id: string
  name: string
  x: number
  y: number
  color: string
  isOnline: boolean
  lastSeen: Date
  energy: number
  resources: number
  discoveries: number
  avatar: string
}

interface SpaceObject {
  id: string
  type: 'planet' | 'asteroid' | 'star' | 'nebula' | 'blackhole'
  x: number
  y: number
  size: number
  color: string
  name: string
  discoveredBy?: string
  value: number
}

interface SpaceDashboardProps {
  players: SpacePlayer[]
  objects: SpaceObject[]
  currentPlayer?: SpacePlayer
  onPlayerSelect: (player: SpacePlayer) => void
  onObjectSelect: (object: SpaceObject) => void
  onCommitState: () => void
  worldTick: number
  worldEnergy: number
}

export const SpaceDashboard: React.FC<SpaceDashboardProps> = ({
  players,
  objects,
  currentPlayer,
  onPlayerSelect,
  onObjectSelect,
  onCommitState,
  worldTick,
  worldEnergy
}) => {
  const { account, isConnected } = useWallet()
  const [activeTab, setActiveTab] = useState<'explorers' | 'objects' | 'missions' | 'leaderboard'>('explorers')
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null)

  const getObjectIcon = (type: string) => {
    const icons = {
      planet: '🪐',
      asteroid: '☄️',
      star: '⭐',
      nebula: '🌌',
      blackhole: '🕳️'
    }
    return icons[type as keyof typeof icons] || '🌌'
  }

  const getObjectColor = (type: string) => {
    const colors = {
      planet: 'text-green-400',
      asteroid: 'text-gray-400',
      star: 'text-yellow-400',
      nebula: 'text-purple-400',
      blackhole: 'text-red-400'
    }
    return colors[type as keyof typeof colors] || 'text-white'
  }

  return (
    <div className="w-96 bg-gradient-to-b from-gray-900 to-black border-l border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            🌌
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Aptosphere</h2>
            <p className="text-sm text-gray-400">Parallel Space Explorer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-300">
            {isConnected ? `Connected: ${account?.slice(0, 8)}...` : 'Not Connected'}
          </span>
        </div>

        {/* World Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">World Tick</div>
            <div className="text-white font-semibold">{worldTick}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400">Cosmic Energy</div>
            <div className="text-white font-semibold">{worldEnergy}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'explorers', label: 'Explorers', icon: '👥' },
          { id: 'objects', label: 'Objects', icon: '🌌' },
          { id: 'missions', label: 'Missions', icon: '🎯' },
          { id: 'leaderboard', label: 'Rankings', icon: '🏆' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/30'
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
          {activeTab === 'explorers' && (
            <motion.div
              key="explorers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Space Explorers</h3>
                <div className="text-sm text-gray-400">{players.length} online</div>
              </div>
              
              <div className="space-y-3">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onPlayerSelect(player)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      currentPlayer?.id === player.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-xs text-gray-400">
                            Position: ({player.x}, {player.y})
                          </div>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400">Energy</div>
                        <div className="text-white">{player.energy}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Resources</div>
                        <div className="text-white">{player.resources}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Discoveries</div>
                        <div className="text-white">{player.discoveries}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'objects' && (
            <motion.div
              key="objects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Space Objects</h3>
                <div className="text-sm text-gray-400">{objects.length} discovered</div>
              </div>
              
              <div className="space-y-3">
                {objects.map((object) => (
                  <motion.div
                    key={object.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedObject(object)
                      onObjectSelect(object)
                    }}
                    className="p-3 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/30 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getObjectIcon(object.type)}</div>
                        <div>
                          <div className="font-medium text-white">{object.name}</div>
                          <div className={`text-sm capitalize ${getObjectColor(object.type)}`}>
                            {object.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Value: {object.value}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Position: ({object.x}, {object.y}) • Size: {object.size}
                    </div>
                    {object.discoveredBy && (
                      <div className="text-xs text-blue-400 mt-1">
                        Discovered by: {object.discoveredBy}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <h3 className="font-semibold text-white mb-4">Active Missions</h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-medium text-white">First Discovery</div>
                      <div className="text-sm text-gray-400">Discover your first space object</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">60% Complete</div>
                </div>

                <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">⛏️</div>
                    <div>
                      <div className="font-medium text-white">Resource Collector</div>
                      <div className="text-sm text-gray-400">Mine 100 resources</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">30% Complete</div>
                </div>

                <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">🌟</div>
                    <div>
                      <div className="font-medium text-white">Star Explorer</div>
                      <div className="text-sm text-gray-400">Discover 5 stars</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">80% Complete</div>
                </div>
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
              <h3 className="font-semibold text-white mb-4">Explorer Rankings</h3>
              
              <div className="space-y-3">
                {players
                  .sort((a, b) => b.discoveries - a.discoveries)
                  .slice(0, 10)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gray-800/30 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-sm text-gray-400">{player.discoveries} discoveries</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {player.resources} resources
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCommitState}
          disabled={!isConnected}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all"
        >
          🚀 Commit World State
        </motion.button>
      </div>
    </div>
  )
}
