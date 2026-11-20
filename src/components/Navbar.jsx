import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Library, Menu, X, ArrowRight, LayoutDashboard, Search, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const toggleMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container nav-wrapper">
        <Link to="/" className="logo" onClick={closeMenu}>
          <div className="logo-icon">
            <Library size={22} />
          </div>
          <div className="logo-text">
            <span>Library</span>
            <span className="highlight">Hub</span>
          </div>
        </Link>

        {/* Mobile menu toggle button */}
        <button
          className="menu-toggle"
          onClick={toggleMenu}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Navigation Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <button className="menu-close" onClick={closeMenu} aria-label="Close Menu">
            <X size={24} />
          </button>

          <Link
            to="/find"
            className={`btn-text ${location.pathname === '/find' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <Search size={16} style={{ marginRight: '6px' }} />
            Find a Book
          </Link>

          <Link
            to="/portal"
            className={`btn-text ${location.pathname === '/portal' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <GraduationCap size={16} style={{ marginRight: '6px' }} />
            Student Portal
          </Link>

          {user && isAdmin ? (
            <Link
              to="/admin"
              className="btn btn-primary"
              onClick={closeMenu}
            >
              <LayoutDashboard size={16} style={{ marginRight: '6px' }} />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              onClick={closeMenu}
            >
              Admin Login <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </Link>
          )}
        </div>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div className="menu-overlay active" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
}
