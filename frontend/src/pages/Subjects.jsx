import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, AlertTriangle, X, Upload } from 'lucide-react';
import { subjectAPI, departmentAPI, facultyAPI, authAPI } from '../services/api';
import ImportModal from '../components/ImportModal';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [classesPerWeek, setClassesPerWeek] = useState(3);
  const [semester, setSemester] = useState(1);
  const [type, setType] = useState('theory'); // 'theory' | 'lab' | 'tutorial'
  const [departmentId, setDepartmentId] = useState('');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

  const currentUser = authAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const subData = await subjectAPI.getAll();
      setSubjects(subData);

      const deptData = await departmentAPI.getAll();
      setDepartments(deptData);

      const facData = await facultyAPI.getAll();
      setFaculties(facData);

      if (deptData.length > 0) {
        setDepartmentId(deptData[0].id.toString());
      }
      setSelectedFacultyIds([]);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
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
    setCode('');
    setClassesPerWeek(3);
    setSemester(1);
    setType('theory');
    if (departments.length > 0) {
      setDepartmentId(departments[0].id.toString());
    } else {
      setDepartmentId('');
    }
    setSelectedFacultyIds([]);
    setCurrentId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setModalMode('edit');
    setName(sub.name);
    setCode(sub.code);
    setClassesPerWeek(sub.classesPerWeek);
    setSemester(sub.semester);
    setType(sub.type || 'theory');
    setDepartmentId(sub.departmentId ? sub.departmentId.toString() : '');
    setSelectedFacultyIds(sub.Faculties ? sub.Faculties.map(f => f.id) : []);
    setCurrentId(sub.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !code || !classesPerWeek || !semester || !departmentId) {
      setError('Please fill in all fields.');
      return;
    }

    if (selectedFacultyIds.length === 0) {
      setError('Please assign at least one faculty member.');
      return;
    }

    const payload = {
      name,
      code,
      classesPerWeek: parseInt(classesPerWeek, 10),
      semester: parseInt(semester, 10),
      departmentId: parseInt(departmentId, 10),
      facultyIds: selectedFacultyIds,
      type
    };

    try {
      if (modalMode === 'create') {
        await subjectAPI.create(payload);
        setSuccess('Subject created successfully!');
      } else {
        await subjectAPI.update(currentId, payload);
        setSuccess('Subject updated successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save subject.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? This will affect any generated timetables including this subject.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await subjectAPI.delete(id);
      setSuccess('Subject deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete subject.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-desc">Manage curriculums, semesters, and teacher assignments</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsImportModalOpen(true)} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Upload size={18} />
              <span>Import CSV</span>
            </button>
            <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }} disabled={departments.length === 0 || faculties.length === 0}>
              <Plus size={18} />
              <span>Add Subject</span>
            </button>
          </div>
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
            <BookOpen size={18} />
            <span>{success}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {(departments.length === 0 || faculties.length === 0) && !loading && (
        <div className="alert-banner alert-banner-error" style={{ marginBottom: '24px' }}>
          <span>You must create at least one Department and register one Faculty member before adding subjects.</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading subjects...</div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card empty-state">
          <BookOpen className="empty-state-icon" />
          <h3 className="empty-state-title">No Subjects Found</h3>
          <p className="empty-state-desc">
            {isAdmin 
              ? 'Get started by creating your first subject.' 
              : 'No subjects registered yet.'}
          </p>
          {isAdmin && (
            <button 
              onClick={handleOpenCreateModal} 
              className="btn btn-outline" 
              style={{ marginTop: '10px' }}
              disabled={departments.length === 0 || faculties.length === 0}
            >
              Add Subject
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Sem</th>
                <th>Classes / Week</th>
                <th>Department</th>
                <th>Type</th>
                <th>Assigned Faculty</th>
                {isAdmin && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{sub.code}</td>
                  <td style={{ fontWeight: 500 }}>{sub.name}</td>
                  <td>Sem {sub.semester}</td>
                  <td>{sub.classesPerWeek} periods</td>
                  <td>
                    <span className="badge badge-role" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                      {sub.Department ? sub.Department.code : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: sub.type === 'lab' ? 'var(--secondary-glow)' : (sub.type === 'both' ? 'rgba(236, 72, 153, 0.1)' : (sub.type === 'tutorial' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)')), 
                        color: sub.type === 'lab' ? 'var(--secondary)' : (sub.type === 'both' ? '#ec4899' : (sub.type === 'tutorial' ? '#34d399' : '#c084fc')),
                        borderColor: sub.type === 'lab' ? 'rgba(20, 184, 166, 0.3)' : (sub.type === 'both' ? 'rgba(236, 72, 153, 0.3)' : (sub.type === 'tutorial' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'))
                      }}
                    >
                      {sub.type || 'theory'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {sub.Faculties && sub.Faculties.length > 0 ? (
                      sub.Faculties.map(f => f.name).join(', ')
                    ) : (
                      <span style={{ color: 'var(--error)' }}>Unassigned</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenEditModal(sub)} 
                        className="btn-icon" 
                        title="Edit Subject"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)} 
                        className="btn-icon btn-icon-danger" 
                        title="Delete Subject"
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
                {modalMode === 'create' ? 'Create Subject' : 'Edit Subject'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="sub-code">Subject Code</label>
                <input
                  type="text"
                  id="sub-code"
                  className="form-control"
                  placeholder="e.g. CS301"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sub-name">Subject Name</label>
                <input
                  type="text"
                  id="sub-name"
                  className="form-control"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sub-classes">Classes / Week</label>
                  <input
                    type="number"
                    id="sub-classes"
                    className="form-control"
                    min="1"
                    max="6"
                    value={classesPerWeek}
                    onChange={(e) => setClassesPerWeek(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sub-sem">Semester</label>
                  <input
                    type="number"
                    id="sub-sem"
                    className="form-control"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sub-type">Subject Type</label>
                <select
                  id="sub-type"
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="theory">Theory (Whole Class)</option>
                  <option value="lab">Lab (3 Batches)</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="both">Theory + Lab (Both)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sub-dept">Department</label>
                <select
                  id="sub-dept"
                  className="form-control"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setSelectedFacultyIds([]); // Reset selected faculties when department changes
                  }}
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Faculty (From selected department)</label>
                {faculties.filter(f => f.departmentId?.toString() === departmentId?.toString()).length === 0 ? (
                  <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                    No faculty registered in this department. Please register faculty for this department first.
                  </div>
                ) : (
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-glass)', 
                    borderRadius: '10px', 
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {faculties
                      .filter(f => f.departmentId?.toString() === departmentId?.toString())
                      .map((fac) => {
                        const isChecked = selectedFacultyIds.includes(fac.id);
                        return (
                          <label key={fac.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedFacultyIds(selectedFacultyIds.filter(id => id !== fac.id));
                                } else {
                                  setSelectedFacultyIds([...selectedFacultyIds, fac.id]);
                                }
                              }}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            <span>{fac.name}</span>
                          </label>
                        );
                      })}
                  </div>
                )}
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

      {/* Bulk Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
        type="subjects"
      />
    </div>
  );
}
