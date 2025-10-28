import React from 'react';
import '../App.css';
import './FileUpload.css';

function FileUpload({ onFilesUpload, onProcess, isProcessing, projectCount, uploadedProjects, onRemoveProject }) {
  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFilesUpload(files);
      e.target.value = ''; // Reset input
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-info">⏳ Připraveno</span>;
      case 'converted':
        return <span className="badge badge-success">✅ Konvertováno</span>;
      case 'completed':
        return <span className="badge badge-success">✅ Hotovo</span>;
      case 'error':
        return <span className="badge badge-danger">❌ Chyba</span>;
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>📁</span>
        <h2>Nahrání Dokumentů</h2>
      </div>
      <div className="card-content">
        <div className="info-box">
          💡 <strong>Tip:</strong> Nahrajte PDF soubory pro analýzu urbanistických projektů.
        </div>

        <div className="file-upload-wrapper">
          <input
            type="file"
            id="fileInput"
            accept=".pdf"
            multiple
            onChange={handleFileInput}
            className="file-input"
          />
          <label htmlFor="fileInput" className="file-label">
            📁 Vybrat PDF soubory
          </label>
        </div>

        {uploadedProjects.length > 0 && (
          <div className="projects-list">
            <h3 style={{ marginBottom: '15px', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Nahrané soubory ({uploadedProjects.length})
            </h3>
            {uploadedProjects.map((project) => (
              <div key={project.id} className="project-item">
                <div className="project-info">
                  <span className="project-name">📄 {project.name}</span>
                  <span className="project-size">
                    {(project.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="project-actions">
                  {getStatusBadge(project.status)}
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => onRemoveProject(project.id)}
                    disabled={isProcessing}
                  >
                    🗑️ Odstranit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn btn-success"
          onClick={onProcess}
          disabled={isProcessing || projectCount === 0}
          style={{ marginTop: projectCount > 0 ? '15px' : '0', width: projectCount > 0 ? '100%' : 'auto' }}
        >
          {isProcessing ? (
            <>
              ⏳ Zpracovávám... <span className="loading-spinner"></span>
            </>
          ) : (
            <>🚀 Zpracovat {projectCount > 0 ? `${projectCount} soubor(ů)` : 'soubory'}</>
          )}
        </button>
      </div>
    </div>
  );
}

export default FileUpload;

