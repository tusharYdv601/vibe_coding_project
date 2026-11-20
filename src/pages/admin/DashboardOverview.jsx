import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Book,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  PlusCircle,
  GraduationCap,
  ArrowLeftRight,
  Loader2
} from 'lucide-react';

export default function DashboardOverview() {
  const { openCheckoutModal, refreshTrigger } = useOutletContext();

  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalStudents: 0
  });

  const [recentCheckouts, setRecentCheckouts] = useState([]);
  const [overdueCheckouts, setOverdueCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [
        { data: booksData },
        { count: checkedOutCount },
        { count: studentsCount },
        { data: recentLoans }
      ] = await Promise.all([
        supabase.from('books').select('total_copies, available_copies'),
        supabase.from('checkouts').select('*', { count: 'exact', head: true }).eq('status', 'checked_out'),
        supabase.from('student').select('*', { count: 'exact', head: true }),
        supabase.from('checkouts').select(`
          id,
          status,
          checkout_date,
          due_date,
          books ( title ),
          student ( student_name, admission_no, department )
        `).order('checkout_date', { ascending: false }).limit(6)
      ]);

      const total = booksData?.reduce((sum, b) => sum + (b.total_copies || 0), 0) || 0;
      const available = booksData?.reduce((sum, b) => sum + (b.available_copies || 0), 0) || 0;

      setStats({
        totalBooks: total,
        availableBooks: available,
        borrowedBooks: checkedOutCount || 0,
        totalStudents: studentsCount || 0
      });

      setRecentCheckouts(recentLoans || []);

      const todayStr = new Date().toISOString().split('T')[0];
      const overdueLoans = (recentLoans || []).filter(l =>
        l.status === 'checked_out' && l.due_date && l.due_date.split('T')[0] < todayStr
      );
      setOverdueCheckouts(overdueLoans);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime changes on database tables
    const channel = supabase.channel('dashboard-live-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkouts' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="content-section" id="dashboard-section">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here is the latest real-time summary of your library operations.</p>
        </div>

        <div className="dashboard-quick-actions">
          <Link to="/admin/books" className="btn btn-primary btn-sm">
            <PlusCircle size={15} style={{ marginRight: '6px' }} />
            Manage Books
          </Link>
          <Link to="/admin/checkouts" className="btn btn-outline btn-sm">
            <ArrowLeftRight size={15} style={{ marginRight: '6px' }} />
            All Checkouts
          </Link>
        </div>
      </div>

      {/* OVERDUE ALERT BANNER */}
      {overdueCheckouts.length > 0 && (
        <div className="overdue-banner" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Notice: {overdueCheckouts.length} active checkout(s) are overdue.</strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>
              Please review student contacts in the Checkouts section to follow up on returns.
            </p>
          </div>
          <Link to="/admin/checkouts" className="btn-sm btn-secondary" style={{ marginLeft: 'auto' }}>
            View Overdue
          </Link>
        </div>
      )}

      {/* STATS CARDS GRID */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-content">
            <p className="card-title">Total Books</p>
            <p className="card-value">{loading ? '...' : stats.totalBooks}</p>
            <p className="card-description">Total Collection Stock</p>
          </div>
          <div className="card-icon-wrapper icon-total">
            <Book size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="card-content">
            <p className="card-title">Available</p>
            <p className="card-value">{loading ? '...' : stats.availableBooks}</p>
            <p className="card-description">On Shelves Ready to Borrow</p>
          </div>
          <div className="card-icon-wrapper icon-available">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="card-content">
            <p className="card-title">Borrowed</p>
            <p className="card-value">{loading ? '...' : stats.borrowedBooks}</p>
            <p className="card-description">Currently With Students</p>
          </div>
          <div className="card-icon-wrapper icon-checked-out">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="card-content">
            <p className="card-title">Students</p>
            <p className="card-value">{loading ? '...' : stats.totalStudents}</p>
            <p className="card-description">Enrolled Members</p>
          </div>
          <div className="card-icon-wrapper icon-students">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* RECENT CHECKOUTS SECTION */}
      <div className="dashboard-grid-dual" style={{ marginTop: '28px' }}>
        <div className="table-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Recent Lending Activity</h3>
            <Link to="/admin/checkouts" className="link-action">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            {recentCheckouts.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                No lending records yet.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Student</th>
                    <th>Borrowed Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckouts.map(item => {
                    const isReturned = item.status === 'returned';
                    const dueDateStr = item.due_date ? item.due_date.split('T')[0] : '';
                    const isOverdue = !isReturned && dueDateStr && dueDateStr < todayStr;

                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500, color: '#0f172a' }}>
                          {item.books?.title || '(Deleted Book)'}
                        </td>
                        <td>
                          {item.student?.student_name || 'Unknown'}
                          <small style={{ display: 'block', color: '#64748b' }}>
                            {item.student?.admission_no}
                          </small>
                        </td>
                        <td>{new Date(item.checkout_date).toLocaleDateString()}</td>
                        <td style={{ color: isOverdue ? '#b91c1c' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                          {new Date(item.due_date).toLocaleDateString()}
                        </td>
                        <td>
                          {isReturned ? (
                            <span className="status-badge status-returned">Returned</span>
                          ) : isOverdue ? (
                            <span className="status-badge status-overdue">Overdue</span>
                          ) : (
                            <span className="status-badge status-active">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* QUICK SHORTCUTS CARD */}
        <div className="table-card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3>Quick Shortcuts</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/admin/books" className="shortcut-card">
              <div className="shortcut-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <Book size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Book Inventory</h4>
                <p>Add new titles, update copy quantities, or delete outdated records.</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>

            <Link to="/admin/students" className="shortcut-card">
              <div className="shortcut-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <GraduationCap size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Students Directory</h4>
                <p>Register new students, update departments, and manage member profiles.</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>

            <Link to="/admin/checkouts" className="shortcut-card">
              <div className="shortcut-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                <ArrowLeftRight size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Checkouts & Returns</h4>
                <p>Monitor active loans, check overdue books, and mark returns.</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
