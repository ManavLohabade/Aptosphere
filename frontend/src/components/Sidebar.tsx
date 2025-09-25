import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'

interface Player {
  id: string
  name: string
  x: number
  y: number
  color: string
  isOnline: boolean
  lastSeen: Date
  commits: number
  score: number
}

interface App {
  id: string
  name: string
  description: string
  players: number
  latestTick: number
  latestRoot: string
}

interface SidebarProps {
  players: Player[]
  apps: App[]
  currentPlayer?: Player
  onPlayerSelect: (player: Player) => void
  onAppSelect: (app: App) => void
  onRegisterApp: (name: string, description: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  players,
  apps,
  currentPlayer,
  onPlayerSelect,
  onAppSelect,
  onRegisterApp
}) => {
  const { account, isConnected } = useWallet()
  const [activeTab, setActiveTab] = useState<'players' | 'apps' | 'stats'>('players')
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [newAppDescription, setNewAppDescription] = useState('')

  const handleRegisterApp = () => {
    if (newAppName.trim() && newAppDescription.trim()) {
      onRegisterApp(newAppName.trim(), newAppDescription.trim())
      setNewAppName('')
      setNewAppDescription('')
      setShowRegisterForm(false)
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Aptosphere</h2>
        <div className="flex items-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? `Connected: ${account?.slice(0, 8)}...` : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['players', 'apps', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
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
                <h3 className="font-semibold text-gray-900">Players ({players.length})</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              
              <div className="space-y-2">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onPlayerSelect(player)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      currentPlayer?.id === player.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="font-medium text-gray-900">{player.name}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Position: ({player.x}, {player.y})
                    </div>
                    <div className="text-xs text-gray-500">
                      Commits: {player.commits} | Score: {player.score}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'apps' && (
            <motion.div
              key="apps"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Apps ({apps.length})</h3>
                <button
                  onClick={() => setShowRegisterForm(!showRegisterForm)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Register
                </button>
              </div>

              {showRegisterForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-gray-50 rounded-lg"
                >
                  <input
                    type="text"
                    placeholder="App Name"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newAppDescription}
                    onChange={(e) => setNewAppDescription(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRegisterApp}
                      className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => setShowRegisterForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                {apps.map((app) => (
                  <motion.div
                    key={app.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onAppSelect(app)}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer"
                  >
                    <div className="font-medium text-gray-900">{app.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{app.description}</div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Players: {app.players}</span>
                      <span>Tick: {app.latestTick}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Root: {app.latestRoot.slice(0, 16)}...
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
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">World State</div>
                  <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                  <div className="text-xs text-gray-500">Active Players</div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Total Apps</div>
                  <div className="text-2xl font-bold text-green-600">{apps.length}</div>
                  <div className="text-xs text-gray-500">Registered</div>
                </div>

                {currentPlayer && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">Your Stats</div>
                    <div className="text-lg font-bold text-blue-600">{currentPlayer.commits}</div>
                    <div className="text-xs text-gray-500">Commits</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">{currentPlayer.score}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
