import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWallet } from './useWallet'
import toast from 'react-hot-toast'

interface SimplePlayer {
  address: string
  username: string
  x: number
  y: number
  energy: number
  score: number
  commits: number
  isAlive: boolean
  avatar: string
}

interface SimpleWorldState {
  players: SimplePlayer[]
  totalPlayers: number
  lastUpdate: string
}

interface SimpleWorldContextType {
  worldState: SimpleWorldState
  players: SimplePlayer[]
  isConnected: boolean
  movePlayer: (x: number, y: number) => Promise<void>
  commitWorldState: (rootHash: string, tick: number) => Promise<void>
  refreshWorldState: () => Promise<void>
}

const SimpleWorldContext = createContext<SimpleWorldContextType | undefined>(undefined)

export function SimpleWorldProvider({ children }: { children: React.ReactNode }) {
  const { account, isConnected } = useWallet()
  const [worldState, setWorldState] = useState<SimpleWorldState>({
    players: [],
    totalPlayers: 0,
    lastUpdate: new Date().toISOString()
  })

  useEffect(() => {
    if (isConnected && account) {
      // Initialize with mock data for demo
      const mockPlayers: SimplePlayer[] = [
        {
          address: account,
          username: 'You',
          x: 400,
          y: 300,
          energy: 100,
          score: 0,
          commits: 0,
          isAlive: true,
          avatar: '🚀'
        },
        {
          address: '0x2',
          username: 'CryptoWarrior',
          x: 100,
          y: 100,
          energy: 100,
          score: 0,
          commits: 0,
          isAlive: true,
          avatar: '⚔️'
        },
        {
          address: '0x3',
          username: 'BlockchainNinja',
          x: 700,
          y: 500,
          energy: 100,
          score: 0,
          commits: 0,
          isAlive: true,
          avatar: '🥷'
        }
      ]
      
      setWorldState({
        players: mockPlayers,
        totalPlayers: mockPlayers.length,
        lastUpdate: new Date().toISOString()
      })
    }
  }, [isConnected, account])

  const movePlayer = async (x: number, y: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Update local state immediately for smooth UX
      setWorldState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.address === account 
            ? { ...p, x, y, energy: Math.max(0, p.energy - 1), lastUpdate: new Date().toISOString() }
            : p
        ),
        lastUpdate: new Date().toISOString()
      }))

      // Remove excessive movement notifications
      // toast.success(`Moved to (${x}, ${y})`)
    } catch (error: any) {
      console.error('Failed to move player:', error)
      toast.error(`Failed to move: ${error.message}`)
    }
  }

  const commitWorldState = async (rootHash: string, tick: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Update local state immediately for smooth UX
      setWorldState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.address === account 
            ? { ...p, commits: p.commits + 1, score: p.score + 100, lastUpdate: new Date().toISOString() }
            : p
        ),
        lastUpdate: new Date().toISOString()
      }))

      toast.success(`World state committed! Tick: ${tick}`)
    } catch (error: any) {
      console.error('Failed to commit world state:', error)
      toast.error(`Failed to commit world state: ${error.message}`)
    }
  }

  const refreshWorldState = async () => {
    try {
      // In a real app, this would fetch from the backend
      // For now, we just update the timestamp
      setWorldState(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to refresh world state:', error)
    }
  }

  const value: SimpleWorldContextType = {
    worldState,
    players: worldState.players,
    isConnected,
    movePlayer,
    commitWorldState,
    refreshWorldState
  }

  return (
    <SimpleWorldContext.Provider value={value}>
      {children}
    </SimpleWorldContext.Provider>
  )
}

export function useSimpleWorld() {
  const context = useContext(SimpleWorldContext)
  if (context === undefined) {
    throw new Error('useSimpleWorld must be used within a SimpleWorldProvider')
  }
  return context
}
