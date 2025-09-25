import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../hooks/useWallet'
import toast from 'react-hot-toast'

interface CommitStateProps {
  onCommit: (rootHash: string, tick: number) => Promise<void>
  latestTick: number
  latestRoot: string
  isConnected: boolean
}

export const CommitState: React.FC<CommitStateProps> = ({
  onCommit,
  latestTick,
  latestRoot,
  isConnected
}) => {
  const { signAndSubmitTransaction } = useWallet()
  const [isCommitting, setIsCommitting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [customRoot, setCustomRoot] = useState('')
  const [customTick, setCustomTick] = useState(latestTick + 1)

  const generateRandomRoot = () => {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  const handleCommit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsCommitting(true)
      
      const rootHash = customRoot || generateRandomRoot()
      const tick = customTick

      await onCommit(rootHash, tick)
      
      toast.success(`State committed! Tick: ${tick}`)
      setCustomRoot('')
      setCustomTick(tick + 1)
    } catch (error: any) {
      console.error('Commit failed:', error)
      toast.error(`Commit failed: ${error.message}`)
    } finally {
      setIsCommitting(false)
    }
  }

  const handleQuickCommit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsCommitting(true)
      
      const rootHash = generateRandomRoot()
      const tick = latestTick + 1

      await onCommit(rootHash, tick)
      
      toast.success(`Quick commit! Tick: ${tick}`)
    } catch (error: any) {
      console.error('Quick commit failed:', error)
      toast.error(`Quick commit failed: ${error.message}`)
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Commit World State</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Current State Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-sm text-gray-600 mb-2">Current State</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Latest Tick:</span>
            <div className="font-mono font-semibold">{latestTick}</div>
          </div>
          <div>
            <span className="text-gray-500">Latest Root:</span>
            <div className="font-mono text-xs break-all">{latestRoot.slice(0, 16)}...</div>
          </div>
        </div>
      </div>

      {/* Quick Commit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleQuickCommit}
        disabled={!isConnected || isCommitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors mb-4 flex items-center justify-center gap-2"
      >
        {isCommitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Committing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Commit
          </>
        )}
      </motion.button>

      {/* Detailed Commit Form */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-4"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Root Hash
                </label>
                <input
                  type="text"
                  value={customRoot}
                  onChange={(e) => setCustomRoot(e.target.value)}
                  placeholder="Enter custom root hash or leave empty for random"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tick Number
                </label>
                <input
                  type="number"
                  value={customTick}
                  onChange={(e) => setCustomTick(parseInt(e.target.value) || latestTick + 1)}
                  min={latestTick + 1}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCommit}
                disabled={!isConnected || isCommitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isCommitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Committing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Commit with Details
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {!isConnected && (
          <span className="text-gray-500">Connect wallet to commit</span>
        )}
      </div>
    </div>
  )
}
