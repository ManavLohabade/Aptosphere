import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWallet } from './useWallet'
import { worldService } from '../utils/worldService'
import { eventService } from '../utils/eventService'
import toast from 'react-hot-toast'

interface Player {
  address: string
  username: string
  x: number
  y: number
  balance: number
  inventory: Item[]
  joinedAt: string
  lastMove: string
}

interface Item {
  id: number
  name: string
  owner: string
  createdAt: string
}

interface WorldState {
  players: Player[]
  items: Item[]
  totalPlayers: number
  totalItems: number
  lastUpdate: string
}

interface WorldContextType {
  worldState: WorldState
  players: Player[]
  isConnected: boolean
  joinWorld: (username: string) => Promise<void>
  leaveWorld: () => Promise<void>
  movePlayer: (x: number, y: number) => Promise<void>
  sendTip: (recipient: string, amount: number) => Promise<void>
  mintItem: (name: string) => Promise<void>
  transferItem: (recipient: string, itemId: number) => Promise<void>
  tradeItems: (recipient: string, myItemId: number, theirItemId: number) => Promise<void>
  commitWorldState: (rootHash: string, tick: number) => Promise<void>
  refreshWorldState: () => Promise<void>
}

const WorldContext = createContext<WorldContextType | undefined>(undefined)

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const { account, isConnected, signAndSubmitTransaction } = useWallet()
  const [worldState, setWorldState] = useState<WorldState>({
    players: [],
    items: [],
    totalPlayers: 0,
    totalItems: 0,
    lastUpdate: new Date().toISOString()
  })

  useEffect(() => {
    if (isConnected) {
      // Start listening to real-time events
      eventService.connect()
      
      // Set up event listeners
      eventService.on('world_state', (data: WorldState) => {
        setWorldState(data)
      })

      eventService.on('player_joined', (data: any) => {
        toast.success(`${data.username} joined the world!`)
        refreshWorldState()
      })

      eventService.on('player_moved', (data: any) => {
        toast.success(`${data.username} moved to (${data.new_x}, ${data.new_y})`)
        refreshWorldState()
      })

      eventService.on('tip_sent', (data: any) => {
        toast.success(`Tip of ${data.amount} sent!`)
        refreshWorldState()
      })

      eventService.on('item_traded', (data: any) => {
        toast.success('Item traded successfully!')
        refreshWorldState()
      })

      // Initial load
      refreshWorldState()
    }

    return () => {
      eventService.disconnect()
    }
  }, [isConnected])

  const joinWorld = async (username: string) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Check if using placeholder contract address
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
      console.log('Contract address:', contractAddress)
      console.log('Is placeholder?', contractAddress === '0x1234567890abcdef1234567890abcdef12345678')
      
      if (contractAddress === '0x1234567890abcdef1234567890abcdef12345678') {
        // Demo mode - simulate joining without blockchain transaction
        console.log('Entering demo mode')
        toast.success(`Welcome to Aptosphere, ${username}! (Demo Mode)`)
        await refreshWorldState()
        return
      }

      // Convert username to proper format for Move contract
      const usernameBytes = Array.from(new TextEncoder().encode(username))
      const payload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::World::join_world`,
        arguments: [usernameBytes]
      }

      await signAndSubmitTransaction(payload)
      toast.success(`Welcome to Aptosphere, ${username}!`)
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to join world:', error)
      toast.error(`Failed to join world: ${error.message}`)
    }
  }

  const leaveWorld = async () => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Check if using placeholder contract address
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
      if (contractAddress === '0x1234567890abcdef1234567890abcdef12345678') {
        // Demo mode - simulate leaving without blockchain transaction
        toast.success('Left the world successfully (Demo Mode)')
        await refreshWorldState()
        return
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::world::leave_world`,
        arguments: []
      }

      await signAndSubmitTransaction(payload)
      toast.success('Left the world successfully')
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to leave world:', error)
      toast.error(`Failed to leave world: ${error.message}`)
    }
  }

  const movePlayer = async (x: number, y: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Check if using placeholder contract address
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
      if (contractAddress === '0x1234567890abcdef1234567890abcdef12345678') {
        // Demo mode - simulate movement without blockchain transaction
        toast.success(`Moved to (${x}, ${y}) (Demo Mode)`)
        await refreshWorldState()
        return
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::World::move_player`,
        arguments: [x.toString(), y.toString()]
      }

      await signAndSubmitTransaction(payload)
      toast.success(`Moved to (${x}, ${y})`)
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to move player:', error)
      toast.error(`Failed to move: ${error.message}`)
    }
  }

  const sendTip = async (recipient: string, amount: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${import.meta.env.VITE_CONTRACT_ADDRESS}::world::send_tip`,
        arguments: [recipient, amount]
      }

      await signAndSubmitTransaction(payload)
      toast.success(`Tip of ${amount} sent!`)
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to send tip:', error)
      toast.error(`Failed to send tip: ${error.message}`)
    }
  }

  const mintItem = async (name: string) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${import.meta.env.VITE_CONTRACT_ADDRESS}::items::mint_item`,
        arguments: [Array.from(new TextEncoder().encode(name)).map(b => b.toString(16).padStart(2, '0')).join('')]
      }

      await signAndSubmitTransaction(payload)
      toast.success(`Item "${name}" minted!`)
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to mint item:', error)
      toast.error(`Failed to mint item: ${error.message}`)
    }
  }

  const transferItem = async (recipient: string, itemId: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${import.meta.env.VITE_CONTRACT_ADDRESS}::items::transfer_item`,
        arguments: [recipient, itemId]
      }

      await signAndSubmitTransaction(payload)
      toast.success('Item transferred!')
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to transfer item:', error)
      toast.error(`Failed to transfer item: ${error.message}`)
    }
  }

  const tradeItems = async (recipient: string, myItemId: number, theirItemId: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${import.meta.env.VITE_CONTRACT_ADDRESS}::items::trade_items`,
        arguments: [recipient, myItemId, theirItemId]
      }

      await signAndSubmitTransaction(payload)
      toast.success('Items traded!')
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to trade items:', error)
      toast.error(`Failed to trade items: ${error.message}`)
    }
  }

  const commitWorldState = async (rootHash: string, tick: number) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected')
      }

      // Check if using placeholder contract address
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
      if (contractAddress === '0x1234567890abcdef1234567890abcdef12345678') {
        // Demo mode - simulate commit without blockchain transaction
        console.log('Demo mode: Simulating world state commit')
        toast.success(`World state committed! Tick: ${tick}`)
        return
      }

      // Convert rootHash to bytes
      const rootHashBytes = Array.from(new TextEncoder().encode(rootHash))
      
      const payload = {
        type: 'entry_function_payload',
        function: `${contractAddress}::World::commit_world_state`,
        arguments: [rootHashBytes, tick.toString()]
      }

      await signAndSubmitTransaction(payload)
      toast.success(`World state committed! Tick: ${tick}`)
      await refreshWorldState()
    } catch (error: any) {
      console.error('Failed to commit world state:', error)
      toast.error(`Failed to commit world state: ${error.message}`)
    }
  }

  const refreshWorldState = async () => {
    try {
      const state = await worldService.getWorldState()
      setWorldState(state)
    } catch (error) {
      console.error('Failed to refresh world state:', error)
    }
  }

  const value: WorldContextType = {
    worldState,
    players: worldState.players,
    isConnected,
    joinWorld,
    leaveWorld,
    movePlayer,
    sendTip,
    mintItem,
    transferItem,
    tradeItems,
    commitWorldState,
    refreshWorldState
  }

  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  )
}

export function useWorld() {
  const context = useContext(WorldContext)
  if (context === undefined) {
    throw new Error('useWorld must be used within a WorldProvider')
  }
  return context
}
