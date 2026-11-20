import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Library,
  LayoutGrid,
  GraduationCap,
  ArrowLeftRight,
  LogOut,
  Menu,
  Search,
  ExternalLink,
  BookOpen,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CheckoutModal from '../../components/CheckoutModal';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [checkoutBook, setCheckoutBook] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const openCheckoutModal = (book) => {
    setCheckoutBook(book);
  };

  const handleCheckoutSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const adminName = user?.email?.split('@')[0] || 'Admin';

  return (
    <div className={`page-container ${sidebarOpen ? '' : 'sidebar-hidden'}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <Library size={20} />
          </div>
          <div className="logo-text">
            <span>Library</span>
            <span className="highlight">Hub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main Menu</div>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <LayoutGrid size={18} />
            <span>Dashboard</span>
            <div className="glow-effect"></div>
          </NavLink>

          <NavLink
            to="/admin/books"
            className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <BookOpen size={18} />
            <span>Books Inventory</span>
          </NavLink>

          <NavLink
            to="/admin/students"
            className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <GraduationCap size={18} />
            <span>Students</span>
          </NavLink>

          <NavLink
            to="/admin/checkouts"
            className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
          >
            <ArrowLeftRight size={18} />
            <span>Checkouts</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=3b82f6&color=fff`}
                alt="Admin"
              />
            </div>
            <div className="user-info">
              <span className="name">{adminName}</span>
              <span className="role">Library Manager</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-mini-btn"
              title="Sign Out"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        <header className="top-bar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              id="search-box"
              placeholder="Quick search across library..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          <div className="top-bar-actions">
            <Link to="/" className="action-pill-btn" title="View Public Website">
              <Home size={15} />
              <span>Public Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="action-btn logout-top-btn"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet
            context={{
              openCheckoutModal,
              globalSearch,
              refreshTrigger,
              triggerRefresh: handleCheckoutSuccess
            }}
          />
        </main>
      </div>

      {/* Global Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(checkoutBook)}
        book={checkoutBook}
        onClose={() => setCheckoutBook(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
