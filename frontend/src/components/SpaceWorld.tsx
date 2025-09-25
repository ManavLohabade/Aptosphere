import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SpacePlayer {
  id: string
  name: string
  x: number
  y: number
  color: string
  isOnline: boolean
  lastSeen: Date
  energy: number
  resources: number
  discoveries: number
  avatar: string
}

interface SpaceObject {
  id: string
  type: 'planet' | 'asteroid' | 'star' | 'nebula' | 'blackhole'
  x: number
  y: number
  size: number
  color: string
  name: string
  discoveredBy?: string
  value: number
}

interface SpaceWorldProps {
  players: SpacePlayer[]
  objects: SpaceObject[]
  currentPlayer?: SpacePlayer
  onMove: (x: number, y: number) => void
  onDiscover: (objectId: string) => void
  onMine: (objectId: string) => void
  isConnected: boolean
  worldTick: number
  worldEnergy: number
}

const SPACE_SIZE = 1000
const GRID_SIZE = 50

export const SpaceWorld: React.FC<SpaceWorldProps> = ({
  players,
  objects,
  currentPlayer,
  onMove,
  onDiscover,
  onMine,
  isConnected,
  worldTick,
  worldEnergy
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Draw space world
  const drawSpace = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    )
    gradient.addColorStop(0, '#0a0a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw stars background
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 200; i++) {
      const x = (i * 137.5) % canvas.width
      const y = (i * 137.5 * 1.618) % canvas.height
      const size = Math.random() * 2
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw space objects
    objects.forEach(obj => {
      const x = obj.x * GRID_SIZE + viewOffset.x
      const y = obj.y * GRID_SIZE + viewOffset.y
      const size = obj.size * zoom

      // Object glow effect
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
      glowGradient.addColorStop(0, obj.color + '80')
      glowGradient.addColorStop(1, obj.color + '00')
      ctx.fillStyle = glowGradient
      ctx.fillRect(x - size, y - size, size * 2, size * 2)

      // Object main body
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fillStyle = obj.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Object name
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(obj.name, x, y - size - 10)
    })

    // Draw players
    players.forEach(player => {
      const x = player.x * GRID_SIZE + viewOffset.x
      const y = player.y * GRID_SIZE + viewOffset.y

      // Player trail effect
      ctx.strokeStyle = player.color + '40'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x - 20, y)
      ctx.lineTo(x + 20, y)
      ctx.stroke()

      // Player ship
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, 2 * Math.PI)
      ctx.fillStyle = player.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Player name and energy
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(player.name, x, y - 25)
      
      ctx.font = '10px Inter, sans-serif'
      ctx.fillText(`⚡${player.energy}`, x, y + 30)
    })

    // Draw current player with special effects
    if (currentPlayer) {
      const x = currentPlayer.x * GRID_SIZE + viewOffset.x
      const y = currentPlayer.y * GRID_SIZE + viewOffset.y

      // Pulsing ring
      const time = Date.now() * 0.005
      const pulseSize = 20 + Math.sin(time) * 5
      ctx.beginPath()
      ctx.arc(x, y, pulseSize, 0, 2 * Math.PI)
      ctx.strokeStyle = currentPlayer.color
      ctx.lineWidth = 3
      ctx.stroke()

      // Energy beam
      ctx.strokeStyle = currentPlayer.color + '60'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, y - 30)
      ctx.lineTo(x, y - 50)
      ctx.stroke()
    }
  }, [players, objects, currentPlayer, viewOffset, zoom])

  useEffect(() => {
    drawSpace()
  }, [drawSpace])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isConnected) return
    
    setIsDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = Math.floor((e.clientX - rect.left - viewOffset.x) / GRID_SIZE)
      const y = Math.floor((e.clientY - rect.top - viewOffset.y) / GRID_SIZE)
      setMousePos({ x, y })
      onMove(x, y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isConnected) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = Math.floor((e.clientX - rect.left - viewOffset.x) / GRID_SIZE)
      const y = Math.floor((e.clientY - rect.top - viewOffset.y) / GRID_SIZE)
      
      if (x !== mousePos.x || y !== mousePos.y) {
        setMousePos({ x, y })
        onMove(x, y)
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const newZoom = Math.max(0.5, Math.min(2, zoom + (e.deltaY > 0 ? -0.1 : 0.1)))
    setZoom(newZoom)
  }

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Space HUD */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Explorers: {players.length}</span>
          </div>
          <div>World Tick: {worldTick}</div>
          <div>Cosmic Energy: {worldEnergy}</div>
          <div>Objects: {objects.length}</div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.2))}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded text-white text-sm"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded text-white text-sm"
          >
            -
          </button>
        </div>
      </div>

      {/* Object Interaction Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            {currentPlayer && (
              <>
                <div>Energy: {currentPlayer.energy}/100</div>
                <div>Resources: {currentPlayer.resources}</div>
                <div>Discoveries: {currentPlayer.discoveries}</div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDiscover('nearby')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
            >
              🔍 Scan
            </button>
            <button
              onClick={() => onMine('nearby')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium"
            >
              ⛏️ Mine
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-600/80 text-white' 
            : 'bg-red-600/80 text-white'
        }`}>
          {isConnected ? '🌌 Connected to Aptosphere' : '❌ Disconnected'}
        </div>
      </div>
    </div>
  )
}
