import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Download, 
  Loader2, 
  CheckCircle,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import html2canvas from 'html2canvas';
import RadarChartAdvanced from './RadarChartAdvanced';

const ExpandableRadarChart = ({ data, indicators, weights = {}, title = "Expandovatelný radarový graf" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const chartRef = useRef(null);

  // Vyčistíme názvy návrhov pred predaním do RadarChartAdvanced
  const cleanedData = useMemo(() => {
    if (!data) return [];
    
    return data.map(navrh => {
      let cleanName = navrh.nazev;
      if (cleanName.includes('_EON_')) {
        cleanName = cleanName.split('_EON_')[0];
      }
      if (cleanName.includes('_bilance_sheet_')) {
        cleanName = cleanName.split('_bilance_sheet_')[0];
      }
      if (cleanName.includes(' ftze')) {
        cleanName = cleanName.replace(' ftze', '');
      }
      
      return {
        ...navrh,
        nazev: cleanName
      };
    });
  }, [data]);

  // Stažení grafu jako PNG
  const handleDownload = async () => {
    if (!chartRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Vysoké rozlišení (2x)
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 1200,
        height: 800
      });

      const link = document.createElement('a');
      const timestamp = new Date().toLocaleString('cs-CZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/[\s:\/]/g, '-');
      
      link.href = canvas.toDataURL('image/png');
      link.download = `radar-chart-${timestamp}.png`;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Chyba při stahování grafu:', error);
      alert('Chyba při stahování grafu');
    } finally {
      setIsDownloading(false);
    }
  };

  // Kompaktní režim (na hlavní stránce)
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[#0066A4]" />
            <h3 className="text-lg font-semibold text-[#0066A4]">Radarový graf</h3>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            title="Rozbalit graf do modálu"
          >
            <Maximize2 size={18} />
            Rozbalit
          </button>
        </div>

        {/* Náhled grafu v kompaktním režimu */}
        <div className="h-80 w-full" ref={chartRef}>
          <RadarChartAdvanced
            data={cleanedData}
            indicators={indicators}
            weights={weights}
          />
        </div>
      </motion.div>
    );
  }

  // Expandovaný modal
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? 'bg-black' : 'bg-black/50 backdrop-blur-sm'}`}
        onClick={() => !isFullscreen && setIsExpanded(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-white rounded-xl shadow-2xl flex flex-col ${
            isFullscreen 
              ? 'fixed inset-0 rounded-none' 
              : 'w-11/12 h-5/6 max-w-6xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white px-8 py-6 flex items-center justify-between rounded-t-xl" 
               style={isFullscreen ? { borderRadius: 0 } : {}}>
            <div className="flex items-center gap-3">
              <BarChart3 size={24} />
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-white/80 text-sm">Interaktivní radarový graf s možností rozšíření</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Download button */}
              <motion.button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  downloadSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } disabled:opacity-50`}
                whileHover={!isDownloading ? { scale: 1.05 } : {}}
                whileTap={!isDownloading ? { scale: 0.95 } : {}}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Stahování...
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle size={18} />
                    Staženo!
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Stáhnout PNG
                  </>
                )}
              </motion.button>

              {/* Fullscreen toggle */}
              <motion.button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isFullscreen ? 'Normální režim' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 size={18} />
                ) : (
                  <Maximize2 size={18} />
                )}
              </motion.button>

              {/* Close button */}
              <motion.button
                onClick={() => {
                  setIsExpanded(false);
                  setIsFullscreen(false);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Zavřít"
              >
                <X size={18} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-auto bg-gray-50 p-6 md:p-8 flex flex-col`}>
            {/* Expandovaný graf */}
            <div 
              ref={chartRef}
              className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 180px)' : '500px' }}
            >
              <RadarChartAdvanced
                data={cleanedData}
                indicators={indicators}
                weights={weights}
              />
            </div>

            {/* Footer se statistikou */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Návrhů k porovnání</p>
                <p className="text-2xl font-bold text-[#0066A4]">{cleanedData?.length || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Indikátorů</p>
                <p className="text-2xl font-bold text-[#4BB349]">{indicators?.length || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Datových bodů</p>
                <p className="text-2xl font-bold text-purple-600">{(cleanedData?.length || 0) * (indicators?.length || 0)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Režim</p>
                <p className="text-2xl font-bold text-orange-600">{isFullscreen ? 'Fullscreen' : 'Modální'}</p>
              </div>
            </motion.div>
          </div>

          {/* Footer notice */}
          <div className="bg-gray-100 px-8 py-4 text-sm text-gray-600 border-t border-gray-200 rounded-b-xl" 
               style={isFullscreen ? { borderRadius: 0 } : {}}>
            💡 Tip: Použij Download tlačítko pro uložení grafu jako PNG obrázek v plném rozlišení
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExpandableRadarChart;
