import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, ShieldAlert, ArrowRight, X, Sparkles } from 'lucide-react';
import { timetableAPI, departmentAPI, authAPI } from '../services/api';

export default function Timetables() {
  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState(3);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [workingDays, setWorkingDays] = useState(['1', '2', '3', '4', '5']);
  const [slotsPerDay, setSlotsPerDay] = useState(6);
  const [breaks, setBreaks] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [slotDuration, setSlotDuration] = useState(60);

  const dayOptions = [
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' },
    { value: '6', label: 'Sat' },
    { value: '7', label: 'Sun' }
  ];

  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isScheduler = currentUser?.role === 'scheduler';
  const canGenerate = isAdmin || isScheduler;

  const fetchData = async () => {
    try {
      setLoading(true);
      const ttData = await timetableAPI.getAll();
      setTimetables(ttData);

      const deptData = await departmentAPI.getAll();
      setDepartments(deptData);
      if (deptData.length > 0) {
        setDepartmentId(deptData[0].id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenGenerateModal = () => {
    setName('');
    if (departments.length > 0) {
      setDepartmentId(departments[0].id.toString());
    } else {
      setDepartmentId('');
    }
    setSemester(3);
    setAcademicYear('2026-2027');
    setWorkingDays(['1', '2', '3', '4', '5']);
    setSlotsPerDay(6);
    setBreaks('');
    setStartTime('08:30');
    setSlotDuration(60);
    setError('');
    setIsModalOpen(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !departmentId || !semester || !academicYear) {
      setError('Please provide all details.');
      return;
    }

    const parsedBreaks = breaks.trim() ? breaks.split(',').map(b => parseInt(b.trim(), 10)) : [];
    const slotsCount = parseInt(slotsPerDay, 10);
    for (const b of parsedBreaks) {
      if (b <= 1 || b >= slotsCount) {
        setError(`Breaks cannot be placed at the start (Period 1) or end (Period ${slotsCount}) of the day. They must be scheduled in the middle.`);
        return;
      }
    }

    setGenerating(true);
    try {
      const response = await timetableAPI.generate({
        name,
        departmentId: parseInt(departmentId, 10),
        semester: parseInt(semester, 10),
        academicYear,
        workingDays: workingDays.join(','),
        slotsPerDay: parseInt(slotsPerDay, 10),
        breaks,
        startTime,
        slotDuration: parseInt(slotDuration, 10)
      });
      setSuccess('Timetable optimized and created successfully!');
      setIsModalOpen(false);
      fetchData();
      // Navigate directly to the newly generated timetable view
      if (response && response.id) {
        navigate(`/timetables/${response.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate timetable. Please verify resource constraints (e.g. faculty workloads).');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Stop navigation click trigger
    if (!window.confirm('Are you sure you want to permanently delete this timetable? This cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await timetableAPI.delete(id);
      setSuccess('Timetable deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete timetable.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetables</h1>
          <p className="page-desc">Generate and view smart optimized schedules</p>
        </div>
        {canGenerate && (
          <button 
            onClick={handleOpenGenerateModal} 
            className="btn btn-primary"
            disabled={departments.length === 0}
          >
            <Sparkles size={18} />
            <span>Generate Timetable</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-banner alert-banner-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="alert-banner alert-banner-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} />
            <span>{success}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {departments.length === 0 && !loading && (
        <div className="alert-banner alert-banner-error" style={{ marginBottom: '24px' }}>
          <span>You must create at least one Department before you can generate schedules.</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading timetables...</div>
        </div>
      ) : timetables.length === 0 ? (
        <div className="glass-card empty-state">
          <Calendar className="empty-state-icon" />
          <h3 className="empty-state-title">No Timetables Generated</h3>
          <p className="empty-state-desc">
            {canGenerate 
              ? 'Get started by running the constraint-programming optimizer to generate your first timetable.' 
              : 'No schedules generated yet.'}
          </p>
          {canGenerate && (
            <button 
              onClick={handleOpenGenerateModal} 
              className="btn btn-outline" 
              style={{ marginTop: '10px' }}
              disabled={departments.length === 0}
            >
              Generate First Timetable
            </button>
          )}
        </div>
      ) : (
        <div className="responsive-grid">
          {timetables.map((tt) => (
            <div 
              key={tt.id} 
              className="glass-card" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}
              onClick={() => navigate(`/timetables/${tt.id}`)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <span className={`badge ${tt.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                    {tt.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(tt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>{tt.name}</h3>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <span className="badge badge-role" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                    {tt.Department ? tt.Department.code : 'N/A'}
                  </span>
                  <span className="badge badge-role" style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#2dd4bf', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                    Semester {tt.semester}
                  </span>
                  <span className="badge badge-role" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                    {tt.academicYear}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 500 }}>
                  <span>View Schedule Grid</span>
                  <ArrowRight size={16} />
                </span>

                {isAdmin && (
                  <button 
                    onClick={(e) => handleDelete(e, tt.id)} 
                    className="btn-icon btn-icon-danger"
                    title="Delete Timetable"
                    style={{ padding: '8px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Schedule Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                <span>Generate Smart Timetable</span>
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label" htmlFor="tt-name">Schedule Title</label>
                <input
                  type="text"
                  id="tt-name"
                  className="form-control"
                  placeholder="e.g. CSE Semester 3 Timetable"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tt-dept">Department</label>
                <select
                  id="tt-dept"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="tt-sem">Semester</label>
                  <input
                    type="number"
                    id="tt-sem"
                    className="form-control"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tt-year">Academic Year</label>
                  <input
                    type="text"
                    id="tt-year"
                    className="form-control"
                    placeholder="e.g. 2026-2027"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Working Days</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {dayOptions.map((opt) => {
                    const isChecked = workingDays.includes(opt.value);
                    return (
                      <label key={opt.value} className="badge" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        padding: '6px 12px',
                        background: isChecked ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                        color: isChecked ? '#60a5fa' : 'var(--text-muted)',
                        borderColor: isChecked ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setWorkingDays(workingDays.filter(d => d !== opt.value));
                            } else {
                              setWorkingDays([...workingDays, opt.value].sort());
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="tt-start-time">Class Start Time</label>
                  <input
                    type="time"
                    id="tt-start-time"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tt-duration">Period Duration (mins)</label>
                  <input
                    type="number"
                    id="tt-duration"
                    className="form-control"
                    min="15"
                    max="180"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="tt-slots">Periods / Day</label>
                  <input
                    type="number"
                    id="tt-slots"
                    className="form-control"
                    min="1"
                    max="10"
                    value={slotsPerDay}
                    onChange={(e) => setSlotsPerDay(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tt-breaks">Break Slots (e.g. 3, 5)</label>
                  <input
                    type="text"
                    id="tt-breaks"
                    className="form-control"
                    placeholder="e.g. 3 for slot 3 break"
                    value={breaks}
                    onChange={(e) => setBreaks(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                * Generating will execute the CP-SAT constraint solver, validating faculty availability, room capacity, and course workload limits.
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? 'Optimizing Schedule...' : 'Generate Optimizer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
