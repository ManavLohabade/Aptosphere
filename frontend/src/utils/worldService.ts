import axios from 'axios'

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001'

export const worldService = {
  async getWorldState() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/world-state`)
      return response.data
    } catch (error) {
      console.error('Failed to get world state:', error)
      throw error
    }
  },

  async getPlayers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/players`)
      return response.data
    } catch (error) {
      console.error('Failed to get players:', error)
      throw error
    }
  },

  async getPlayer(address: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/players/${address}`)
      return response.data
    } catch (error) {
      console.error('Failed to get player:', error)
      throw error
    }
  },

  async getEvents() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`)
      return response.data
    } catch (error) {
      console.error('Failed to get events:', error)
      throw error
    }
  }
}
