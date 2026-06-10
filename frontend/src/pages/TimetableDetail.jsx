import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle, 
  Archive, 
  Calendar,
  User,
  GraduationCap,
  AlertTriangle,
  X
} from 'lucide-react';
import { timetableAPI, authAPI } from '../services/api';

export default function TimetableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = authAPI.getCurrentUser();
  const canUpdateStatus = currentUser?.role === 'admin' || currentUser?.role === 'scheduler';

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const data = await timetableAPI.getById(id);
      setTimetable(data);
    } catch (err) {
      setError(err.message || 'Failed to load timetable details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!timetable) return;
    setError('');
    setSuccess('');
    const newStatus = timetable.status === 'published' ? 'draft' : 'published';
    try {
      await timetableAPI.updateStatus(timetable.id, newStatus);
      setSuccess(`Timetable status updated to ${newStatus}!`);
      // Update local state
      setTimetable({ ...timetable, status: newStatus });
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleExportCSV = async () => {
    if (!timetable) return;
    setError('');
    try {
      const filename = `${timetable.name.replace(/\s+/g, '_')}_schedule.csv`;
      await timetableAPI.downloadCsv(timetable.id, filename);
      setSuccess('CSV exported successfully!');
    } catch (err) {
      setError(err.message || 'Failed to export CSV.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading timetable details...</div>
      </div>
    );
  }

  if (error || !timetable) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => navigate('/timetables')} className="btn btn-outline" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} />
          <span>Back to Timetables</span>
        </button>
        <div className="alert-banner alert-banner-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error || 'Timetable not found.'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Setup grid parameters
  const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' }
  ];

  const slots = [
    { index: 1, name: 'Period 1', time: '08:30 - 09:30' },
    { index: 2, name: 'Period 2', time: '09:30 - 10:30' },
    { index: 3, name: 'Period 3', time: '10:45 - 11:45' },
    { index: 4, name: 'Period 4', time: '11:45 - 12:45' },
    { index: 5, name: 'Period 5', time: '13:30 - 14:30' },
    { index: 6, name: 'Period 6', time: '14:30 - 15:30' }
  ];

  // Helper to find entry matching day and slot
  const getEntry = (dayVal, slotIndex) => {
    return timetable.TimetableEntries?.find(
      (entry) => entry.dayOfWeek === dayVal && entry.slotIndex === slotIndex
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/timetables')} className="btn btn-outline">
          <ArrowLeft size={16} />
          <span>Back to Timetables</span>
        </button>
      </div>

      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">{timetable.name}</h1>
            <span className={`badge ${timetable.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
              {timetable.status}
            </span>
          </div>
          <div className="timetable-header-meta">
            <span style={{ color: 'var(--text-muted)' }}>
              Dept: <strong>{timetable.Department ? timetable.Department.name : 'N/A'}</strong>
            </span>
            <span style={{ color: 'var(--border-glass-hover)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>
              Semester: <strong>{timetable.semester}</strong>
            </span>
            <span style={{ color: 'var(--border-glass-hover)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>
              Academic Year: <strong>{timetable.academicYear}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignSelf: 'center' }}>
          <button onClick={handleExportCSV} className="btn btn-outline">
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {canUpdateStatus && (
            <button 
              onClick={handleToggleStatus} 
              className={`btn ${timetable.status === 'published' ? 'btn-secondary' : 'btn-primary'}`}
            >
              {timetable.status === 'published' ? (
                <>
                  <Archive size={16} />
                  <span>Revert to Draft</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Publish Schedule</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner-error" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="alert-banner alert-banner-success" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
          <button className="alert-banner-close" onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      {/* Timetable Schedule Grid */}
      <div className="timetable-grid-container">
        <div className="timetable-schedule-grid">
          {/* Header row corner */}
          <div className="timetable-cell timetable-header-cell" style={{ background: 'transparent', borderColor: 'transparent' }}>
            Time Slots
          </div>

          {/* Header row days */}
          {days.map((day) => (
            <div key={day.value} className="timetable-cell timetable-header-cell">
              {day.label}
            </div>
          ))}

          {/* Rows for each slot */}
          {slots.map((slot) => (
            <React.Fragment key={slot.index}>
              {/* Row Header (Time Slot details) */}
              <div className="timetable-cell time-slot-header">
                <span style={{ fontWeight: 700, color: '#fff' }}>{slot.name}</span>
                <span className="slot-time">{slot.time}</span>
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const entry = getEntry(day.value, slot.index);
                
                if (entry) {
                  const isLab = entry.Classroom?.type === 'lab';
                  return (
                    <div 
                      key={`${day.value}-${slot.index}`} 
                      className={`timetable-cell entry-card ${isLab ? 'entry-card-lab' : ''}`}
                    >
                      <div className="entry-subject-code">{entry.Subject?.code}</div>
                      <div className="entry-subject-name" title={entry.Subject?.name}>{entry.Subject?.name}</div>
                      
                      <div className="entry-meta-item">
                        <User className="entry-meta-icon" />
                        <span>{entry.Faculty?.name}</span>
                      </div>
                      
                      <div className="entry-meta-item">
                        <GraduationCap className="entry-meta-icon" />
                        <span>{entry.Classroom?.name} ({entry.Classroom?.capacity})</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div 
                      key={`${day.value}-${slot.index}`} 
                      className="timetable-cell entry-empty"
                    >
                      Free Period
                    </div>
                  );
                }
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
