import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar / Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-box">
            <span className="logo-text">Σ</span>
          </div>
          <div className="brand-info">
            <span className="brand-name">Sigma IT</span>
            <span className="brand-tag">Order Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${window.location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
            <ChevronRight size={16} className="chevron" />
          </Link>
          
          {user?.role === 'admin' && (
            <Link to="/users" className={`nav-item ${window.location.pathname === '/users' ? 'active' : ''}`}>
              <Users size={20} />
              <span>User Management</span>
              <ChevronRight size={16} className="chevron" />
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar-small">
              <UserIcon size={16} />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn-sidebar" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="main-header">
          <div className="header-left">
            <h2 className="page-title">
              {window.location.pathname === '/' ? 'Project Management' : 
               window.location.pathname === '/users' ? 'User Settings' : 'Admin Panel'}
            </h2>
          </div>
          <div className="header-right">
            <div className="header-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
