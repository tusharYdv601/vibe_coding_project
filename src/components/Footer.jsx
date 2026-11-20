import React from 'react';
import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div className="logo-icon" style={{ width: '28px', height: '28px' }}>
                <Library size={16} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>LibraryHub</h4>
            </div>
            <p>Empowering education through modern organized knowledge.</p>
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/find">Find Books</Link>
            <Link to="/portal">Student Portal</Link>
            <Link to="/login">Admin</Link>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} LibraryHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
