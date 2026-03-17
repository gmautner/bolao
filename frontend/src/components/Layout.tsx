import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-orange-500 text-white'
        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 text-base font-medium transition-colors ${
      isActive
        ? 'bg-orange-500 text-white'
        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span className="font-bold text-orange-500 text-lg leading-tight">
                Bolão<br />
                <span className="text-green-700 text-xs font-semibold tracking-wider uppercase">Copa 2026</span>
              </span>
            </Link>

            {/* Desktop nav */}
            {authenticated && (
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass}>Início</NavLink>
                <NavLink to="/partidas" className={navLinkClass}>Partidas</NavLink>
                <NavLink to="/grupos" className={navLinkClass}>Grupos</NavLink>
                <NavLink to="/ranking" className={navLinkClass}>Ranking</NavLink>
                {user?.is_superadmin && (
                  <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
                )}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2">
              {authenticated && user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to="/profile/setup"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {user.photo_path ? (
                      <img
                        src={user.photo_path}
                        alt={user.display_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-orange-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-bold">
                          {user.display_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{user.display_name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:block bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Entrar
                </Link>
              )}

              {/* Mobile hamburger */}
              {authenticated && (
                <button
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && authenticated && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="py-1">
              <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Início</NavLink>
              <NavLink to="/partidas" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Partidas</NavLink>
              <NavLink to="/grupos" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Grupos</NavLink>
              <NavLink to="/ranking" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Ranking</NavLink>
              {user?.is_superadmin && (
                <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Admin</NavLink>
              )}
            </nav>
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user?.photo_path ? (
                  <img
                    src={user.photo_path}
                    alt={user?.display_name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-orange-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                    <span className="text-orange-600 font-bold">
                      {user?.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.display_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
