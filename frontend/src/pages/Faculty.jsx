import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, AlertTriangle, X } from 'lucide-react';
import { facultyAPI, departmentAPI, authAPI } from '../services/api';

export default function Faculty() {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [maxClassesPerDay, setMaxClassesPerDay] = useState(3);
  const [departmentId, setDepartmentId] = useState('');

  const currentUser = authAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const facData = await facultyAPI.getAll();
      setFaculties(facData);
      
      const deptData = await departmentAPI.getAll();
      setDepartments(deptData);
      if (deptData.length > 0) {
        setDepartmentId(deptData[0].id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setName('');
    setEmail('');
    setMaxClassesPerDay(3);
    if (departments.length > 0) {
      setDepartmentId(departments[0].id.toString());
    } else {
      setDepartmentId('');
    }
    setCurrentId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac) => {
    setModalMode('edit');
    setName(fac.name);
    setEmail(fac.email);
    setMaxClassesPerDay(fac.maxClassesPerDay);
    setDepartmentId(fac.departmentId ? fac.departmentId.toString() : '');
    setCurrentId(fac.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !maxClassesPerDay || !departmentId) {
      setError('Please fill in all fields.');
      return;
    }

    const payload = {
      name,
      email,
      maxClassesPerDay: parseInt(maxClassesPerDay, 10),
      departmentId: parseInt(departmentId, 10)
    };

    try {
      if (modalMode === 'create') {
        await facultyAPI.create(payload);
        setSuccess('Faculty member registered successfully!');
      } else {
        await facultyAPI.update(currentId, payload);
        setSuccess('Faculty member details updated successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save faculty details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this faculty member? All associated subjects will be affected.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await facultyAPI.delete(id);
      setSuccess('Faculty member removed successfully!');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to remove faculty member.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Members</h1>
          <p className="page-desc">Manage teachers and set daily lesson limits</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary" disabled={departments.length === 0}>
            <Plus size={18} />
            <span>Add Faculty</span>
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
            <Users size={18} />
            <span>{success}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {departments.length === 0 && !loading && (
        <div className="alert-banner alert-banner-error" style={{ marginBottom: '24px' }}>
          <span>You must create at least one Department before you can register faculty members.</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading faculties...</div>
        </div>
      ) : faculties.length === 0 ? (
        <div className="glass-card empty-state">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">No Faculty Registered</h3>
          <p className="empty-state-desc">
            {isAdmin 
              ? 'Get started by adding your first faculty member.' 
              : 'No faculty members registered yet.'}
          </p>
          {isAdmin && (
            <button 
              onClick={handleOpenCreateModal} 
              className="btn btn-outline" 
              style={{ marginTop: '10px' }}
              disabled={departments.length === 0}
            >
              Add Faculty Member
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Faculty Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Max Classes / Day</th>
                {isAdmin && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {faculties.map((fac) => (
                <tr key={fac.id}>
                  <td style={{ fontWeight: 600 }}>{fac.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fac.email}</td>
                  <td>
                    <span className="badge badge-role" style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#2dd4bf', borderColor: 'rgba(20, 184, 166, 0.3)' }}>
                      {fac.Department ? fac.Department.code : 'N/A'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{fac.maxClassesPerDay} periods</td>
                  {isAdmin && (
                    <td className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenEditModal(fac)} 
                        className="btn-icon" 
                        title="Edit Faculty"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(fac.id)} 
                        className="btn-icon btn-icon-danger" 
                        title="Remove Faculty"
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
                {modalMode === 'create' ? 'Add Faculty Member' : 'Edit Faculty Member'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="fac-name">Full Name</label>
                <input
                  type="text"
                  id="fac-name"
                  className="form-control"
                  placeholder="e.g. Dr. Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fac-email">Email Address</label>
                <input
                  type="email"
                  id="fac-email"
                  className="form-control"
                  placeholder="e.g. lovelace@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fac-max">Max Classes Per Day</label>
                <input
                  type="number"
                  id="fac-max"
                  className="form-control"
                  min="1"
                  max="6"
                  value={maxClassesPerDay}
                  onChange={(e) => setMaxClassesPerDay(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fac-dept">Department</label>
                <select
                  id="fac-dept"
                  className="form-control"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
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
                  {modalMode === 'create' ? 'Register' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
