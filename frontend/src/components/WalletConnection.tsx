import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import toast from 'react-hot-toast'

export const WalletConnection: React.FC = () => {
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
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect Wallet
            </>
          )}
        </motion.button>
      ) : (
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetAccountInfo}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            {formatAddress(account || '')}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
          >
            Disconnect
          </motion.button>
        </div>
      )}

      {/* Account Details Modal */}
      <AnimatePresence>
        {showDetails && accountInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Account Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Address:</span>
                <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {account}
                </div>
              </div>
              
              {accountInfo && (
                <>
                  <div>
                    <span className="text-gray-600">Sequence Number:</span>
                    <span className="ml-2 font-mono">{accountInfo.sequence_number || 'N/A'}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Authentication Key:</span>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                      {accountInfo.authentication_key || 'N/A'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
