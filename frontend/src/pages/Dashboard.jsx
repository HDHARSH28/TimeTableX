import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  Layers,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { dashboardAPI, departmentAPI } from '../services/api';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [deptCount, setDeptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardAPI.getAnalytics();
        setAnalytics(data);

        // Fetch departments to get the count
        const depts = await departmentAPI.getAll();
        setDeptCount(depts.length);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading analytics dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-banner alert-banner-error" style={{ margin: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const totals = analytics?.totals || { faculty: 0, classrooms: 0, subjects: 0, timetables: 0 };
  const utilization = analytics?.classroomUtilization || [];

  const statItems = [
    { label: 'Departments', value: deptCount, icon: Building2, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
    { label: 'Faculty Members', value: totals.faculty, icon: Users, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.3)' },
    { label: 'Registered Classrooms', value: totals.classrooms, icon: GraduationCap, color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.3)' },
    { label: 'Active Subjects', value: totals.subjects, icon: BookOpen, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
    { label: 'Generated Schedules', value: totals.timetables, icon: Calendar, color: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-desc">System statistics and resources utilization analytics</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        {statItems.map((item, index) => (
          <div key={index} className="glass-card stat-card">
            <div 
              className="stat-icon-wrapper" 
              style={{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.glow}` }}
            >
              <item.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{item.value}</span>
              <span className="stat-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Classroom Utilization Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Activity style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Classroom Utilization</h2>
        </div>

        {utilization.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No classrooms registered to compute utilization metrics.
          </div>
        ) : (
          <div className="responsive-grid">
            {utilization.map((room) => {
              // Color-coding based on rate
              let barColor = 'var(--secondary)'; // Cyan
              if (room.utilizationRate > 80) barColor = 'var(--error)'; // Red (overworked)
              else if (room.utilizationRate > 50) barColor = 'var(--warning)'; // Amber

              return (
                <div key={room.id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>{room.name}</h3>
                      <span className="badge badge-role" style={{ fontSize: '0.65rem', marginTop: '6px' }}>
                        {room.type} (Cap: {room.capacity})
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                        {room.utilizationRate}%
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>utilization</p>
                    </div>
                  </div>

                  <div className="progress-container">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${room.utilizationRate}%`, 
                          backgroundColor: barColor,
                          boxShadow: `0 0 10px ${barColor}`
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{room.scheduledSlots} slots assigned</span>
                      <span>30 slots max per schedule</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
