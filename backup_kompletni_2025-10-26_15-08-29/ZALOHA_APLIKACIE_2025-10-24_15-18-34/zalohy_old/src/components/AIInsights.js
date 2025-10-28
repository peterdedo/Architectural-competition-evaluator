import React from 'react';

const AIInsights = ({ projects, criteria, selectedCriteria }) => {
  const selectedProjects = projects.filter(p => p.selected);
  
  if (selectedProjects.length === 0) {
    return null;
  }

  // Jednoduché statistiky
  const getProjectStats = (project) => {
    const indicators = project.extractedData?.indicators || {};
    const values = Object.values(indicators).filter(v => v.value !== null);
    return {
      totalIndicators: Object.keys(indicators).length,
      filledIndicators: values.length,
      completionRate: values.length / Math.max(Object.keys(indicators).length, 1) * 100
    };
  };

  const insights = selectedProjects.map(project => ({
    ...project,
    stats: getProjectStats(project)
  }));

  const getCompletionColor = (rate) => {
    if (rate >= 80) return 'text-success-600 bg-success-50 border-success-200';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCompletionText = (rate) => {
    if (rate >= 80) return 'Výborně';
    if (rate >= 60) return 'Dobře';
    return 'Potřebuje vylepšení';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Insights</h2>
            <p className="text-primary-100 text-sm">Automatická analýza a doporučení</p>
          </div>
        </div>
      </div>
      
      <div className="card-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map(project => (
            <div key={project.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📄</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-500">
                      {(project.file?.size / 1024 || 0).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getCompletionColor(project.stats.completionRate)}`}>
                  {getCompletionText(project.stats.completionRate)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dokončení analýzy</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(project.stats.completionRate)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-success-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.stats.completionRate}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">
                      {project.stats.filledIndicators}
                    </div>
                    <div className="text-xs text-gray-500">Vyplněno</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {project.stats.totalIndicators}
                    </div>
                    <div className="text-xs text-gray-500">Celkem</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`badge ${
                      project.status === 'completed' ? 'badge-success' :
                      project.status === 'converted' ? 'badge-info' :
                      project.status === 'error' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {project.status === 'completed' && '✅ Hotovo'}
                      {project.status === 'converted' && '🔄 Zpracovává se'}
                      {project.status === 'error' && '❌ Chyba'}
                      {project.status === 'pending' && '⏳ Připraveno'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {insights.length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">💡</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Doporučení</h4>
                <p className="text-blue-700 text-sm">
                  Pro lepší porovnání doporučujeme vybrat projekty s podobnou úrovní dokončení analýzy.
                  Projekty s vyšším procentem vyplněných kritérií poskytují přesnější výsledky.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;