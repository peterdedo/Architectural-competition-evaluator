import React, { useState, useCallback } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { usePdfProcessor } from '../hooks/usePdfProcessor';
import { useToast } from '../hooks/useToast';

const StepUpload = () => {
  const { projects, setProjects, addProject, updateProject, setStep } = useWizard();
  const { processMultiplePdfs, isProcessing, progress } = usePdfProcessor();
  const { showToast } = useToast();
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
  }, []);

  const handleFileUpload = useCallback((files) => {
    const newProjects = Array.from(files).map((file, index) => ({
      id: Date.now() + Math.random() + index,
      name: file.name.replace('.pdf', ''),
      file: file,
      status: 'pending',
      selected: false,
      images: [],
      progress: 0
    }));
    
    setProjects([...projects, ...newProjects]);
    showToast(`Nahrané ${newProjects.length} projektov`, 'success');
  }, [projects, setProjects, showToast]);

  const handleProcessAll = async () => {
    const pendingProjects = projects.filter(p => p.status === 'pending');
    if (pendingProjects.length === 0) {
      showToast('Žiadne projekty na spracovanie', 'warning');
      return;
    }

    const files = pendingProjects.map(p => p.file);
    const results = await processMultiplePdfs(files);

    results.forEach((result, index) => {
      const project = pendingProjects[index];
      if (result.success) {
        updateProject(project.id, {
          status: 'completed',
          images: result.images,
          totalPages: result.totalPages,
          processedPages: result.processedPages
        });
      } else {
        updateProject(project.id, {
          status: 'error',
          error: result.error
        });
      }
    });

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

    if (errorCount > 0) {
      showToast(`Spracovanie dokončené s ${errorCount} chybami. Úspešných: ${successCount}`, 'warning');
    } else {
      showToast(`Spracovanie dokončené! Všetkých ${successCount} projektov úspešne spracovaných.`, 'success');
    }
  };

  const handleProjectToggle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      updateProject(projectId, { selected: !project.selected });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pripravené';
      case 'processing': return 'Spracováva sa';
      case 'completed': return 'Hotové';
      case 'error': return 'Chyba';
      default: return 'Neznámy';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'processing': return 'badge-info';
      case 'completed': return 'badge-success';
      case 'error': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const SkeletonCard = () => (
    <div className="project-card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="skeleton w-6 h-6 rounded"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="skeleton h-4 w-3/4 rounded mb-2"></div>
          <div className="skeleton h-3 w-1/2 rounded mb-2"></div>
          <div className="skeleton h-6 w-16 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">📁</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Nahrávanie Projektov</h2>
            <p className="text-indigo-100 text-sm">Nahrajte PDF dokumenty pre analýzu</p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Tip pre nahrávanie</h4>
              <p className="text-blue-700 text-sm">
                Nahrajte PDF dokumenty projektov pre analýzu. Podporujeme viacero súborov naraz.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className={`upload-area ${dragActive ? 'drag-active' : ''}`}
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
                Kliknite pre nahrávanie PDF projektov
              </h3>
              <p className="text-slate-500 mb-4">
                alebo pretiahnite súbory sem
              </p>
              <div className="btn btn-secondary">
                <span className="text-lg">📁</span>
                Vybrať súbory
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
              <button 
                className="btn btn-primary"
                onClick={handleProcessAll}
                disabled={isProcessing || projects.every(p => p.status === 'completed')}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner w-4 h-4"></div>
                    Spracováva sa... ({Math.round(progress)}%)
                  </>
                ) : (
                  <>
                    <span className="text-lg">🚀</span>
                    Spracovať všetky
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className={`project-card ${project.selected ? 'selected' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={project.selected || false}
                      onChange={() => handleProjectToggle(project.id)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
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
                          ❌ Chyba pri spracovaní
                        </div>
                      )}
                      
                      {project.status === 'completed' && (
                        <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">
                          ✅ Úspešne spracované ({project.processedPages} strán)
                        </div>
                      )}

                      {/* Preview obrázky */}
                      {project.images && project.images.filter(img => img.preview).length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {project.images.filter(img => img.preview).map((img, idx) => (
                            <img
                              key={idx}
                              src={`data:image/png;base64,${img.imageData}`}
                              alt={`Strana ${img.pageNumber}`}
                              className="w-8 h-8 rounded object-cover border border-slate-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skeleton Loading */}
        {isProcessing && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Spracováva sa...</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="btn btn-secondary" onClick={() => setStep('config')}>
            ← Späť na Konfiguráciu
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setStep('criteria')}
            disabled={projects.length === 0}
          >
            Pokračovať na Výber Kritérií
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepUpload;
