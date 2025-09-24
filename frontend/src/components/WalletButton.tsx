import { useWallet } from '../hooks/useWallet'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function WalletButton() {
  const { account, isConnected, isConnecting, connect, disconnect } = useWallet()
  const [copied, setCopied] = useState(false)

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
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  const copyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account)
        setCopied(true)
        toast.success('Address copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast.error('Failed to copy address')
      }
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn btn-primary flex items-center space-x-2"
      >
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={copyAddress}
        className="btn btn-outline flex items-center space-x-2"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        <span>{formatAddress(account!)}</span>
      </button>
      
      <button
        onClick={handleDisconnect}
        className="btn btn-ghost p-2"
        title="Disconnect"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}
