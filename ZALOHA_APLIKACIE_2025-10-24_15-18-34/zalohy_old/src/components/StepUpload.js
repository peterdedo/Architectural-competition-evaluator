import React, { useState, useCallback } from 'react';

const StepUpload = ({ onNext, onBack, onFilesUpload, projects = [] }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleFileUpload = useCallback((files) => {
    const projectNames = [];
    const projectImages = [];

    Array.from(files).forEach(file => {
      projectNames.push(file.name.replace('.pdf', ''));
      projectImages.push(null);
    });

    onFilesUpload(files, projectNames, projectImages);
  }, [onFilesUpload]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'converted': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Připraveno';
      case 'converted': return 'Zpracovává se';
      case 'completed': return 'Hotovo';
      case 'error': return 'Chyba';
      default: return 'Neznámý';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'converted': return 'badge-info';
      case 'completed': return 'badge-success';
      case 'error': return 'badge-error';
      default: return 'badge-info';
    }
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">📁</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Nahrání Projektů</h2>
            <p className="text-indigo-100 text-sm">Nahrajte PDF dokumenty pro analýzu</p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Tip pro nahrávání</h4>
              <p className="text-blue-700 text-sm">
                Nahrajte PDF dokumenty projektů pro analýzu. Podporujeme více souborů najednou.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="upload-area" 
             onDragEnter={handleDrag}
             onDragLeave={handleDrag}
             onDragOver={handleDrag}
             onDrop={handleDrop}>
          <input
            type="file"
            id="projectFiles"
            accept=".pdf"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <label htmlFor="projectFiles" className="cursor-pointer">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Klikněte pro nahrání PDF projektů
              </h3>
              <p className="text-slate-500 mb-4">
                nebo přetáhněte soubory sem
              </p>
              <div className="btn btn-secondary">
                <span className="text-lg">📁</span>
                Vybrat soubory
              </div>
            </div>
          </label>
        </div>

        {/* Projects List */}
        {projects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Nahrané projekty ({projects.length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{getStatusIcon(project.status)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{project.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {(project.file.size / 1024).toFixed(1)} KB
                        </span>
                        <span className={`badge ${getStatusClass(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                      
                      {project.status === 'error' && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                          ❌ Chyba při zpracování
                        </div>
                      )}
                      
                      {project.status === 'completed' && (
                        <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">
                          ✅ Úspěšně zpracováno
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="btn btn-secondary" onClick={() => onBack('config')}>
            ← Zpět na Konfiguraci
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onNext('criteria')}
            disabled={projects.length === 0}
          >
            Pokračovat na Výběr Kritérií
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepUpload;