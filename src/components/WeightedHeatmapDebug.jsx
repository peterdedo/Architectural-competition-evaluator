import React, { useMemo, useEffect, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWizard } from '../contexts/WizardContext';

// Zaregistrujeme potřebné komponenty pro echarts
echarts.use([HeatmapChart, GridComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);

const WeightedHeatmapDebug = ({ 
  vybraneNavrhyData = [], 
  vybraneIndikatoryList = [], 
  vahy = {}, 
  categoryWeights = {} 
}) => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Napojenie na globálny stav z WizardContext
  let globalWeights = vahy;
  let globalCategoryWeights = categoryWeights;
  let results = [];
  
  try {
    const wizardContext = useWizard();
    globalWeights = wizardContext.weights || vahy;
    globalCategoryWeights = wizardContext.categoryWeights || categoryWeights;
    results = wizardContext.results || [];
  } catch (error) {
    console.warn('WizardContext nie je dostupný v WeightedHeatmapDebug');
  }

  // Debug informácie
  useEffect(() => {
    setDebugInfo({
      vybraneNavrhyData: vybraneNavrhyData?.length || 0,
      vybraneIndikatoryList: vybraneIndikatoryList?.length || 0,
      globalWeights: Object.keys(globalWeights).length,
      globalCategoryWeights: Object.keys(globalCategoryWeights).length,
      results: results?.length || 0
    });
    setIsLoading(false);
  }, [vybraneNavrhyData, vybraneIndikatoryList, globalWeights, globalCategoryWeights, results]);

  // Vyčistíme názvy návrhov
  const cleanedNavrhyData = useMemo(() => {
    if (!vybraneNavrhyData) return [];
    
    return vybraneNavrhyData.map(navrh => {
      let cleanName = navrh.nazev || navrh.name || 'Neznámý návrh';
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
  }, [vybraneNavrhyData]);

  // Generovanie mock dát pre testovanie
  const generateMockData = () => {
    const mockData = [];
    const indicators = vybraneIndikatoryList.length > 0 ? vybraneIndikatoryList : [
      { id: 'mock1', nazev: 'Mock Indikátor 1', kategorie: 'Mock Kategória' },
      { id: 'mock2', nazev: 'Mock Indikátor 2', kategorie: 'Mock Kategória' },
      { id: 'mock3', nazev: 'Mock Indikátor 3', kategorie: 'Mock Kategória' }
    ];
    const projects = cleanedNavrhyData.length > 0 ? cleanedNavrhyData : [
      { id: 'mock1', nazev: 'Mock Projekt 1', data: {} },
      { id: 'mock2', nazev: 'Mock Projekt 2', data: {} }
    ];

    indicators.forEach((indikator, indicatorIndex) => {
      projects.forEach((project, projectIndex) => {
        const mockValue = Math.random() * 100;
        mockData.push({
          x: indicatorIndex,
          y: projectIndex,
          value: mockValue,
          rawValue: mockValue,
          weight: 10,
          normalizedValue: mockValue,
          indicatorName: indikator.nazev,
          projectName: project.nazev
        });
      });
    });

    return mockData;
  };

  // Příprava dat pro heatmapu
  const heatmapData = useMemo(() => {
    console.log('🔥 [WeightedHeatmapDebug] ===== ZAČIATOK VÝPOČTU =====');
    console.log('📊 vybraneNavrhyData:', vybraneNavrhyData);
    console.log('📋 vybraneIndikatoryList:', vybraneIndikatoryList);
    console.log('⚖️ globalWeights:', globalWeights);
    console.log('📁 globalCategoryWeights:', globalCategoryWeights);
    
    if (!vybraneNavrhyData || vybraneNavrhyData.length === 0 || !vybraneIndikatoryList || vybraneIndikatoryList.length === 0) {
      console.warn('⚠️ [WeightedHeatmapDebug] Žiadne dáta - používam mock dáta');
      return generateMockData();
    }

    // Debug - skontroluj štruktúru dát
    console.log('🔍 [WeightedHeatmapDebug] Prvý návrh:', vybraneNavrhyData[0]);
    console.log('🔍 [WeightedHeatmapDebug] Prvý indikátor:', vybraneIndikatoryList[0]);
    
    if (vybraneNavrhyData[0] && vybraneIndikatoryList[0]) {
      const firstProject = vybraneNavrhyData[0];
      const firstIndicator = vybraneIndikatoryList[0];
      console.log('🔍 [WeightedHeatmapDebug] Hodnota pre prvý indikátor:', firstProject.data?.[firstIndicator.id]);
      console.log('🧩 [WeightedHeatmapDebug] Struktura návrhu:', firstProject);
      console.log('🧩 [WeightedHeatmapDebug] Možné cesty k dátam:', {
        'project.data': firstProject.data,
        'project.results': firstProject.results,
        'project.indicators': firstProject.indicators,
        'project.scores': firstProject.scores
      });
    }

    const data = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    vybraneIndikatoryList.filter(ind => ind.id !== 'custom_1761333530207').forEach((indikator, indicatorIndex) => {
      vybraneNavrhyData.forEach((project, projectIndex) => {
        // Extrahujeme hodnotu z project.data
        const val = project.data?.[indikator.id];
        const actualValue = val && typeof val === 'object' && 'value' in val ? val.value : val;
        
        console.log(`🔍 [WeightedHeatmapDebug] ${indikator.nazev} (${indikator.id}):`, {
          actualValue,
          project: project.nazev,
          data: project.data
        });
        
        // Pokud nemáme hodnotu, přeskočíme
        if (actualValue == null || actualValue === '') {
          console.log(`⏭️ [WeightedHeatmapDebug] Preskakujem ${indikator.nazev} - žiadna hodnota:`, actualValue);
          skippedCount++;
          return;
        }
        
        // Normalizácia hodnoty (0-100%)
        const numericValue = parseFloat(actualValue);
        if (isNaN(numericValue)) {
          console.log(`❌ [WeightedHeatmapDebug] Neplatná číselná hodnota pre ${indikator.nazev}:`, actualValue);
          skippedCount++;
          return;
        }
        
        // Najdi maximum pre tento indikátor
        const allValues = vybraneNavrhyData.map(p => {
          const v = p.data?.[indikator.id];
          const val = v && typeof v === 'object' && 'value' in v ? v.value : v;
          return parseFloat(val) || 0;
        }).filter(v => v > 0);
        
        const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
        
        const normalizedValue = maxValue > 0 ? (numericValue / maxValue) * 100 : 0;
        
        console.log(`📈 [WeightedHeatmapDebug] ${indikator.nazev}:`, {
          actualValue: numericValue,
          maxValue,
          normalizedValue,
          allValues
        });
        
        const weight = globalWeights[indikator.id] || 10;
        const categoryWeight = globalCategoryWeights[indikator.kategorie] || 33.33;
        
        // Vážená hodnota s kategóriou
        const weightedValue = (normalizedValue * (weight / 100) * (categoryWeight / 100)) * 100;
        
        data.push({
          x: indicatorIndex,
          y: projectIndex,
          value: weightedValue,
          rawValue: actualValue,
          weight: weight,
          normalizedValue: normalizedValue,
          indicatorName: indikator.nazev,
          projectName: project.nazev
        });
        
        processedCount++;
      });
    });

    console.log(`✅ [WeightedHeatmapDebug] Spracované: ${processedCount}, Preskočené: ${skippedCount}`);
    console.log('📊 [WeightedHeatmapDebug] Final data:', data);
    
    // Fallback - ak nie sú dáta, vytvor mock dáta pre testovanie
    if (data.length === 0) {
      console.warn('⚠️ [WeightedHeatmapDebug] Žiadne dáta - vytváram mock dáta pre testovanie');
      return generateMockData();
    }
    
    return data;
  }, [vybraneNavrhyData, vybraneIndikatoryList, globalWeights, globalCategoryWeights]);

  // Příprava možností pro echarts
  const option = useMemo(() => {
    console.log('🎨 [WeightedHeatmapDebug] Vytváram ECharts option s dátami:', heatmapData.length);
    
    const chartOption = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          if (params.componentSubType !== 'heatmap') return '';
          
          const data = params.data;
          const navrhName = data[3]?.projectName || 'N/A';
          const indicatorName = data[3]?.indicatorName || 'N/A';
          const original = data[3]?.rawValue || 'N/A';
          const normalized = data[3]?.normalizedValue || 0;
          const weight = data[3]?.weight || 10;
          const weighted = data[3]?.value || 0;
          
          return `
            <div style="padding: 12px; font-size: 13px; line-height: 1.6; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 10px; color: #0066A4; font-size: 14px;">${indicatorName}</div>
              <div style="color: #333; margin-bottom: 6px;">Návrh: <strong style="color: #2c7fb8;">${navrhName}</strong></div>
              <div style="color: #666; margin-bottom: 4px;">Původní hodnota: <strong>${original}</strong></div>
              <div style="color: #666; margin-bottom: 4px;">Normalizováno: <strong>${normalized.toFixed(1)}%</strong></div>
              <div style="color: #666; margin-bottom: 4px;">Váha indikátoru: <strong>${weight}%</strong></div>
              <div style="border-top: 2px solid #0066A4; margin-top: 10px; padding-top: 8px; font-weight: bold; color: #0066A4; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                🎯 Vážená hodnota: <strong style="font-size: 16px;">${weighted.toFixed(1)}%</strong>
              </div>
            </div>
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333' }
      },
      grid: {
        height: '80%',
        top: 50,
        left: 200,
        right: 50,
        bottom: 50,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: vybraneIndikatoryList.map(i => i.nazev),
        axisLabel: {
          rotate: 45,
          fontSize: 12,
          color: '#666'
        },
        splitArea: {
          show: false
        }
      },
      yAxis: {
        type: 'category',
        data: cleanedNavrhyData.map(n => n.nazev),
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        splitArea: {
          show: false
        }
      },
      visualMap: {
        min: 0,
        max: (() => {
          const maxValueForMap = Math.max(100, ...heatmapData.map(d => Number(d.value) || 0));
          return isFinite(maxValueForMap) ? maxValueForMap : 100;
        })(),
        calculable: true,
        orient: 'vertical',
        right: 10,
        top: 'center',
        inRange: {
          // Gradient farieb: červená → žltá → zelená
          color: ['#f87171', '#facc15', '#4ade80']
        },
        textStyle: {
          color: '#666',
          fontSize: 11
        },
        formatter: (value) => {
          return Math.round(value);
        }
      },
      series: [
        {
          name: 'Vážené hodnoty',
          type: 'heatmap',
          data: heatmapData.map(d => [d.x, d.y, d.value, d]),
          label: {
            show: true,
            formatter: ({ value }) => `${(value || 0).toFixed(1)}%`,
            color: ({ value }) => (value > 50 ? '#fff' : '#333'),
            fontWeight: 'bold',
            fontSize: 10
          },
          emphasis: {
            itemStyle: {
              borderColor: '#333',
              borderWidth: 2,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowBlur: 10
            }
          }
        }
      ]
    };
    
    console.log('🎨 [WeightedHeatmapDebug] ECharts option:', chartOption);
    return chartOption;
  }, [heatmapData, cleanedNavrhyData, vybraneIndikatoryList]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Zap size={32} className="text-blue-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Načítavam heatmapu...</h3>
        <p className="text-gray-500">Prosím počkajte</p>
      </div>
    );
  }

  if (!vybraneNavrhyData || vybraneNavrhyData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Zap size={32} className="text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Nejsou k dispozici data</h3>
        <p className="text-slate-500">Vyberte návrhy k zobrazení heatmapy.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
    >
      {/* Header s debug informáciami */}
      <div className="flex items-center gap-2 p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-[#0066A4] to-[#4BB349]">
        <Zap size={20} className="text-white" />
        <h3 className="text-lg font-semibold text-white">Vážená heatmapa (Debug)</h3>
        <div className="ml-auto flex items-center gap-2 text-white/80 text-sm">
          <Info size={16} />
          <span>Data: {debugInfo.vybraneNavrhyData} | Indikátory: {debugInfo.vybraneIndikatoryList}</span>
        </div>
      </div>

      {/* Debug panel */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span>Návrhy: <strong>{debugInfo.vybraneNavrhyData}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span>Indikátory: <strong>{debugInfo.vybraneIndikatoryList}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span>Váhy: <strong>{debugInfo.globalWeights}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span>Kategórie: <strong>{debugInfo.globalCategoryWeights}</strong></span>
          </div>
        </div>
      </div>
      
      {/* Heatmapa */}
      <div style={{ minHeight: '600px', width: '100%' }} className="p-4 md:p-6">
        {console.log('🎨 [WeightedHeatmapDebug] Renderujem ReactEChartsCore s option:', option)}
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: '100%', height: '600px' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
          onChartReady={(chart) => {
            console.log('✅ [WeightedHeatmapDebug] Chart je pripravený:', chart);
          }}
        />
      </div>

      {/* Legenda a informace */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 md:px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-t border-gray-200"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-600 font-medium">Návrhů:</span>
            <span className="ml-2 font-bold text-slate-900">{cleanedNavrhyData.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium">Indikátorů:</span>
            <span className="ml-2 font-bold text-slate-900">{vybraneIndikatoryList.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium">Datových bodů:</span>
            <span className="ml-2 font-bold text-slate-900">{heatmapData.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium">Škála:</span>
            <span className="ml-2 font-bold text-slate-900">0–100</span>
          </div>
        </div>
      </motion.div>

      {/* Debug tip */}
      <div className="px-4 md:px-6 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-800">
          🔧 <strong>Debug Mode:</strong> Otvorte Developer Tools (F12) a skontrolujte konzolu pre detailné logy. 
          Ak sa nezobrazujú dáta, použijú sa mock dáta pre testovanie.
        </p>
      </div>
    </motion.div>
  );
};

export default WeightedHeatmapDebug;










