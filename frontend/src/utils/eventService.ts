import { io, Socket } from 'socket.io-client'

class EventService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect() {
    if (this.socket?.connected) {
      return
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    this.socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true
    })

    this.socket.on('connect', () => {
      console.log('Connected to Aptosphere backend')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Aptosphere backend')
    })

    this.socket.on('world_state', (data) => {
      this.emit('world_state', data)
    })

    this.socket.on('event', (data) => {
      this.emit('event', data)
    })

    this.socket.on('player_joined', (data) => {
      this.emit('player_joined', data)
    })

    this.socket.on('player_moved', (data) => {
      this.emit('player_moved', data)
    })

    this.socket.on('player_left', (data) => {
      this.emit('player_left', data)
    })

    this.socket.on('tip_sent', (data) => {
      this.emit('tip_sent', data)
    })

    this.socket.on('item_traded', (data) => {
      this.emit('item_traded', data)
    })

    this.socket.on('item_minted', (data) => {
      this.emit('item_minted', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const eventService = new EventService()
