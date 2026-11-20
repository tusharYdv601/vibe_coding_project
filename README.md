# LibraryHub - College Library Management System (React + Vite)

A modern, responsive, and real-time Library Management Single Page Application (SPA) built with **React 18**, **Vite**, **React Router 6**, **Lucide Icons**, and **Supabase**.

---

## 🚀 Features

### 1. 🌐 Public Website & Catalog
- **Landing Page (`/`)**: Hero section, real-time collection metrics, feature showcases, student portal shortcuts.
- **Find a Book (`/find`)**:
  - Live, debounced search across book titles, authors, and ISBN numbers.
  - Real-time stock status (`Available` or `Checked Out`).
  - For checked-out books, displays the next expected due date and which student currently holds it.
- **Student Records Portal (`/portal`)**:
  - Secure credential verification using Admission Number & Date of Birth (`DD/MM/YYYY` auto-formatter).
  - Student profile badge with initials avatar, department, and academic year.
  - Complete checkout history table (borrowed date, return due date, return date, and active/overdue/returned badges).
  - Prominent overdue warnings if any borrowed book is past due.

### 2. 🔐 Authentication & Role Protection
- **Admin Login (`/login`)**: Secure Supabase password sign-in with automatic verification against the `user_roles` database table.
- **Role-based Protected Routes (`/admin/*`)**: Prevents unauthorized access or non-admin access with redirection.
- **Multi-Tab Sync**: Automatically detects login/logout state changes across multiple tabs in real-time.

### 3. 📊 Admin Management Portal (`/admin`)
- **Dashboard Overview (`/admin`)**:
  - 4 Live stat cards (Total Collection, Available on Shelves, Currently Borrowed, Active Students).
  - Real-time database subscription (`postgres_changes`) updating counters instantly when transactions occur.
  - Recent lending activities table and quick action shortcuts.
  - Global overdue loan alert banner.
- **Books Inventory (`/admin/books`)**:
  - Server-side paginated table with title, author, ISBN, genre, and available copy count.
  - Search by title, author, ISBN, or genre.
  - Add & Edit book modal dialog with copy validation (`available <= total`).
  - Direct "Check Out" action button.
  - Delete book confirmation.
- **Students Directory (`/admin/students`)**:
  - Grid of student cards with initials avatars and cohort tags.
  - Search by student name, admission number, or phone.
  - Dynamic filter dropdowns for Academic Year and Department.
  - Server-side paginated list.
  - Add & Edit student modal/drawer with validation.
  - Delete student with confirmation.
- **Checkouts & Returns (`/admin/checkouts`)**:
  - Interactive toolbar with search, status filtering (`All`, `Active/Borrowed`, `Overdue`, `Returned`), and date sorting (`Newest`, `Oldest`).
  - Checkout cards highlighting overdue books with red due dates and a dedicated student contact box (Phone, Department, Section).
  - **Mark Returned**: One-click return action that marks the record as returned, saves the return timestamp, and automatically increments the available book stock.
- **Universal Checkout Modal**:
  - Can be triggered directly from Books Inventory or Dashboard.
  - Student selector with fuzzy search and optional Year / Department filter.
  - Automatic 14-day default return due date.
  - Instant stock deduction and database insertion.

---

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite)
- **Routing**: React Router DOM v6
- **Database & Auth**: Supabase (@supabase/supabase-js)
- **Icons**: Lucide React
- **Styling**: Modern CSS Design System with CSS Variables, Flexbox, and CSS Grid

---

## 📁 Project Structure

```text
├── legacy-vanilla/             # Original vanilla HTML/CSS/JS backup
├── public/                     # Static public assets
├── src/
│   ├── components/
│   │   ├── CheckoutModal.jsx   # Universal book checkout modal
│   │   ├── Footer.jsx          # Public footer component
│   │   ├── Navbar.jsx          # Responsive public navbar with mobile drawer
│   │   └── ProtectedRoute.jsx  # Route guard for admin paths
│   ├── context/
│   │   └── AuthContext.jsx     # Supabase auth state & admin role provider
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx         # Sidebar, topbar, and nested admin outlet
│   │   │   ├── BooksManager.jsx        # Book inventory CRUD & pagination
│   │   │   ├── CheckoutsManager.jsx    # Checkouts, overdue alerts & returns
│   │   │   ├── DashboardOverview.jsx   # Live stats and recent activities
│   │   │   └── StudentsManager.jsx     # Students directory CRUD & filters
│   │   ├── FindBook.jsx        # Public live book catalog search
│   │   ├── Home.jsx            # Landing page
│   │   ├── Login.jsx           # Admin login form
│   │   └── StudentPortal.jsx   # Student checkout history portal
│   ├── App.jsx                 # Route definitions
│   ├── index.css               # Complete design system & responsive styling
│   ├── main.jsx                # React DOM entry point
│   └── supabaseClient.js       # Supabase client & admin check helper
├── index.html                  # HTML template
├── package.json                # Project dependencies and npm scripts
├── schema.sql                  # PostgreSQL / Supabase database schema
└── vite.config.js              # Vite configuration
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

---

## 🗄️ Database Setup (Supabase)

The database schema and Row Level Security (RLS) policies are provided in [schema.sql](schema.sql).
Tables include:
- `books`: Stores catalog details, total copies, and available copies.
- `student`: Stores student admission numbers, names, departments, years, and contact details.
- `checkouts`: Tracks book loans, due dates, return statuses, and return dates.
- `user_roles`: Manages user permissions (`admin`, `student`).