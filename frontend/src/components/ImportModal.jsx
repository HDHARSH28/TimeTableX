import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertTriangle, CheckCircle, Info, Loader } from 'lucide-react';
import { importAPI } from '../services/api';

// Robust state-machine CSV parser that handles double quotes and commas within quotes
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        // Escaped quote
        row[row.length - 1] += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

export default function ImportModal({ isOpen, onClose, onSuccess, type }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Completed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Configuration based on type
  const config = {
    departments: {
      title: 'Departments',
      templateHeaders: ['name', 'code'],
      templateRows: [
        ['Computer Science & Engineering', 'CSE'],
        ['Electrical Engineering', 'EE'],
        ['Mechanical Engineering', 'ME']
      ],
      validateRow: (row) => {
        const errors = [];
        if (!row.name || !row.name.trim()) errors.push('Name is required');
        if (!row.code || !row.code.trim()) errors.push('Code is required');
        return errors;
      }
    },
    classrooms: {
      title: 'Classrooms',
      templateHeaders: ['name', 'capacity', 'type'],
      templateRows: [
        ['Room 101', '60', 'classroom'],
        ['Advanced Lab 301', '35', 'lab'],
        ['Room 102', '50', 'classroom']
      ],
      validateRow: (row) => {
        const errors = [];
        if (!row.name || !row.name.trim()) errors.push('Name is required');
        
        const cap = parseInt(row.capacity, 10);
        if (isNaN(cap) || cap <= 0) {
          errors.push('Capacity must be a positive integer');
        }
        
        const t = row.type?.trim()?.toLowerCase();
        if (t !== 'classroom' && t !== 'lab') {
          errors.push('Type must be "classroom" or "lab"');
        }
        return errors;
      }
    },
    faculty: {
      title: 'Faculty Members',
      templateHeaders: ['name', 'email', 'maxClassesPerDay', 'departmentCode'],
      templateRows: [
        ['Dr. Alan Turing', 'turing@cse.edu', '3', 'CSE'],
        ['Dr. Grace Hopper', 'hopper@cse.edu', '3', 'CSE'],
        ['Dr. Claude Shannon', 'shannon@ee.edu', '4', 'EE']
      ],
      validateRow: (row) => {
        const errors = [];
        if (!row.name || !row.name.trim()) errors.push('Name is required');
        if (!row.email || !row.email.trim()) {
          errors.push('Email is required');
        } else if (!row.email.includes('@')) {
          errors.push('Invalid email address format');
        }
        
        const maxCl = parseInt(row.maxClassesPerDay, 10);
        if (isNaN(maxCl) || maxCl < 1 || maxCl > 10) {
          errors.push('maxClassesPerDay must be a number between 1 and 10');
        }
        
        if (!row.departmentCode || !row.departmentCode.trim()) {
          errors.push('departmentCode is required');
        }
        return errors;
      }
    },
    subjects: {
      title: 'Subjects / Courses',
      templateHeaders: ['name', 'code', 'classesPerWeek', 'semester', 'type', 'departmentCode', 'facultyEmails'],
      templateRows: [
        ['Data Structures & Algorithms', 'CS301', '4', '3', 'theory', 'CSE', 'turing@cse.edu;hopper@cse.edu'],
        ['Object Oriented Programming', 'CS302', '4', '3', 'theory', 'CSE', 'turing@cse.edu'],
        ['Signals & Systems', 'EE301', '4', '3', 'theory', 'EE', 'shannon@ee.edu']
      ],
      validateRow: (row) => {
        const errors = [];
        if (!row.name || !row.name.trim()) errors.push('Name is required');
        if (!row.code || !row.code.trim()) errors.push('Code is required');
        
        const cpw = parseInt(row.classesPerWeek, 10);
        if (isNaN(cpw) || cpw < 1 || cpw > 10) {
          errors.push('classesPerWeek must be a number between 1 and 10');
        }
        
        const sem = parseInt(row.semester, 10);
        if (isNaN(sem) || sem < 1 || sem > 8) {
          errors.push('semester must be a number between 1 and 8');
        }

        const t = row.type?.trim()?.toLowerCase() || 'theory';
        if (t !== 'theory' && t !== 'lab' && t !== 'tutorial' && t !== 'both') {
          errors.push('Type must be either "theory", "lab", "tutorial", or "both"');
        }
        
        if (!row.departmentCode || !row.departmentCode.trim()) {
          errors.push('departmentCode is required');
        }
        return errors;
      }
    }
  }[type];

  const handleDownloadTemplate = () => {
    const csvContent = [
      config.templateHeaders.join(','),
      ...config.templateRows.map(row => row.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      processFile(selectedFile);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const csvRows = parseCSV(text);
        if (csvRows.length === 0) {
          setError('The uploaded CSV file is empty.');
          return;
        }

        // Clean headers and rows
        const rawHeaders = csvRows[0].map(h => h.trim().toLowerCase());
        
        // Validate headers are present
        const missingHeaders = config.templateHeaders.filter(th => !rawHeaders.includes(th));
        if (missingHeaders.length > 0) {
          setError(`Missing required CSV columns: ${missingHeaders.join(', ')}.`);
          return;
        }

        setHeaders(rawHeaders);

        // Map data rows
        const items = [];
        const errors = [];

        for (let i = 1; i < csvRows.length; i++) {
          const cells = csvRows[i];
          // Skip empty trailing rows
          if (cells.length === 1 && cells[0].trim() === '') continue;

          const rowData = {};
          rawHeaders.forEach((header, index) => {
            rowData[header] = cells[index] !== undefined ? cells[index].trim() : '';
          });

          // Validate row client-side
          const rowErrors = config.validateRow(rowData);
          if (rowErrors.length > 0) {
            errors.push({ rowNumber: i + 1, errorMessages: rowErrors });
          }

          items.push(rowData);
        }

        if (items.length === 0) {
          setError('No data rows found in the CSV file.');
          return;
        }

        setParsedData(items);
        setValidationErrors(errors);
        setStep(2);
      } catch (err) {
        setError('Error reading or parsing file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await importAPI[type](parsedData);
      if (response.success) {
        setStep(3);
        if (onSuccess) onSuccess();
      } else {
        setError(response.message || 'Import failed. Please verify data requirements.');
      }
    } catch (err) {
      setError(err.message || 'Server error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setStep(1);
    setLoading(false);
    setError('');
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-container" style={{ maxWidth: step === 2 ? '900px' : '550px', width: '90%' }}>
        <div className="modal-header">
          <h2 className="modal-title">Bulk Import {config.title}</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Upload File */}
        {step === 1 && (
          <div style={{ padding: '20px' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
              Import {config.title.toLowerCase()} in bulk from a CSV spreadsheet. Download the template below to ensure the formatting matches our system guidelines.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button onClick={handleDownloadTemplate} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Download size={16} />
                <span>Download CSV Template</span>
              </button>
            </div>

            <div 
              onClick={() => fileInputRef.current.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && droppedFile.name.endsWith('.csv')) {
                  setFile(droppedFile);
                  processFile(droppedFile);
                } else {
                  setError('Please upload a valid .csv file.');
                }
              }}
            >
              <Upload size={36} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Click to upload</span> or drag and drop
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CSV file only</div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
            </div>

            {error && (
              <div className="alert-banner alert-banner-error" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview & Validation */}
        {step === 2 && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600 }}>File:</span> {file?.name} ({parsedData.length} records parsed)
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="btn btn-outline" 
                disabled={loading}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                Upload Different File
              </button>
            </div>

            {validationErrors.length > 0 && (
              <div className="alert-banner alert-banner-error" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <AlertTriangle size={18} />
                  <span>Found {validationErrors.length} validation issues!</span>
                </div>
                <ul style={{ paddingLeft: '24px', fontSize: '13px', margin: 0, maxHeight: '80px', overflowY: 'auto' }}>
                  {validationErrors.map((vErr, idx) => (
                    <li key={idx}>
                      Line {vErr.rowNumber}: {vErr.errorMessages.join(', ')}
                    </li>
                  ))}
                </ul>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>You can still attempt importing, but rows with errors will likely fail database insertion.</span>
              </div>
            )}

            {error && (
              <div className="alert-banner alert-banner-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Info size={16} />
              <span>Rows matching existing database IDs will automatically overwrite/update.</span>
            </div>

            <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                    {config.templateHeaders.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, idx) => {
                    const rowHasError = validationErrors.some(v => v.rowNumber === idx + 2);
                    return (
                      <tr key={idx} style={rowHasError ? { backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 2}</td>
                        {config.templateHeaders.map((header) => (
                          <td 
                            key={header} 
                            style={{ 
                              fontSize: '13px',
                              color: row[header] ? 'inherit' : 'var(--text-muted)',
                              fontStyle: row[header] ? 'normal' : 'italic'
                            }}
                          >
                            {row[header] || 'empty'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleImportSubmit} 
                className="btn btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Commit Import</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Completed */}
        {step === 3 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle size={54} style={{ color: '#10b981' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Data Imported Successfully!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                Successfully synced {parsedData.length} records into the {config.title.toLowerCase()} database.
              </p>
            </div>
            <button onClick={handleClose} className="btn btn-primary" style={{ marginTop: '10px', width: '120px' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
