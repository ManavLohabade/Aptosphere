import { Link } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { useWorld } from '../hooks/useWorld'
import { 
  Globe, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight,
  Play,
  Gamepad2,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

export function HomePage() {
  const { isConnected } = useWallet()
  const { worldState } = useWorld()

  const features = [
    {
      icon: Globe,
      title: 'Real-time World State',
      description: 'Multiple players interacting simultaneously on-chain without conflicts'
    },
    {
      icon: Zap,
      title: 'Atomic Operations',
      description: 'All actions are atomic and parallel-safe using Move resources'
    },
    {
      icon: Shield,
      title: 'Fully Trustless',
      description: 'No off-chain dependencies - everything happens on-chain'
    },
    {
      icon: Users,
      title: 'Live Trading',
      description: 'Real-time item trading and tipping system with instant updates'
    }
  ]

  const stats = [
    { label: 'Active Players', value: worldState.totalPlayers },
    { label: 'Total Items', value: worldState.totalItems },
    { label: 'Network', value: 'Aptos Testnet' },
    { label: 'Status', value: 'Live' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Aptosphere
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                The first parallel SocialFi layer on Aptos. Experience real-time, 
                on-chain world state where multiple users interact simultaneously, 
                fully trustless and parallel.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {isConnected ? (
                <Link
                  to="/world"
                  className="btn btn-primary btn-lg flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Enter World</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">Connect your wallet to get started</p>
                  <div className="animate-pulse-glow">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Aptosphere?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              No chain today runs a true real-time, on-chain world state. 
              Everyone cheats with off-chain compute. Aptosphere proves this is possible on Aptos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="card p-6 text-center hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="card p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience the Future?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join the first parallel SocialFi layer and be part of the on-chain revolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <>
                  <Link
                    to="/world"
                    className="btn btn-primary btn-lg flex items-center justify-center space-x-2"
                  >
                    <Globe className="w-5 h-5" />
                    <span>Explore World</span>
                  </Link>
                  <Link
                    to="/arena"
                    className="btn btn-outline btn-lg flex items-center justify-center space-x-2"
                  >
                    <Gamepad2 className="w-5 h-5" />
                    <span>Enter Arena</span>
                  </Link>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Connect your Martian Wallet to get started
                  </p>
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
