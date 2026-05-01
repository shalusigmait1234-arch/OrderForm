import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../redux/apiSlice';
import { setCredentials } from '../redux/authSlice';
import { Lock, User, LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials(result));
      navigate('/');
    } catch (err) {
      setError(err?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card">
        <div className="login-header">
          <div className="auth-icon">
            <LogIn size={32} color="white" />
          </div>
          <h1>Admin Login</h1>
          <p>Sign in to access the dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Username</label>
            <div className="input-with-icon">
              <User size={18} className="field-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`submit-btn submit-btn-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Login Now'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Register Now</Link></p>
          <p style={{ marginTop: '10px' }}>© 2026 Sigma IT Solutions. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
