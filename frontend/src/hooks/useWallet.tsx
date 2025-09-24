import React, { createContext, useContext, useEffect, useState } from 'react'
import { AptosWalletAdapterProvider } from '@martianwallet/aptos-wallet-adapter'
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter'
import { Network } from '@aptos-labs/ts-sdk'
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

const wallets = [new MartianWallet()]

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      try {
        const martianWallet = wallets[0]
        if (martianWallet) {
          const connected = await martianWallet.isConnected()
          if (connected) {
            const accounts = await martianWallet.accounts()
            if (accounts.length > 0) {
              setAccount(accounts[0].address)
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
      const martianWallet = wallets[0]
      
      if (!martianWallet) {
        throw new Error('Martian Wallet not found. Please install the extension.')
      }

      await martianWallet.connect()
      const accounts = await martianWallet.accounts()
      
      if (accounts.length > 0) {
        setAccount(accounts[0].address)
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
      const martianWallet = wallets[0]
      if (martianWallet) {
        await martianWallet.disconnect()
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
      const martianWallet = wallets[0]
      if (!martianWallet || !isConnected) {
        throw new Error('Wallet not connected')
      }

      const response = await martianWallet.signAndSubmitTransaction(payload)
      
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
      const martianWallet = wallets[0]
      if (!martianWallet || !isConnected) {
        throw new Error('Wallet not connected')
      }

      const accounts = await martianWallet.accounts()
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
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
      <WalletContext.Provider value={value}>
        {children}
      </WalletContext.Provider>
    </AptosWalletAdapterProvider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
