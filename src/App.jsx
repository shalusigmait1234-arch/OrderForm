import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './components/Login';
import Register from './components/Register';
import AdminLayout from './components/AdminLayout';
import OrderDashboard from './components/OrderDashboard';
import UserManagement from './components/UserManagement';
import './App.css';

const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} 
        />

        {/* Protected Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<OrderDashboard />} />
          <Route path="/users" element={<UserManagement />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;