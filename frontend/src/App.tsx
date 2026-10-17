import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { LandingPage } from './pages/LandingPage'
import { ReviewWorkspace } from './pages/ReviewWorkspace'
import { ExportPage } from './pages/ExportPage'
import { MethodPage } from './pages/MethodPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { CustomCursor } from './components/common/CustomCursor'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Accessible skip to main content link */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Global Spring Physics Custom Cursor */}
        <CustomCursor />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/review" element={<ReviewWorkspace />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/method" element={<MethodPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
