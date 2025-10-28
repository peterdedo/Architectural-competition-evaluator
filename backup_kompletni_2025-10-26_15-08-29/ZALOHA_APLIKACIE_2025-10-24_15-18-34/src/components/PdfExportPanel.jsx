import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';
import usePdfExport from '../hooks/usePdfExport';

const PdfExportPanel = ({ isOpen, onClose, data }) => {
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeTable: true,
    includeSummary: true,
    includeComments: false,
    pageOrientation: 'portrait',
    quality: 'high'
  });

  const { generatePdfReport, isExporting, exportProgress } = usePdfExport();

  const handleExport = async () => {
    const result = await generatePdfReport({
      ...data,
      options: exportOptions
    });

    if (result.success) {
      // Zobrazíme success notifikáciu
      console.log('PDF export successful:', result.fileName);
    } else {
      // Zobrazíme error notifikáciu
      console.error('PDF export failed:', result.error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Download size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Export do PDF</h2>
                  <p className="text-white/80">Generování profesionálního reportu</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Progress bar */}
            {isExporting && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span className="font-medium text-gray-900">Generování PDF...</span>
                  <span className="text-sm text-gray-500">{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${exportProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Náhled dat</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shrnutí */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-600" />
                    Shrnutí
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Návrhy:</span>
                      <span className="font-medium">{data.navrhy?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Indikátory:</span>
                      <span className="font-medium">{data.indicators?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Typ zobrazení:</span>
                      <span className="font-medium capitalize">{data.viewType || 'tabulka'}</span>
                    </div>
                  </div>
                </div>

                {/* Najlepšie skóre */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target size={18} className="text-green-600" />
                    Nejlepší návrh
                  </h4>
                  {data.navrhy && data.navrhy.length > 0 ? (
                    (() => {
                      const bestNavrh = data.navrhy.reduce((best, current) => 
                        (current.weightedScore || 0) > (best.weightedScore || 0) ? current : best
                      );
                      return (
                        <div>
                          <div className="font-medium text-gray-900 mb-1">{bestNavrh.nazev}</div>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(bestNavrh.weightedScore || 0)}`}>
                            {bestNavrh.weightedScore || 0}%
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-gray-500 text-sm">Žádné data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Export options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-gray-600" />
                Možnosti exportu
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Zahrnout grafy</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTable}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeTable: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Zahrnout tabulku</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSummary}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Zahrnout shrnutí</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientace stránky
                    </label>
                    <select
                      value={exportOptions.pageOrientation}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, pageOrientation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="portrait">Na výšku</option>
                      <option value="landscape">Na šířku</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kvalita
                    </label>
                    <select
                      value={exportOptions.quality}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, quality: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Nízká (rychlejší)</option>
                      <option value="medium">Střední</option>
                      <option value="high">Vysoká (pomalejší)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <motion.button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isExporting}
              >
                Zrušit
              </motion.button>
              
              <motion.button
                onClick={handleExport}
                disabled={isExporting || !data.navrhy || data.navrhy.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isExporting ? 1 : 1.05 }}
                whileTap={{ scale: isExporting ? 1 : 0.95 }}
              >
                {isExporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generování...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Exportovat PDF
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfExportPanel;
