import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Activity, Search, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="landing-page">
      <Navbar />

      <header className="hero">
        <div className="container hero-content">
          <div className="hero-badge">
            <Sparkles size={14} /> Modern Library Management
          </div>
          <h1>Unlock the World of Knowledge</h1>
          <p>
            The modern way to manage, discover, and track your library's collection.
            Seamlessly designed for students and librarians alike.
          </p>
          <div className="hero-buttons">
            <Link to="/find" className="btn btn-primary btn-lg">
              <Search size={18} /> Find a Book
            </Link>
            <Link to="/portal" className="btn btn-outline btn-lg">
              Student Records
            </Link>
            <Link to="/login" className="btn btn-text btn-lg" style={{ color: '#ffffff' }}>
              Admin Portal <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <div className="container stats-bar">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>5k+</h3>
            <p>Books Available</p>
          </div>
          <div className="stat-item">
            <h3>1.2k</h3>
            <p>Active Students</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Digital Access</p>
          </div>
        </div>
      </div>

      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need to manage books</h2>
            <p>
              Streamline your library operations with our powerful suite of tools.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <BookOpen size={28} />
              </div>
              <h3>Smart Inventory</h3>
              <p>
                Track total copies, available stock, and ISBNs in real-time. Never
                lose track of a book again.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={28} />
              </div>
              <h3>Student Management</h3>
              <p>
                Manage student profiles, track lending history, and monitor due
                dates effortlessly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Activity size={28} />
              </div>
              <h3>Real-time Tracking</h3>
              <p>
                Instant updates on checkouts and returns. Visual dashboards help
                you stay organized.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Need to check your borrowed books?</h2>
              <p>Students can look up their checkout history, return due dates, and active statuses anytime.</p>
            </div>
            <Link to="/portal" className="btn btn-primary btn-lg">
              Access Student Portal <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
