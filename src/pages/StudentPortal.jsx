import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Library, AlertCircle, ArrowLeft, LogOut, Calendar, BookOpen, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function StudentPortal() {
  const [admissionNo, setAdmissionNo] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [student, setStudent] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [hasOverdue, setHasOverdue] = useState(false);

  // Auto-format Date input as DD/MM/YYYY
  const handleDobChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 5) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
    } else if (value.length >= 3) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setDob(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedAdmission = admissionNo.trim();
    const parts = dob.trim().split('/');
    if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
      setErrorMessage('Please enter Date of Birth in DD/MM/YYYY format');
      return;
    }

    const dbDob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    setLoading(true);

    try {
      const { data: studentRecord, error: studentError } = await supabase
        .from('student')
        .select('*')
        .eq('admission_no', trimmedAdmission)
        .eq('dob', dbDob)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentRecord) {
        throw new Error('Invalid Admission Number or Date of Birth.');
      }

      // Fetch student checkouts
      const { data: checkoutRecords, error: checkoutError } = await supabase
        .from('checkouts')
        .select(`
          *,
          books ( title )
        `)
        .eq('admission_no', studentRecord.admission_no)
        .order('checkout_date', { ascending: false });

      if (checkoutError) throw checkoutError;

      const today = new Date().toISOString().split('T')[0];
      const overdueExists = (checkoutRecords || []).some(record => {
        if (record.status === 'returned') return false;
        const due = record.due_date ? record.due_date.split('T')[0] : '';
        return due && due < today;
      });

      setStudent(studentRecord);
      setCheckouts(checkoutRecords || []);
      setHasOverdue(overdueExists);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while verifying credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    setStudent(null);
    setCheckouts([]);
    setHasOverdue(false);
    setAdmissionNo('');
    setDob('');
    setErrorMessage('');
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return dateString;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="student-portal-page">
      <Navbar />

      <main className="portal-container">
        {!student ? (
          /* Student Login Section */
          <div className="card login-card portal-auth-card">
            <div className="login-header">
              <div className="portal-icon-wrapper">
                <Library size={32} />
              </div>
              <h2>Check Your History</h2>
              <p>Enter your admission number and birth date to view your library records.</p>
            </div>

            {errorMessage && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="portal-form">
              <div className="form-group">
                <label htmlFor="admission_no">Admission Number</label>
                <input
                  type="text"
                  id="admission_no"
                  placeholder="e.g. S101"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth (DD/MM/YYYY)</label>
                <input
                  type="text"
                  id="dob"
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  value={dob}
                  onChange={handleDobChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'View Records'}
              </button>
            </form>
          </div>
        ) : (
          /* Student Results Section */
          <div className="results-wrapper">
            <div className="student-profile-bar">
              <div className="profile-info">
                <div className="avatar-circle">{getInitials(student.student_name)}</div>
                <div>
                  <h3 className="profile-student-name">{student.student_name}</h3>
                  <span className="profile-student-meta">
                    {student.department} {student.year ? `• Year ${student.year}` : ''} {student.section ? `• Sec ${student.section}` : ''} (ID: {student.admission_no})
                  </span>
                </div>
              </div>
              <button onClick={handleExit} className="btn-secondary exit-btn">
                <LogOut size={16} /> Exit
              </button>
            </div>

            {hasOverdue && (
              <div className="overdue-banner">
                <AlertTriangle size={20} />
                <span>
                  <strong>Notice:</strong> You have one or more overdue books! Please return them to the library counter as soon as possible.
                </span>
              </div>
            )}

            <div className="card history-card">
              <div className="history-card-header">
                <h3>Checkout History</h3>
                <span className="badge-count">{checkouts.length} records</span>
              </div>

              {checkouts.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={44} className="text-muted" />
                  <h4>No checkout records found</h4>
                  <p>You haven't borrowed any books from the library yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Borrowed Date</th>
                        <th>Due Date</th>
                        <th>Returned Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkouts.map(record => {
                        const isReturned = record.status === 'returned';
                        const dueDateStr = record.due_date ? record.due_date.split('T')[0] : '';
                        const isOverdue = !isReturned && dueDateStr && dueDateStr < todayStr;

                        let statusBadgeClass = 'status-active';
                        let statusText = 'Active';

                        if (isReturned) {
                          statusBadgeClass = 'status-returned';
                          statusText = 'Returned';
                        } else if (isOverdue) {
                          statusBadgeClass = 'status-overdue';
                          statusText = 'Overdue';
                        }

                        return (
                          <tr key={record.id}>
                            <td className="book-title-cell">
                              <strong>{record.books?.title || 'Unknown Book'}</strong>
                            </td>
                            <td>{formatDateDisplay(record.checkout_date)}</td>
                            <td className={isOverdue ? 'text-danger font-semibold' : ''}>
                              {formatDateDisplay(record.due_date)}
                            </td>
                            <td>{formatDateDisplay(record.returned_date)}</td>
                            <td>
                              <span className={`status-badge ${statusBadgeClass}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
