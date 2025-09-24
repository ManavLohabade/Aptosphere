import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useWorld } from '../hooks/useWorld'
import { 
  User, 
  MapPin, 
  Coins, 
  Package, 
  Activity,
  Settings,
  LogOut,
  Edit,
  Save,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'

export function ProfilePage() {
  const { account, isConnected, disconnect } = useWallet()
  const { worldState, players, leaveWorld } = useWorld()
  const [isEditing, setIsEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')

  const currentPlayer = players.find(p => p.address === account)

  const handleEditProfile = () => {
    if (currentPlayer) {
      setNewUsername(currentPlayer.username)
      setIsEditing(true)
    }
  }

  const handleSaveProfile = async () => {
    // In a real implementation, this would update the username on-chain
    toast.success('Profile updated!')
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewUsername('')
  }

  const handleLeaveWorld = async () => {
    try {
      await leaveWorld()
      await disconnect()
    } catch (error) {
      console.error('Failed to leave world:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300">Please connect your Martian Wallet to view your profile</p>
        </div>
      </div>
    )
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Not in World</h2>
          <p className="text-gray-300">Please join the world first to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {currentPlayer.username}
                </h1>
                <p className="text-gray-400">
                  {currentPlayer.address.slice(0, 6)}...{currentPlayer.address.slice(-4)}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleEditProfile}
                className="btn btn-outline btn-sm flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleLeaveWorld}
                className="btn btn-ghost btn-sm text-red-400 hover:text-red-300 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave World</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="input flex-1"
                        maxLength={20}
                      />
                      <button
                        onClick={handleSaveProfile}
                        className="btn btn-primary btn-sm flex items-center space-x-1"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn btn-outline btn-sm flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-white">{currentPlayer.username}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="text-white font-mono text-sm bg-gray-800 p-2 rounded">
                    {currentPlayer.address}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Joined At
                  </label>
                  <div className="text-white">
                    {new Date(currentPlayer.joinedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Current Status</span>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-gray-400 text-sm">Position</div>
                    <div className="text-white font-semibold">
                      ({currentPlayer.x}, {currentPlayer.y})
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-gray-400 text-sm">Balance</div>
                    <div className="text-white font-semibold">
                      {currentPlayer.balance} APT
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-gray-400 text-sm">Items</div>
                    <div className="text-white font-semibold">
                      {currentPlayer.inventory.length}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-gray-400 text-sm">Last Move</div>
                    <div className="text-white font-semibold">
                      {new Date(currentPlayer.lastMove).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Inventory ({currentPlayer.inventory.length} items)</span>
              </h2>
              
              {currentPlayer.inventory.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {currentPlayer.inventory.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 p-4 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-gray-400 text-sm">
                            ID: {item.id}
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No items in inventory</p>
                  <p className="text-gray-500 text-sm">Mint some items to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">World Rank</span>
                  <span className="text-white font-semibold">
                    #{players.sort((a, b) => b.balance - a.balance).findIndex(p => p.address === account) + 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Players</span>
                  <span className="text-white font-semibold">{worldState.totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Items</span>
                  <span className="text-white font-semibold">{worldState.totalItems}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="btn btn-outline w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
                <button className="btn btn-outline w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Activity Log
                </button>
                <button className="btn btn-outline w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Items
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
