import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Search, Calendar, User, BookOpen, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, book, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [availableYears, setAvailableYears] = useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set default due date to 14 days ahead when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      setDueDate(twoWeeks.toISOString().split('T')[0]);
      setError('');
      setSelectedStudent('');
      setStudentSearch('');
      setSelectedYear('');
      setSelectedDept('');
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('student')
        .select('admission_no, student_name, email, year, department, phone, section')
        .order('student_name');

      if (fetchErr) throw fetchErr;

      setStudents(data || []);
      setFilteredStudents(data || []);

      // Derive distinct years and departments
      const years = [...new Set((data || []).map(s => s.year).filter(Boolean))].sort();
      const depts = [...new Set((data || []).map(s => s.department).filter(Boolean))].sort();
      setAvailableYears(years);
      setAvailableDepts(depts);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students list.');
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on year, department, and text search
  useEffect(() => {
    let result = [...students];

    if (selectedYear) {
      result = result.filter(s => String(s.year) === String(selectedYear));
    }

    if (selectedDept) {
      result = result.filter(s => s.department === selectedDept);
    }

    if (studentSearch.trim()) {
      const term = studentSearch.toLowerCase().trim();
      result = result.filter(s =>
        (s.student_name && s.student_name.toLowerCase().includes(term)) ||
        (s.admission_no && s.admission_no.toLowerCase().includes(term)) ||
        (s.phone && s.phone.includes(term))
      );
    }

    setFilteredStudents(result);
  }, [students, selectedYear, selectedDept, studentSearch]);

  if (!isOpen || !book) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Fetch current book availability from database to prevent race condition
      const { data: bookRecord, error: bookErr } = await supabase
        .from('books')
        .select('available_copies')
        .eq('id', book.id)
        .single();

      if (bookErr || !bookRecord || (bookRecord.available_copies ?? 0) < 1) {
        throw new Error('This book is currently unavailable for checkout.');
      }

      // 2. Decrement available copies
      const { error: updateErr } = await supabase
        .from('books')
        .update({ available_copies: bookRecord.available_copies - 1 })
        .eq('id', book.id);

      if (updateErr) throw updateErr;

      // 3. Create checkout record
      const { error: insertErr } = await supabase
        .from('checkouts')
        .insert({
          book_id: book.id,
          admission_no: selectedStudent,
          due_date: dueDate,
          status: 'checked_out',
          checkout_date: new Date().toISOString(),
        });

      if (insertErr) throw insertErr;

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating checkout record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checkout-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Check Out Book</h3>
            <p className="modal-subtitle">
              Issue <strong>"{book.title}"</strong> to a registered student.
            </p>
          </div>

          {error && (
            <div className="error-alert" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Student Filter Controls */}
          <div className="filter-section">
            <span className="filter-section-label">Filter Student List (Optional)</span>
            <div className="filter-dropdown-row">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select-mini"
              >
                <option value="">All Years</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Year {yr}</option>
                ))}
              </select>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="filter-select-mini"
              >
                <option value="">All Departments</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick search input */}
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Search Student by Name or ID</label>
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Type to filter list..."
                className="form-input"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Student Selection */}
          <div className="form-group">
            <label htmlFor="student-select" className="form-label">
              Select Student ({filteredStudents.length} available)
            </label>
            {loading ? (
              <div className="loading-dropdown">
                <Loader2 className="animate-spin" size={16} /> Loading students...
              </div>
            ) : (
              <select
                id="student-select"
                className="form-input"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">-- Choose a student --</option>
                {filteredStudents.map(s => {
                  const details = [
                    s.department ? `Dept: ${s.department}` : '',
                    s.year ? `Yr ${s.year}` : '',
                    s.phone ? `Ph: ${s.phone}` : ''
                  ].filter(Boolean).join(' | ');

                  return (
                    <option key={s.admission_no} value={s.admission_no}>
                      {s.student_name} ({s.admission_no}) {details ? `- ${details}` : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Due Date Picker */}
          <div className="form-group">
            <label htmlFor="due-date-select" className="form-label">Return Due Date</label>
            <input
              type="date"
              id="due-date-select"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loading || !selectedStudent}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ marginRight: '6px' }} />
                  Processing...
                </>
              ) : (
                'Confirm Checkout'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
