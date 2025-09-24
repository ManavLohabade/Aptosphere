import { useState, useEffect } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useWorld } from '../hooks/useWorld'
import { 
  MapPin, 
  Users, 
  Zap, 
  Gift, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Plus,
  Minus,
  Send,
  Package
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const WORLD_SIZE = 20
const CELL_SIZE = 20

export function WorldPage() {
  const { account, isConnected } = useWallet()
  const { worldState, players, joinWorld, leaveWorld, movePlayer, sendTip, mintItem } = useWorld()
  const [username, setUsername] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [tipRecipient, setTipRecipient] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [itemName, setItemName] = useState('')
  const [showTipForm, setShowTipForm] = useState(false)
  const [showMintForm, setShowMintForm] = useState(false)

  const currentPlayer = players.find(p => p.address === account)

  const handleJoinWorld = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }
    
    try {
      await joinWorld(username.trim())
      setShowJoinForm(false)
      setUsername('')
    } catch (error) {
      console.error('Failed to join world:', error)
    }
  }

  const handleLeaveWorld = async () => {
    try {
      await leaveWorld()
    } catch (error) {
      console.error('Failed to leave world:', error)
    }
  }

  const handleMove = async (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentPlayer) return

    let newX = currentPlayer.x
    let newY = currentPlayer.y

    switch (direction) {
      case 'up':
        newY = Math.max(0, currentPlayer.y - 1)
        break
      case 'down':
        newY = Math.min(WORLD_SIZE - 1, currentPlayer.y + 1)
        break
      case 'left':
        newX = Math.max(0, currentPlayer.x - 1)
        break
      case 'right':
        newX = Math.min(WORLD_SIZE - 1, currentPlayer.x + 1)
        break
    }

    try {
      await movePlayer(newX, newY)
    } catch (error) {
      console.error('Failed to move:', error)
    }
  }

  const handleSendTip = async () => {
    if (!tipRecipient.trim() || !tipAmount.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const amount = parseInt(tipAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await sendTip(tipRecipient.trim(), amount)
      setTipRecipient('')
      setTipAmount('')
      setShowTipForm(false)
    } catch (error) {
      console.error('Failed to send tip:', error)
    }
  }

  const handleMintItem = async () => {
    if (!itemName.trim()) {
      toast.error('Please enter an item name')
      return
    }

    try {
      await mintItem(itemName.trim())
      setItemName('')
      setShowMintForm(false)
    } catch (error) {
      console.error('Failed to mint item:', error)
    }
  }

  const getPlayerColor = (address: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500'
    ]
    const hash = address.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300">Please connect your Martian Wallet to enter the world</p>
        </div>
      </div>
    )
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Join the World</h2>
          
          {!showJoinForm ? (
            <div className="text-center">
              <p className="text-gray-300 mb-6">
                Welcome to Aptosphere! Enter a username to join the world and start exploring.
              </p>
              <button
                onClick={() => setShowJoinForm(true)}
                className="btn btn-primary w-full"
              >
                Join World
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input w-full"
                  maxLength={20}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleJoinWorld}
                  className="btn btn-primary flex-1"
                >
                  Join
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Aptosphere World</h1>
            <p className="text-gray-300">
              Welcome, {currentPlayer.username}! Position: ({currentPlayer.x}, {currentPlayer.y})
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
            <button
              onClick={() => setShowTipForm(!showTipForm)}
              className="btn btn-outline btn-sm flex items-center space-x-2"
            >
              <Gift className="w-4 h-4" />
              <span>Send Tip</span>
            </button>
            
            <button
              onClick={() => setShowMintForm(!showMintForm)}
              className="btn btn-outline btn-sm flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Mint Item</span>
            </button>
            
            <button
              onClick={handleLeaveWorld}
              className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
            >
              Leave World
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* World Grid */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">World Map</h2>
                <div className="text-sm text-gray-400">
                  {players.length} players online
                </div>
              </div>
              
              <div className="relative">
                <div 
                  className="world-grid border border-gray-600 rounded-lg overflow-hidden"
                  style={{ 
                    width: WORLD_SIZE * CELL_SIZE,
                    height: WORLD_SIZE * CELL_SIZE,
                    maxWidth: '100%',
                    maxHeight: '500px'
                  }}
                >
                  {/* Render players */}
                  {players.map((player) => (
                    <motion.div
                      key={player.address}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute ${getPlayerColor(player.address)} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold`}
                      style={{
                        left: player.x * CELL_SIZE,
                        top: player.y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        zIndex: player.address === account ? 10 : 1
                      }}
                      title={`${player.username} (${player.x}, ${player.y})`}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Movement Controls */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Movement Controls</h3>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  <button
                    onClick={() => handleMove('up')}
                    className="btn btn-outline btn-sm flex items-center justify-center"
                    disabled={currentPlayer.y === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMove('left')}
                      className="btn btn-outline btn-sm flex items-center justify-center"
                      disabled={currentPlayer.x === 0}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove('right')}
                      className="btn btn-outline btn-sm flex items-center justify-center"
                      disabled={currentPlayer.x === WORLD_SIZE - 1}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleMove('down')}
                    className="btn btn-outline btn-sm flex items-center justify-center"
                    disabled={currentPlayer.y === WORLD_SIZE - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <span className="text-white">{currentPlayer.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Position:</span>
                  <span className="text-white">({currentPlayer.x}, {currentPlayer.y})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-white">{currentPlayer.balance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Items:</span>
                  <span className="text-white">{currentPlayer.inventory.length}</span>
                </div>
              </div>
            </div>

            {/* Online Players */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Online Players</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {players.map((player) => (
                  <div
                    key={player.address}
                    className={`flex items-center justify-between p-2 rounded ${
                      player.address === account ? 'bg-blue-500/20' : 'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getPlayerColor(player.address)}`}></div>
                      <span className="text-white text-sm">{player.username}</span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      ({player.x}, {player.y})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tip Form Modal */}
        {showTipForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Send Tip</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={tipRecipient}
                    onChange={(e) => setTipRecipient(e.target.value)}
                    placeholder="0x..."
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="100"
                    className="input w-full"
                    min="1"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSendTip}
                    className="btn btn-primary flex-1"
                  >
                    Send Tip
                  </button>
                  <button
                    onClick={() => setShowTipForm(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mint Form Modal */}
        {showMintForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Mint Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Sword of Power"
                    className="input w-full"
                    maxLength={50}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleMintItem}
                    className="btn btn-primary flex-1"
                  >
                    Mint Item
                  </button>
                  <button
                    onClick={() => setShowMintForm(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
