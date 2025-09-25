import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Player {
  id: string
  name: string
  x: number
  y: number
  color: string
  isOnline: boolean
  lastSeen: Date
}

interface WorldCanvasProps {
  players: Player[]
  currentPlayer?: Player
  onMove: (x: number, y: number) => void
  onCommit: () => void
  isConnected: boolean
  latestTick: number
  latestRoot: string
}

const GRID_SIZE = 20
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  players,
  currentPlayer,
  onMove,
  onCommit,
  isConnected,
  latestTick,
  latestRoot
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Draw grid and players
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw grid
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    // Draw players
    players.forEach(player => {
      const x = player.x * GRID_SIZE + GRID_SIZE / 2
      const y = player.y * GRID_SIZE + GRID_SIZE / 2

      // Player circle
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, 2 * Math.PI)
      ctx.fillStyle = player.color
      ctx.fill()
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.stroke()

      // Player name
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(player.name, x, y - 20)

      // Online indicator
      if (player.isOnline) {
        ctx.beginPath()
        ctx.arc(x + 8, y - 8, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#10b981'
        ctx.fill()
      }
    })

    // Draw current player with special styling
    if (currentPlayer) {
      const x = currentPlayer.x * GRID_SIZE + GRID_SIZE / 2
      const y = currentPlayer.y * GRID_SIZE + GRID_SIZE / 2

      // Outer ring
      ctx.beginPath()
      ctx.arc(x, y, 18, 0, 2 * Math.PI)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.stroke()

      // Inner circle
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, 2 * Math.PI)
      ctx.fillStyle = currentPlayer.color
      ctx.fill()
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [players, currentPlayer])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isConnected) return
    
    setIsDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = Math.floor((e.clientX - rect.left) / GRID_SIZE)
      const y = Math.floor((e.clientY - rect.top) / GRID_SIZE)
      setMousePos({ x, y })
      onMove(x, y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isConnected) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = Math.floor((e.clientX - rect.left) / GRID_SIZE)
      const y = Math.floor((e.clientY - rect.top) / GRID_SIZE)
      
      if (x !== mousePos.x || y !== mousePos.y) {
        setMousePos({ x, y })
        onMove(x, y)
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-gray-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Canvas overlay with info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm text-gray-600">
          <div>Players: {players.length}</div>
          <div>Tick: {latestTick}</div>
          <div className="truncate max-w-xs">Root: {latestRoot.slice(0, 16)}...</div>
        </div>
      </div>

      {/* Commit button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCommit}
        disabled={!isConnected}
        className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Commit State
      </motion.button>

      {/* Connection status */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </div>
  )
}
