/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import HomeDispatcher from './pages/HomeDispatcher'
import Login from './pages/Login'
import Register from './pages/Register'
import ConfirmEmail from './pages/ConfirmEmail'
import PilotFeedback from './pages/PilotFeedback'
import PilotQuality from './pages/PilotQuality'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { CerVisualTheme } from './components/CerArtwork'
import ExperimentosPage from './pages/ExperimentosPage'
import PlannerPage from './pages/PlannerPage'
import CycleReviewPage from './pages/CycleReviewPage'
import MandalaPage from './pages/MandalaPage'
import { ParticipantWorkspace } from './components/ParticipantWorkspace'
import { BibliotecaPage } from './pages/BibliotecaPage'
import { AyurvedaAvatarBancadaPage } from './pages/AyurvedaAvatarBancadaPage'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CerVisualTheme>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro/:slug" element={<Register />} />
              <Route path="/confirmar-email" element={<ConfirmEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<Layout />}>
                <Route
                  path="/feedback"
                  element={
                    <ProtectedRoute>
                      <PilotFeedback />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profissional/qualidade"
                  element={
                    <ProtectedRoute>
                      <PilotQuality />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomeDispatcher />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profissional"
                  element={
                    <ProtectedRoute>
                      <HomeDispatcher />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profissional/participantes/:enrollmentId"
                  element={
                    <ProtectedRoute>
                      <ParticipantWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profissional/:enrollmentId"
                  element={
                    <ProtectedRoute>
                      <ParticipantWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <HomeDispatcher />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profissional/biblioteca"
                  element={
                    <ProtectedRoute>
                      <BibliotecaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/experimentos"
                  element={
                    <ProtectedRoute>
                      <ExperimentosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/planner"
                  element={
                    <ProtectedRoute>
                      <PlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reviews/:cycleId"
                  element={
                    <ProtectedRoute>
                      <CycleReviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mandala"
                  element={
                    <ProtectedRoute>
                      <MandalaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bancada-ayurveda"
                  element={
                    <ProtectedRoute>
                      <AyurvedaAvatarBancadaPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CerVisualTheme>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
