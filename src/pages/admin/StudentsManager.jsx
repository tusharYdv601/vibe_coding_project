import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash,
  GraduationCap,
  Cake,
  X,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [availableDepts, setAvailableDepts] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Active card dropdown ID
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Form toggle & state
  const [showForm, setShowForm] = useState(false);
  const [editingAdmissionNo, setEditingAdmissionNo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    admission_no: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    section: '',
    dob: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load distinct filters from database
  const loadFilters = async () => {
    try {
      const { data, error } = await supabase
        .from('student')
        .select('department, year');

      if (!error && data) {
        const uniqueDepts = [...new Set(data.map(item => item.department).filter(Boolean))].sort();
        const uniqueYears = [...new Set(data.map(item => item.year).filter(Boolean))].sort((a, b) => a - b);
        setAvailableDepts(uniqueDepts);
        setAvailableYears(uniqueYears);
      }
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student')
        .select('*', { count: 'exact' });

      if (selectedDept) query = query.eq('department', selectedDept);
      if (selectedYear) query = query.eq('year', selectedYear);

      const queryTerm = searchTerm.trim();
      if (queryTerm) {
        query = query.or(`student_name.ilike.%${queryTerm}%,admission_no.ilike.%${queryTerm}%,email.ilike.%${queryTerm}%,phone.ilike.%${queryTerm}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      query = query.order('student_name', { ascending: true }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setStudents(data || []);
      if (count !== null) setTotalStudentsCount(count);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDept, selectedYear, currentPage]);

  // Click outside to close card dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-wrapper')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const totalPages = Math.ceil(totalStudentsCount / itemsPerPage) || 1;

  const handleOpenAdd = () => {
    setEditingAdmissionNo(null);
    setFormData({
      name: '',
      admission_no: '',
      email: '',
      phone: '',
      department: '',
      year: '',
      section: '',
      dob: ''
    });
    setFormError('');
    setShowForm(true);
    setActiveDropdownId(null);
  };

  const handleOpenEdit = (student) => {
    setEditingAdmissionNo(student.admission_no);
    setFormData({
      name: student.student_name || '',
      admission_no: student.admission_no || '',
      email: student.email || '',
      phone: student.phone || '',
      department: student.department || '',
      year: student.year || '',
      section: student.section || '',
      dob: student.dob ? student.dob.split('T')[0] : ''
    });
    setFormError('');
    setShowForm(true);
    setActiveDropdownId(null);
  };

  const handleDelete = async (admissionNo, name) => {
    setActiveDropdownId(null);
    if (!window.confirm(`Are you sure you want to delete "${name}" (ID: ${admissionNo})?`)) return;

    try {
      const { error } = await supabase.from('student').delete().eq('admission_no', admissionNo);
      if (error) throw error;
      fetchStudents();
      loadFilters();
    } catch (err) {
      alert(`Error deleting student: ${err.message}`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        student_name: formData.name.trim(),
        admission_no: formData.admission_no.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        department: formData.department.trim(),
        year: formData.year ? parseInt(formData.year, 10) : null,
        section: formData.section.trim() || null,
        dob: formData.dob || null
      };

      if (editingAdmissionNo) {
        const { error } = await supabase
          .from('student')
          .update(payload)
          .eq('admission_no', editingAdmissionNo);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student')
          .insert([payload]);
        if (error) throw error;
      }

      setShowForm(false);
      fetchStudents();
      loadFilters();
    } catch (err) {
      setFormError(err.message || 'Error saving student record.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="content-section" style={{ display: 'block' }}>
      {/* Header with Search and Filter Toolbar */}
      <div className="header-with-action">
        <div>
          <h2>Manage Students</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Registered library members, contact details, and department cohorts.
          </p>
        </div>

        <div className="action-controls">
          {/* Search Bar */}
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Year Filter */}
          <div className="select-wrapper">
            <select
              className="filter-dropdown"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Year {yr}</option>
              ))}
            </select>
            <Calendar size={15} className="filter-icon" />
          </div>

          {/* Department Filter */}
          <div className="select-wrapper">
            <select
              className="filter-dropdown"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Departments</option>
              {availableDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <Filter size={15} className="filter-icon" />
          </div>

          {/* Add Student Button */}
          <button onClick={handleOpenAdd} className="add-btn btn-primary">
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Container */}
      {showForm && (
        <div className="add-student-form-container">
          <form onSubmit={handleFormSubmit} className="add-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {editingAdmissionNo ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="error-alert" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admission Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A123"
                  className="form-input"
                  value={formData.admission_no}
                  onChange={(e) => setFormData({ ...formData, admission_no: e.target.value })}
                  disabled={Boolean(editingAdmissionNo)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, Mechanical, IT"
                  className="form-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="e.g. 1, 2, 3, 4"
                  className="form-input"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A, B"
                  className="form-input"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} style={{ marginRight: '6px' }} />
                    Saving...
                  </>
                ) : (
                  editingAdmissionNo ? 'Update Student' : 'Save Student'
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards Grid */}
      <div className="student-list-container" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
            All Students ({totalStudentsCount})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
            <p>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state-box">
            <GraduationCap size={44} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <h4>No students found</h4>
            <p>Try adjusting your search query, year, or department filter.</p>
          </div>
        ) : (
          <div className="students-grid">
            {students.map(student => {
              const initials = getInitials(student.student_name);
              const formattedDOB = student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A';

              return (
                <div key={student.admission_no} className="student-card">
                  <div className="card-header">
                    <div className="student-identity">
                      <div className="student-avatar">{initials}</div>
                      <div className="student-info">
                        <h4 className="student-name">{student.student_name}</h4>
                        <div className="student-dept">{student.department} Department</div>
                        <div className="admission-badge">ID: {student.admission_no}</div>
                      </div>
                    </div>

                    <div className="action-menu-wrapper">
                      <button
                        className="menu-toggle-btn"
                        onClick={() => setActiveDropdownId(activeDropdownId === student.admission_no ? null : student.admission_no)}
                        aria-label="Actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeDropdownId === student.admission_no && (
                        <div className="action-menu-dropdown" style={{ display: 'block' }}>
                          <button
                            className="menu-item"
                            onClick={() => handleOpenEdit(student)}
                          >
                            <Edit size={15} /> Edit
                          </button>
                          <button
                            className="menu-item delete-item"
                            onClick={() => handleDelete(student.admission_no, student.student_name)}
                          >
                            <Trash size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="info-group">
                      <span className="info-label"><Calendar size={13} /> Year / Sec</span>
                      <span className="info-value">{student.year || '-'} / {student.section || '-'}</span>
                    </div>

                    <div className="info-group">
                      <span className="info-label"><Cake size={13} /> DOB</span>
                      <span className="info-value">{formattedDOB}</span>
                    </div>

                    <div className="info-group">
                      <span className="info-label"><Phone size={13} /> Phone</span>
                      <span className="info-value">{student.phone || 'N/A'}</span>
                    </div>

                    <div className="info-group" style={{ gridColumn: '1/-1' }}>
                      <span className="info-label"><Mail size={13} /> Email</span>
                      <span className="info-value email">{student.email}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Wrapper */}
        <div className="pagination-wrapper" style={{ marginTop: '30px' }}>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({totalStudentsCount} students)
          </span>

          <div className="pagination-buttons">
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
