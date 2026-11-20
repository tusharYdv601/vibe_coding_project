import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, CheckCircle, XCircle, ArrowLeft, BookOpen, Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function FindBook() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [activeCheckouts, setActiveCheckouts] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setBooks([]);
      setActiveCheckouts({});
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);

      try {
        const query = searchTerm.trim();
        const { data: bookResults, error } = await supabase
          .from('books')
          .select('*')
          .or(`title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`)
          .order('title');

        if (error) {
          console.error('Search error:', error);
          setBooks([]);
          setLoading(false);
          return;
        }

        setBooks(bookResults || []);

        // Find checkout details for books with 0 copies available
        const unavailableIds = (bookResults || [])
          .filter(b => b.available_copies === 0)
          .map(b => b.id);

        if (unavailableIds.length > 0) {
          const { data: checkouts, error: checkoutError } = await supabase
            .from('checkouts')
            .select(`
              book_id,
              due_date,
              student ( student_name )
            `)
            .in('book_id', unavailableIds)
            .eq('status', 'checked_out');

          if (!checkoutError && checkouts) {
            // Group and find earliest due date per book
            const map = {};
            checkouts.forEach(c => {
              if (!map[c.book_id] || new Date(c.due_date) < new Date(map[c.book_id].due_date)) {
                map[c.book_id] = c;
              }
            });
            setActiveCheckouts(map);
          }
        }
      } catch (err) {
        console.error('Unexpected error searching books:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="find-book-page">
      <Navbar />

      <section className="search-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1>Find Your Next Read</h1>
          <p className="search-subtitle">
            Search our comprehensive catalog by book title, author, or ISBN.
          </p>

          <div className="search-container">
            <Search className="search-icon" size={22} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by book title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {loading && <Loader2 className="search-spinner animate-spin" size={20} />}
          </div>
        </div>
      </section>

      <main className="container find-results-section">
        {!searched && !loading && (
          <div className="empty-search-state">
            <BookOpen size={48} className="empty-icon" />
            <h3>Start typing to search for books</h3>
            <p>Explore titles, see current shelf availability, or check expected return dates.</p>
          </div>
        )}

        {loading && (
          <div className="empty-search-state">
            <Loader2 className="animate-spin empty-icon" size={40} />
            <p>Searching library catalog...</p>
          </div>
        )}

        {searched && !loading && books.length === 0 && (
          <div className="empty-search-state">
            <AlertCircle size={48} className="empty-icon text-muted" />
            <h3>No books found matching "{searchTerm}"</h3>
            <p>Try searching with another keyword, author name, or ISBN number.</p>
          </div>
        )}

        {searched && !loading && books.length > 0 && (
          <div>
            <div className="results-count">
              Found <strong>{books.length}</strong> {books.length === 1 ? 'book' : 'books'}
            </div>

            <div className="books-grid">
              {books.map(book => {
                const isAvailable = (book.available_copies ?? 0) > 0;
                const nextCheckout = activeCheckouts[book.id];
                const dueDateFormatted = nextCheckout?.due_date
                  ? new Date(nextCheckout.due_date).toLocaleDateString()
                  : 'Soon';
                const holderName = nextCheckout?.student?.student_name || 'A student';

                return (
                  <div key={book.id} className="book-card">
                    <div className="book-header">
                      <h3 className="book-title">{book.title}</h3>
                      <div className="book-author">by {book.author || 'Unknown Author'}</div>
                    </div>

                    <div className="status-badge-wrapper">
                      {isAvailable ? (
                        <span className="status-badge status-available">
                          <CheckCircle size={14} style={{ marginRight: '4px' }} /> Available
                        </span>
                      ) : (
                        <span className="status-badge status-unavailable">
                          <XCircle size={14} style={{ marginRight: '4px' }} /> Checked Out
                        </span>
                      )}
                    </div>

                    <div className="meta-info">
                      <div className="meta-row">
                        <span>Genre:</span>
                        <span className="meta-value">{book.genre || '-'}</span>
                      </div>
                      <div className="meta-row">
                        <span>ISBN:</span>
                        <span className="meta-value font-mono">{book.isbn || '-'}</span>
                      </div>

                      {isAvailable ? (
                        <div className="meta-row copies-row">
                          <span>Copies:</span>
                          <strong>{book.available_copies} available (of {book.total_copies})</strong>
                        </div>
                      ) : (
                        <>
                          <div className="meta-row copies-row text-danger">
                            <span>Available:</span>
                            <strong>0 copies</strong>
                          </div>
                          <div className="student-alert">
                            <div className="alert-line">
                              <Clock size={13} />
                              <span><strong>Next Due:</strong> {dueDateFormatted}</span>
                            </div>
                            <div className="alert-line">
                              <User size={13} />
                              <span><strong>Held By:</strong> {holderName}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
