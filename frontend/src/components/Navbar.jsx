import { Link, useLocation } from 'react-router-dom';
import { Calendar, Search, LayoutDashboard, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-secondary">EventosApp</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-200
              ${isActive('/dashboard') ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            to="/explorar"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-200
              ${isActive('/explorar') ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
          >
            <Search className="w-4 h-4" /> Explorar eventos
          </Link>
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors duration-200
              ${isActive('/dashboard') ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
          >
            <UserCheck className="w-4 h-4" /> Mis eventos
          </Link>
          <button
            className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-primary hover:bg-primary/10 transition-colors duration-200"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>
    </nav>
  );
} 