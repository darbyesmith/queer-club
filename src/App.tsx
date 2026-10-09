import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Join } from './pages/Join'
import { Directory } from './pages/Directory'
import { ProfilePage } from './pages/Profile'
import { Messages } from './pages/Messages'
import { MemberProfile } from './pages/MemberProfile'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/join" element={<Join />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/members/:id" element={<MemberProfile />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
