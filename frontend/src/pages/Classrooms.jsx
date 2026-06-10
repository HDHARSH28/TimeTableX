import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, AlertTriangle, X } from 'lucide-react';
import { classroomAPI, authAPI } from '../services/api';

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [type, setType] = useState('classroom'); // 'classroom' | 'lab'

  const currentUser = authAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await classroomAPI.getAll();
      setClassrooms(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch classrooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setName('');
    setCapacity(50);
    setType('classroom');
    setCurrentId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    setModalMode('edit');
    setName(room.name);
    setCapacity(room.capacity);
    setType(room.type);
    setCurrentId(room.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !capacity || !type) {
      setError('Please fill in all fields.');
      return;
    }

    const payload = {
      name,
      capacity: parseInt(capacity, 10),
      type
    };

    try {
      if (modalMode === 'create') {
        await classroomAPI.create(payload);
        setSuccess('Classroom registered successfully!');
      } else {
        await classroomAPI.update(currentId, payload);
        setSuccess('Classroom updated successfully!');
      }
      setIsModalOpen(false);
      fetchClassrooms();
    } catch (err) {
      setError(err.message || 'Failed to save classroom.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this classroom? All scheduled entries in this room will be removed.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await classroomAPI.delete(id);
      setSuccess('Classroom deleted successfully!');
      fetchClassrooms();
    } catch (err) {
      setError(err.message || 'Failed to delete classroom.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classrooms</h1>
          <p className="page-desc">Manage physical lecture halls and laboratory locations</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Classroom</span>
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
            <GraduationCap size={18} />
            <span>{success}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading classrooms...</div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="glass-card empty-state">
          <GraduationCap className="empty-state-icon" />
          <h3 className="empty-state-title">No Classrooms Registered</h3>
          <p className="empty-state-desc">
            {isAdmin 
              ? 'Get started by creating your first lecture room or lab.' 
              : 'No classrooms registered yet.'}
          </p>
          {isAdmin && (
            <button onClick={handleOpenCreateModal} className="btn btn-outline" style={{ marginTop: '10px' }}>
              Create Classroom
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Classroom Name</th>
                <th>Capacity</th>
                <th>Room Type</th>
                {isAdmin && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {classrooms.map((room) => (
                <tr key={room.id}>
                  <td style={{ fontWeight: 600 }}>{room.name}</td>
                  <td>{room.capacity} students</td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: room.type === 'lab' ? 'var(--secondary-glow)' : 'rgba(139, 92, 246, 0.1)', 
                        color: room.type === 'lab' ? 'var(--secondary)' : '#c084fc',
                        borderColor: room.type === 'lab' ? 'rgba(20, 184, 166, 0.3)' : 'rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      {room.type}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenEditModal(room)} 
                        className="btn-icon" 
                        title="Edit Classroom"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(room.id)} 
                        className="btn-icon btn-icon-danger" 
                        title="Delete Classroom"
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
                {modalMode === 'create' ? 'Add Classroom' : 'Edit Classroom'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="room-name">Classroom Name</label>
                <input
                  type="text"
                  id="room-name"
                  className="form-control"
                  placeholder="e.g. Room 101 or Lab 402"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="room-capacity">Capacity (Seats)</label>
                <input
                  type="number"
                  id="room-capacity"
                  className="form-control"
                  min="5"
                  max="300"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="room-type">Room Type</label>
                <select
                  id="room-type"
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="classroom">Classroom (Lecture Hall)</option>
                  <option value="lab">Lab (Practical Session Room)</option>
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
