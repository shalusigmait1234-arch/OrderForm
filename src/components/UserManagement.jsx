import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useGetUsersQuery, useRegisterMutation, useDeleteUserMutation } from '../redux/apiSlice';
import { UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';

const UserManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  const [register, { isLoading: isCreating }] = useRegisterMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(newUser).unwrap();
      setSuccess('User created successfully!');
      setNewUser({ username: '', password: '', role: 'admin' });
    } catch (err) {
      setError(err?.data?.message || 'Failed to create user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id).unwrap();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  return (
    <div className="user-management-grid">
      {/* Create User Form */}
      <div className="glass-panel user-form-panel">
        <div className="panel-header">
          <UserPlus size={20} />
          <h3>Create New User</h3>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleCreateUser} className="admin-form">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
              placeholder="e.g. shalu_admin"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
              placeholder="Min 6 characters"
            />
          </div>
          {/* <div className="input-group">
            <label>Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="admin">Admin (Full Access)</option>
              <option value="user">User (Limited Access)</option>
            </select>
          </div> */}
          <button 
            type="submit" 
            className={`submit-btn submit-btn-full ${isCreating ? 'loading' : ''}`}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* User List Table */}
      <div className="glass-panel user-list-panel">
        <div className="panel-header">
          <Shield size={20} />
          <h3>System Users</h3>
        </div>

        {isLoadingUsers ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users?.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-tiny"><UserIcon size={12} /></div>
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="delete-btn-icon" 
                        onClick={() => handleDelete(u._id)}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
