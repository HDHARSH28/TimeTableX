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

  // Setup dynamic grid parameters based on Timetable configuration
  const dayLabels = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday'
  };

  const activeWorkingDays = timetable.workingDays 
    ? timetable.workingDays.split(',').map(d => parseInt(d, 10)) 
    : [1, 2, 3, 4, 5];

  const days = activeWorkingDays.map(val => ({
    value: val,
    label: dayLabels[val] || `Day ${val}`
  }));

  const totalPeriods = timetable.slotsPerDay || 6;
  const breaksList = timetable.breaks 
    ? timetable.breaks.split(',').map(b => parseInt(b, 10)) 
    : [];

  const startTimeStr = timetable.startTime || '08:30';
  const parts = startTimeStr.split(':');
  const startHour = isNaN(parseInt(parts[0], 10)) ? 8 : parseInt(parts[0], 10);
  const startMin = isNaN(parseInt(parts[1], 10)) ? 30 : parseInt(parts[1], 10);
  const duration = timetable.slotDuration || 60;

  const formatTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const getTimeForPeriod = (pIndex) => {
    const startTotalMinutes = startHour * 60 + startMin + (pIndex - 1) * duration;
    const endTotalMinutes = startTotalMinutes + duration;
    return `${formatTime(startTotalMinutes)} - ${formatTime(endTotalMinutes)}`;
  };

  const slots = [];
  for (let i = 1; i <= totalPeriods; i++) {
    slots.push({
      index: i,
      name: breaksList.includes(i) ? 'BREAK' : `Period ${i}`,
      time: getTimeForPeriod(i),
      isBreak: breaksList.includes(i)
    });
  }

  // Helper to find entries matching day and slot
  const getEntries = (dayVal, slotIndex) => {
    return timetable.TimetableEntries?.filter(
      (entry) => entry.dayOfWeek === dayVal && entry.slotIndex === slotIndex
    ) || [];
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
        <div className="timetable-schedule-grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, minmax(180px, 1fr))` }}>
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
              <div 
                className="timetable-cell time-slot-header" 
                style={slot.isBreak ? { minHeight: '60px', borderLeftColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)' } : {}}
              >
                <span style={{ fontWeight: 700, color: slot.isBreak ? 'var(--warning)' : '#fff' }}>{slot.name}</span>
                <span className="slot-time">{slot.time}</span>
              </div>

              {slot.isBreak ? (
                <div 
                  className="timetable-cell break-cell animate-fade-in"
                  style={{ 
                    gridColumn: `span ${days.length}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(245, 158, 11, 0.03)', 
                    borderColor: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--warning)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '0.2em',
                    minHeight: '60px',
                    boxShadow: 'inset 0 0 12px rgba(245, 158, 11, 0.02)',
                    textShadow: '0 0 8px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  ☕ RECESS / LUNCH BREAK
                </div>
              ) : (
                days.map((day) => {
                  const entries = getEntries(day.value, slot.index);
                  
                  if (entries.length > 0) {
                    return (
                      <div 
                        key={`${day.value}-${slot.index}`} 
                        className="timetable-cell entries-cell"
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', minHeight: '100px' }}
                      >
                        {entries.map((entry, entryIdx) => {
                          const isLab = entry.Classroom?.type === 'lab';
                          return (
                            <div 
                              key={entry.id || entryIdx} 
                              className={`entry-card ${isLab ? 'entry-card-lab' : ''}`}
                              style={{ width: '100%', margin: 0 }}
                            >
                              <div className="entry-subject-code">
                                {entry.Subject?.code}{entry.batch ? `: ${entry.batch}` : ''}
                              </div>
                              <div className="entry-subject-name" title={entry.Subject?.name}>
                                {entry.Subject?.name}
                              </div>
                              
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
                        })}
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
                })
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
