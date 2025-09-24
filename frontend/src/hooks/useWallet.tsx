import React, { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface WalletContextType {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signAndSubmitTransaction: (payload: any) => Promise<string>
  getAccountInfo: () => Promise<any>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Wallet detection function
const getAvailableWallet = () => {
  if (typeof window === 'undefined') return null
  
  // Check for Martian Wallet first (preferred)
  if (window.martian) {
    return window.martian
  }
  
  // Check for Petra Wallet
  if (window.petra) {
    return window.petra
  }
  
  // Check for generic aptos wallet
  if (window.aptos) {
    return window.aptos
  }
  
  // Check for other common wallet names
  if (window.aptosWallet) {
    return window.aptosWallet
  }
  
  return null
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      try {
        const wallet = getAvailableWallet()
        if (wallet) {
          const connected = await wallet.isConnected()
          if (connected) {
            const accounts = await wallet.accounts()
            if (accounts.length > 0) {
              setAccount(accounts[0])
              setIsConnected(true)
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }

    checkConnection()
  }, [])

  const connect = async () => {
    try {
      setIsConnecting(true)
      
      const wallet = getAvailableWallet()
      if (!wallet) {
        throw new Error('No Aptos wallet found. Please install Martian Wallet or Petra Wallet extension.')
      }

      const response = await wallet.connect()
      
      if (response) {
        setAccount(response.address)
        setIsConnected(true)
        toast.success('Wallet connected successfully!')
      } else {
        throw new Error('No accounts found')
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      toast.error(`Failed to connect wallet: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      const wallet = getAvailableWallet()
      if (wallet) {
        await wallet.disconnect()
      }
      
      setAccount(null)
      setIsConnected(false)
      toast.success('Wallet disconnected')
    } catch (error: any) {
      console.error('Wallet disconnection failed:', error)
      toast.error(`Failed to disconnect wallet: ${error.message}`)
    }
  }

  const signAndSubmitTransaction = async (payload: any): Promise<string> => {
    try {
      const wallet = getAvailableWallet()
      if (!wallet || !isConnected) {
        throw new Error('Wallet not connected')
      }

      const response = await wallet.signAndSubmitTransaction(payload)
      
      if (response.hash) {
        toast.success('Transaction submitted successfully!')
        return response.hash
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error: any) {
      console.error('Transaction failed:', error)
      toast.error(`Transaction failed: ${error.message}`)
      throw error
    }
  }

  const getAccountInfo = async () => {
    try {
      const wallet = getAvailableWallet()
      if (!wallet || !isConnected) {
        throw new Error('Wallet not connected')
      }

      const accounts = await wallet.accounts()
      return accounts[0]
    } catch (error: any) {
      console.error('Failed to get account info:', error)
      throw error
    }
  }

  const value: WalletContextType = {
    account,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signAndSubmitTransaction,
    getAccountInfo
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    martian?: {
      connect: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      isConnected: () => Promise<boolean>
      accounts: () => Promise<string[]>
      signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>
    }
    petra?: {
      connect: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      isConnected: () => Promise<boolean>
      accounts: () => Promise<string[]>
      signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>
    }
    aptos?: {
      connect: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      isConnected: () => Promise<boolean>
      accounts: () => Promise<string[]>
      signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>
    }
    aptosWallet?: {
      connect: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      isConnected: () => Promise<boolean>
      accounts: () => Promise<string[]>
      signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>
    }
  }
}
