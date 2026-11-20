import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowLeftRight,
  BookOpen,
  X,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function BooksManager() {
  const { openCheckoutModal, globalSearch, refreshTrigger } = useOutletContext();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooksCount, setTotalBooksCount] = useState(0);
  const itemsPerPage = 10;

  // Active action dropdown ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    total_copies: 1,
    available_copies: 1
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync with globalSearch if typed in navbar
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== null) {
      setLocalSearch(globalSearch);
      setCurrentPage(1);
    }
  }, [globalSearch]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' });

      const term = localSearch.trim();
      if (term) {
        query = query.or(`title.ilike.%${term}%,isbn.ilike.%${term}%,author.ilike.%${term}%,genre.ilike.%${term}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      query = query.order('title', { ascending: true }).range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setBooks(data || []);
      if (count !== null) setTotalBooksCount(count);
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, currentPage, refreshTrigger]);

  // Close active dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-cell')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const totalPages = Math.ceil(totalBooksCount / itemsPerPage) || 1;

  const handleOpenAddModal = () => {
    setEditingBookId(null);
    setFormData({
      title: '',
      author: '',
      genre: '',
      isbn: '',
      total_copies: 1,
      available_copies: 1
    });
    setModalError('');
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenEditModal = (book) => {
    setEditingBookId(book.id);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      genre: book.genre || '',
      isbn: book.isbn || '',
      total_copies: book.total_copies ?? 1,
      available_copies: book.available_copies ?? 1
    });
    setModalError('');
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (id, title) => {
    setActiveMenuId(null);
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      fetchBooks();
    } catch (err) {
      alert('Error deleting book: ' + err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const total = parseInt(formData.total_copies, 10);
    const available = parseInt(formData.available_copies, 10);

    if (isNaN(total) || total < 1) {
      setModalError('Total copies must be at least 1.');
      return;
    }

    if (isNaN(available) || available < 0) {
      setModalError('Available copies cannot be negative.');
      return;
    }

    if (available > total) {
      setModalError("Error: 'Available Copies' cannot be greater than 'Total Copies'.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        genre: formData.genre.trim(),
        isbn: formData.isbn.trim(),
        total_copies: total,
        available_copies: available
      };

      if (editingBookId) {
        const { error } = await supabase.from('books').update(payload).eq('id', editingBookId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      setModalError(err.message || 'Error saving book.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Books</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Catalog, track available stock, and issue books to students.
          </p>
        </div>

        <button onClick={handleOpenAddModal} className="btn btn-primary" id="add-book-btn">
          <Plus size={18} />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3>All Books ({totalBooksCount})</h3>

          <div className="input-with-icon" style={{ maxWidth: '300px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              className="form-input"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>TITLE</th>
                <th style={{ width: '20%' }}>AUTHOR</th>
                <th style={{ width: '16%' }}>ISBN</th>
                <th style={{ width: '14%' }}>GENRE</th>
                <th style={{ width: '12%' }}>AVAILABLE</th>
                <th style={{ width: '10%', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                    Loading books...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <BookOpen size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No books found</p>
                    <small>Try clearing your search query or add a new book to the library.</small>
                  </td>
                </tr>
              ) : (
                books.map(book => {
                  const isAvailable = (book.available_copies ?? 0) > 0;

                  return (
                    <tr key={book.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{book.title}</div>
                      </td>
                      <td>{book.author || '-'}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>
                          {book.isbn || '-'}
                        </span>
                      </td>
                      <td>
                        {book.genre ? (
                          <span className="genre-pill">{book.genre}</span>
                        ) : '-'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: isAvailable ? '#15803d' : '#b91c1c' }}>
                          {book.available_copies}
                        </span>
                        <span style={{ color: '#64748b' }}> of {book.total_copies}</span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="action-btn-dots"
                          onClick={() => setActiveMenuId(activeMenuId === book.id ? null : book.id)}
                          aria-label="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === book.id && (
                          <div className="dropdown-menu" style={{ display: 'block' }}>
                            <button
                              className="dropdown-item edit-btn"
                              onClick={() => handleOpenEditModal(book)}
                            >
                              <Edit2 size={15} /> Edit Book
                            </button>

                            <button
                              className="dropdown-item checkout-btn"
                              disabled={!isAvailable}
                              onClick={() => {
                                setActiveMenuId(null);
                                openCheckoutModal(book);
                              }}
                              style={{ opacity: isAvailable ? 1 : 0.5 }}
                              title={!isAvailable ? 'No copies available to checkout' : ''}
                            >
                              <ArrowLeftRight size={15} /> Check Out
                            </button>

                            <button
                              className="dropdown-item delete-item delete-btn"
                              onClick={() => handleDelete(book.id, book.title)}
                            >
                              <Trash2 size={15} /> Delete Book
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-wrapper">
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({totalBooksCount} books)
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

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-header">
                <h3>{editingBookId ? 'Edit Book' : 'Add New Book'}</h3>
                <p className="modal-subtitle">
                  {editingBookId ? 'Update book metadata and shelf stock.' : 'Enter book information to add to the inventory.'}
                </p>
              </div>

              {modalError && (
                <div className="error-alert" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Great Gatsby"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Author *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. F. Scott Fitzgerald"
                    className="form-input"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Classic Fiction"
                    className="form-input"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input
                  type="text"
                  placeholder="e.g. 9780743273565"
                  className="form-input"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Copies *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={formData.total_copies}
                    onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Copies *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-input"
                    value={formData.available_copies}
                    onChange={(e) => setFormData({ ...formData, available_copies: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} style={{ marginRight: '6px' }} />
                      Saving...
                    </>
                  ) : (
                    editingBookId ? 'Update Book' : 'Save Book'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
