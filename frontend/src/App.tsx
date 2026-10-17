import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { LandingPage } from './pages/LandingPage'
import { ReviewWorkspace } from './pages/ReviewWorkspace'
import { ExportPage } from './pages/ExportPage'
import { MethodPage } from './pages/MethodPage'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/review" element={<ReviewWorkspace />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/method" element={<MethodPage />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
