/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import HomeDispatcher from './pages/HomeDispatcher'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import ExperimentosPage from './pages/ExperimentosPage'
import PlannerPage from './pages/PlannerPage'
import CycleReviewPage from './pages/CycleReviewPage'
import MandalaPage from './pages/MandalaPage'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeDispatcher />
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
