import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../redux/apiSlice';
import { Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({ username, password, role: 'user' }).unwrap();
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card">
        <div className="login-header">
          <div className="auth-icon" style={{ background: 'var(--success)' }}>
            <UserPlus size={32} color="white" />
          </div>
          <h1>Create Account</h1>
          <p>Join Sigma IT Solutions Order Panel</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Registration successful! Redirecting to login...</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
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
                  placeholder="Choose a password"
                  required
                  minLength={6}
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

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`submit-btn submit-btn-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up Now'}
            </button>
          </form>
        )}
        
        <div className="login-footer">
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Login Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
