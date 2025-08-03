import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import Navbar from './components/Navbar'
import ExplorarEventosPage from './pages/ExplorarEventosPage'
import DetalleEventoPage from './pages/DetalleEventoPage'

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate')
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach(el => observer.observe(el))

    return () => {
      elements.forEach(el => observer.unobserve(el))
    }
  }, [])

  // Mostrar Navbar solo en páginas internas
  const showNavbar = ['/dashboard', '/explorar', location.pathname.startsWith('/evento/') ? location.pathname : ''].includes(location.pathname);
  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="App">
      {showNavbar && <Navbar onLogout={handleLogout} />}
      <div className={showNavbar ? 'pt-20' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/explorar" element={<ExplorarEventosPage />} />
          <Route path="/evento/:id" element={<DetalleEventoPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App 