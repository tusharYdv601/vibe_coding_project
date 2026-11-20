import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Filter,
  Search,
  Book,
  User,
  Clock,
  Calendar,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  Check,
  RotateCcw,
  Loader2
} from 'lucide-react';

export default function CheckoutsManager() {
  const { globalSearch, refreshTrigger, triggerRefresh } = useOutletContext();

  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Processing state for "Mark Returned" button
  const [processingId, setProcessingId] = useState(null);

  // Sync with globalSearch if typed in header
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== null) {
      setLocalSearch(globalSearch);
    }
  }, [globalSearch]);

  const fetchCheckouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkouts')
        .select(`
          *,
          books ( id, title, available_copies ),
          student ( student_name, admission_no, phone, department, year, section )
        `);

      if (error) throw error;
      setCheckouts(data || []);
    } catch (err) {
      console.error('Error fetching checkouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [refreshTrigger]);

  const handleMarkReturned = async (checkout) => {
    if (!window.confirm(`Mark "${checkout.books?.title || 'Book'}" as returned by ${checkout.student?.student_name || 'student'}?`)) {
      return;
    }

    setProcessingId(checkout.id);

    try {
      // 1. Update checkout record
      const { error: cErr } = await supabase
        .from('checkouts')
        .update({
          status: 'returned',
          returned_date: new Date().toISOString()
        })
        .eq('id', checkout.id);

      if (cErr) throw cErr;

      // 2. Increment book available copies
      if (checkout.book_id) {
        const { data: bookRecord } = await supabase
          .from('books')
          .select('available_copies')
          .eq('id', checkout.book_id)
          .single();

        if (bookRecord) {
          await supabase
            .from('books')
            .update({ available_copies: (bookRecord.available_copies || 0) + 1 })
            .eq('id', checkout.book_id);
        }
      }

      triggerRefresh && triggerRefresh();
      fetchCheckouts();
    } catch (err) {
      console.error('Error returning book:', err);
      alert('Error marking book as returned: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setFilterStatus('');
    setSortOrder('newest');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Apply filters and sorting
  const filteredCheckouts = checkouts.filter(item => {
    const term = localSearch.toLowerCase().trim();
    const bookTitle = item.books?.title?.toLowerCase() || '';
    const studentName = item.student?.student_name?.toLowerCase() || '';
    const admission = item.student?.admission_no?.toLowerCase() || '';

    const matchesSearch = !term ||
      bookTitle.includes(term) ||
      studentName.includes(term) ||
      admission.includes(term);

    const isReturned = item.status === 'returned';
    const dueDateStr = item.due_date ? item.due_date.split('T')[0] : '';
    const isOverdue = !isReturned && dueDateStr && dueDateStr < todayStr;

    let matchesStatus = true;
    if (filterStatus === 'checked_out') matchesStatus = !isReturned;
    else if (filterStatus === 'returned') matchesStatus = isReturned;
    else if (filterStatus === 'overdue') matchesStatus = isOverdue;

    return matchesSearch && matchesStatus;
  });

  filteredCheckouts.sort((a, b) => {
    const dateA = new Date(a.checkout_date);
    const dateB = new Date(b.checkout_date);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="content-section" id="checkouts-section" style={{ display: 'block' }}>
      {/* Header and Filter Toolbar */}
      <div className="filter-toolbar-container">
        <div className="filter-header">
          <Filter size={18} />
          <span>Explore & Filter Checkouts</span>
        </div>

        <div className="filter-controls">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search student, book, or ID..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          {/* Status Dropdown */}
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="checked_out">Active (Borrowed)</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
          </select>

          {/* Sort Dropdown */}
          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Clear Filters */}
          <button onClick={handleClearFilters} className="btn-clear">
            <RotateCcw size={14} style={{ marginRight: '4px' }} /> Clear
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
            <p>Loading checkouts...</p>
          </div>
        ) : filteredCheckouts.length === 0 ? (
          <div className="empty-state-box">
            <CheckCircle size={44} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <h4>No checkouts found</h4>
            <p>There are no records matching your current filter criteria.</p>
          </div>
        ) : (
          <div className="checkouts-grid">
            {filteredCheckouts.map(checkout => {
              const bookTitle = checkout.books?.title || '(Deleted Book)';
              const studentName = checkout.student?.student_name || 'Unknown';
              const admission = checkout.student?.admission_no || '';
              const phone = checkout.student?.phone || 'N/A';
              const dept = checkout.student?.department || '-';
              const year = checkout.student?.year || '-';
              const section = checkout.student?.section || '';

              const dateOut = checkout.checkout_date
                ? new Date(checkout.checkout_date).toLocaleDateString()
                : '-';
              const dateDue = checkout.due_date
                ? new Date(checkout.due_date).toLocaleDateString()
                : '-';

              const isReturned = checkout.status === 'returned';
              const dueDateStr = checkout.due_date ? checkout.due_date.split('T')[0] : '';
              const isOverdue = !isReturned && dueDateStr && dueDateStr < todayStr;

              let statusClass = 'status-active';
              let statusText = 'Active';
              let cardClass = 'checkout-card';
              let dateColor = 'inherit';

              if (isReturned) {
                statusClass = 'status-returned';
                statusText = 'Returned';
              } else if (isOverdue) {
                statusClass = 'status-overdue';
                statusText = 'Overdue';
                cardClass = 'checkout-card overdue';
                dateColor = '#b91c1c';
              } else {
                dateColor = '#15803d';
              }

              const isProcessing = processingId === checkout.id;

              return (
                <div key={checkout.id} className={cardClass}>
                  <div className="card-header">
                    <div className="book-title">
                      <Book size={18} />
                      <span>{bookTitle}</span>
                    </div>
                    <div className="student-name">
                      <User size={16} />
                      <span>{studentName} <small>({admission})</small></span>
                    </div>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span>Borrowed:</span>
                      <strong>{dateOut}</strong>
                    </div>

                    <div className="detail-row">
                      <span>Due:</span>
                      <strong style={{ color: dateColor }}>{dateDue}</strong>
                    </div>

                    <div className="detail-row" style={{ marginTop: '8px' }}>
                      <span>Status:</span>
                      <span className={`status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Overdue Student Contact Block */}
                    {isOverdue && (
                      <div className="overdue-alert-box">
                        <div className="alert-title">
                          <AlertCircle size={14} /> Student Contact Info
                        </div>
                        <div className="alert-info">
                          <span><Phone size={12} /> {phone}</span>
                          <span><Building size={12} /> {dept} - Yr {year} {section}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    {!isReturned ? (
                      <button
                        className="return-btn"
                        onClick={() => handleMarkReturned(checkout)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={17} /> Mark Returned
                          </>
                        )}
                      </button>
                    ) : (
                      <button className="return-btn returned-btn" disabled>
                        <Check size={16} /> Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
