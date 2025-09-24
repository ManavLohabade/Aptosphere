import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './hooks/useWallet'
import { WorldProvider } from './hooks/useWorld'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { WorldPage } from './pages/WorldPage'
import { ArenaPage } from './pages/ArenaPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <WalletProvider>
      <WorldProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/world" element={<WorldPage />} />
            <Route path="/arena" element={<ArenaPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </WorldProvider>
    </WalletProvider>
  )
}

export default App
