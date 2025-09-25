import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import toast from 'react-hot-toast'

export const SpaceWallet: React.FC = () => {
  const { account, isConnected, isConnecting, connect, disconnect, getAccountInfo } = useWallet()
  const [showDetails, setShowDetails] = useState(false)
  const [accountInfo, setAccountInfo] = useState<any>(null)

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setAccountInfo(null)
      setShowDetails(false)
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  const handleGetAccountInfo = async () => {
    try {
      const info = await getAccountInfo()
      setAccountInfo(info)
      setShowDetails(!showDetails)
    } catch (error) {
      toast.error('Failed to get account info')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="relative">
      {!isConnected ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-3 shadow-lg"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <div className="text-xl">🌌</div>
              Connect to Aptosphere
            </>
          )}
        </motion.button>
      ) : (
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetAccountInfo}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 shadow-lg"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <div className="text-xl">👨‍🚀</div>
            {formatAddress(account || '')}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDisconnect}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg"
          >
            <div className="text-xl">🚪</div>
          </motion.button>
        </div>
      )}

      {/* Account Details Modal */}
      <AnimatePresence>
        {showDetails && accountInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute top-full right-0 mt-4 w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-6 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Explorer Profile</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <div className="text-xl">✕</div>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Wallet Address</div>
                <div className="font-mono text-sm text-white break-all bg-gray-700 p-2 rounded">
                  {account}
                </div>
              </div>
              
              {accountInfo && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Sequence</div>
                      <div className="text-white font-semibold">{accountInfo.sequence_number || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="text-green-400 font-semibold">Active</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Authentication Key</div>
                    <div className="font-mono text-xs text-gray-300 break-all bg-gray-700 p-2 rounded">
                      {accountInfo.authentication_key || 'N/A'}
                    </div>
                  </div>
                </>
              )}

              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-blue-500/30">
                <div className="text-sm text-blue-400 mb-2">🌌 Aptosphere Explorer</div>
                <div className="text-white text-sm">
                  You're now connected to the parallel space exploration layer on Aptos!
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
