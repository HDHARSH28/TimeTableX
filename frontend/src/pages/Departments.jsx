import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, AlertTriangle, X } from 'lucide-react';
import { departmentAPI, authAPI } from '../services/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  
  const currentUser = authAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setName('');
    setCode('');
    setCurrentId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setModalMode('edit');
    setName(dept.name);
    setCode(dept.code);
    setCurrentId(dept.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !code) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await departmentAPI.create({ name, code });
        setSuccess('Department created successfully!');
      } else {
        await departmentAPI.update(currentId, { name, code });
        setSuccess('Department updated successfully!');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to save department.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? All associated faculty and subjects will be affected.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await departmentAPI.delete(id);
      setSuccess('Department deleted successfully!');
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-desc">Manage academic departments and faculties</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-banner alert-banner-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="alert-banner alert-banner-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} />
            <span>{success}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading departments...</div>
        </div>
      ) : departments.length === 0 ? (
        <div className="glass-card empty-state">
          <Building2 className="empty-state-icon" />
          <h3 className="empty-state-title">No Departments Found</h3>
          <p className="empty-state-desc">
            {isAdmin 
              ? 'Get started by creating your first department.' 
              : 'No departments registered yet. Contact an administrator.'}
          </p>
          {isAdmin && (
            <button onClick={handleOpenCreateModal} className="btn btn-outline" style={{ marginTop: '10px' }}>
              Create Department
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                {isAdmin && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{dept.code}</td>
                  <td>{dept.name}</td>
                  {isAdmin && (
                    <td className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenEditModal(dept)} 
                        className="btn-icon" 
                        title="Edit Department"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(dept.id)} 
                        className="btn-icon btn-icon-danger" 
                        title="Delete Department"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === 'create' ? 'Add Department' : 'Edit Department'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="dept-code">Department Code</label>
                <input
                  type="text"
                  id="dept-code"
                  className="form-control"
                  placeholder="e.g. CSE"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dept-name">Department Name</label>
                <input
                  type="text"
                  id="dept-name"
                  className="form-control"
                  placeholder="e.g. Computer Science & Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
