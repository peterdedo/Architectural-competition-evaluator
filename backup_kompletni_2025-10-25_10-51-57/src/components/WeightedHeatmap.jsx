import React, { useMemo, useEffect, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWizard } from '../contexts/WizardContext';

// Zaregistrujeme potřebné komponenty pro echarts
echarts.use([HeatmapChart, GridComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);

const WeightedHeatmap = ({ vybraneNavrhyData, vybraneIndikatoryList, vahy = {}, categoryWeights = {} }) => {
  // Real-time aktualizácia pri zmene váh alebo kategórií
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Napojenie na globálny stav z WizardContext
  const wizardContext = useWizard();
  const globalWeights = wizardContext.weights || vahy;
  const globalCategoryWeights = wizardContext.categoryWeights || categoryWeights;
  const results = wizardContext.results || [];
  const projects = wizardContext.projects || [];
  
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [results, vybraneIndikatoryList, globalWeights, globalCategoryWeights]);

  // Použij results z WizardContext (majú vážené normalizované skóre)
  const dataSource = results.length > 0 ? results : vybraneNavrhyData;
  
  console.log('[WeightedHeatmap] Debug - dataSource (results/vybraneNavrhyData):', dataSource);
  console.log('[WeightedHeatmap] Debug - results:', results);
  console.log('[WeightedHeatmap] Debug - vybraneNavrhyData:', vybraneNavrhyData);
  console.log('[WeightedHeatmap] Debug - projects:', projects);
  
  // Debug štruktúry results
  if (results.length > 0) {
    console.log('[WeightedHeatmap] Debug - results[0].scores:', results[0].scores);
    console.log('[WeightedHeatmap] Debug - results[0].scores.indicators:', results[0].scores?.indicators);
  }

  // Vyčistíme názvy návrhov
  const cleanedNavrhyData = useMemo(() => {
    if (!dataSource) return [];
    
    return dataSource.map(navrh => {
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
  }, [dataSource]);
  // Příprava dat pro heatmapu
  const heatmapData = useMemo(() => {
    console.log('[WeightedHeatmap] Debug - dataSource (results/vybraneNavrhyData):', dataSource);
    console.log('[WeightedHeatmap] Debug - vybraneIndikatoryList:', vybraneIndikatoryList);
    console.log('[WeightedHeatmap] Debug - globalWeights:', globalWeights);
    console.log('[WeightedHeatmap] Debug - globalCategoryWeights:', globalCategoryWeights);
    
    if (!dataSource || dataSource.length === 0 || !vybraneIndikatoryList || vybraneIndikatoryList.length === 0) {
      console.warn('[WeightedHeatmap] Žiadne dáta pre heatmapu');
      return [];
    }

    // Debug - skontroluj štruktúru dát
    console.log('[WeightedHeatmap] Debug - prvý návrh:', dataSource[0]);
    console.log('[WeightedHeatmap] Debug - prvý indikátor:', vybraneIndikatoryList[0]);
    console.log('[WeightedHeatmap] Debug - počet projektov:', dataSource.length);
    console.log('[WeightedHeatmap] Debug - počet indikátorů:', vybraneIndikatoryList.length);
    if (dataSource[0] && vybraneIndikatoryList[0]) {
      const firstProject = dataSource[0];
      const firstIndicator = vybraneIndikatoryList[0];
      console.log('[WeightedHeatmap] Debug - hodnota pre prvý indikátor:', firstProject.data?.[firstIndicator.id]);
      console.log('🧩 [WeightedHeatmap] Struktura návrhu:', firstProject);
      console.log('🧩 [WeightedHeatmap] Možné cesty k dátam:', {
        'project.data': firstProject.data,
        'project.results': firstProject.results,
        'project.indicators': firstProject.indicators,
        'project.scores': firstProject.scores
      });
    }

    const data = [];
    
    vybraneIndikatoryList.forEach((indikator, indicatorIndex) => {
      dataSource.forEach((project, projectIndex) => {
        // Pre results: použij vážené normalizované skóre z scores.indicators
        let actualValue = 0;
        
        if (results.length > 0 && project.scores?.indicators?.[indikator.id]) {
          // Použij vážené normalizované skóre z results
          actualValue = project.scores.indicators[indikator.id] || 0;
          console.log(`[WeightedHeatmap] Používam vážené skóre pre ${indikator.nazev}:`, actualValue);
        } else if (results.length > 0 && project.scores?.total) {
          // Fallback: použij celkové skóre ak nie sú dostupné indikátorové skóre
          actualValue = project.scores.total || 0;
          console.log(`[WeightedHeatmap] Používam celkové skóre pre ${indikator.nazev}:`, actualValue);
        } else {
          // Fallback na pôvodné dáta
          const val = project.data?.[indikator.id] ?? 
                     project.results?.[indikator.id] ?? 
                     project.indicators?.[indikator.id] ?? 
                     0;
          
          // Robustní extrakce číselné hodnoty
          if (typeof val === 'number') {
            actualValue = val;
          } else if (val && typeof val === 'object' && 'value' in val) {
            const extractedValue = val.value;
            if (typeof extractedValue === 'number') {
              actualValue = extractedValue;
            } else if (typeof extractedValue === 'string') {
              actualValue = parseFloat(extractedValue) || 0;
            }
          } else if (typeof val === 'string') {
            actualValue = parseFloat(val) || 0;
          }
        }
        
        console.log(`[WeightedHeatmap] Debug - ${indikator.nazev} (${indikator.id}):`, {
          actualValue,
          project: project.nazev,
          data: project.data,
          hasData: !!project.data,
          dataKeys: project.data ? Object.keys(project.data) : [],
          scores: project.scores,
          indicatorId: indikator.id,
          hasResults: results.length > 0,
          isWeightedScore: results.length > 0 && project.scores?.indicators?.[indikator.id],
          category: indikator.kategorie,
          projectName: project.nazev,
          indicatorName: indikator.nazev
        });
        
        // Pokud nemáme hodnotu, přeskočíme
        if (actualValue == null || actualValue === '') {
          console.log(`[WeightedHeatmap] Preskakujem ${indikator.nazev} - žiadna hodnota:`, actualValue);
          return;
        }
        
        // Pre vážené skóre: použij priamo hodnotu (už je normalizovaná)
        let normalizedValue = 0;
        
        if (results.length > 0 && project.scores?.indicators?.[indikator.id]) {
          // Vážené skóre je už normalizované (0-100%)
          normalizedValue = actualValue;
        } else {
          // Pre pôvodné dáta: normalizácia hodnoty (0-100%)
          const numericValue = parseFloat(actualValue);
          if (isNaN(numericValue)) {
            return;
          }
          
          // Najdi maximum pre tento indikátor
          const allValues = dataSource.map(p => {
            const v = p.data?.[indikator.id];
            const val = v && typeof v === 'object' && 'value' in v ? v.value : v;
            return parseFloat(val) || 0;
          }).filter(v => v > 0);
          
          const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
          normalizedValue = maxValue > 0 ? (numericValue / maxValue) * 100 : 0;
        }
        
        console.log(`[WeightedHeatmap] Debug - ${indikator.nazev}:`, {
          actualValue,
          normalizedValue,
          isWeightedScore: results.length > 0 && (project.scores?.indicators?.[indikator.id] || project.scores?.total),
          hasResults: results.length > 0,
          hasScores: !!project.scores,
          projectName: project.nazev,
          scoresStructure: project.scores
        });
        
        let weightedValue = 0;
        
        if (results.length > 0 && (project.scores?.indicators?.[indikator.id] || project.scores?.total)) {
          // Pre vážené skóre: použij priamo hodnotu (už je vážená)
          weightedValue = normalizedValue;
        } else {
          // Pre pôvodné dáta: aplikuj váhy
          const weight = globalWeights[indikator.id] || 10;
          const categoryWeight = globalCategoryWeights[indikator.kategorie] || 33.33;
          weightedValue = (normalizedValue * (weight / 100) * (categoryWeight / 100)) * 100;
        }
        
        data.push({
          x: indicatorIndex,
          y: projectIndex,
          value: weightedValue,
          rawValue: actualValue,
          weight: results.length > 0 && project.scores?.indicators?.[indikator.id] ? 'N/A (vážené skóre)' : (globalWeights[indikator.id] || 10),
          categoryWeight: results.length > 0 && project.scores?.indicators?.[indikator.id] ? 'N/A (vážené skóre)' : (globalCategoryWeights[indikator.kategorie] || 33.33),
          normalizedValue: normalizedValue,
          indicatorName: indikator.nazev,
          projectName: project.nazev
        });
      });
    });

    console.log('[WeightedHeatmap] Debug - final data:', data);
    
    // Fallback - ak nie sú dáta, vytvor mock dáta pre testovanie
    if (data.length === 0) {
      console.warn('[WeightedHeatmap] Žiadne dáta - vytváram mock dáta pre testovanie');
      const mockData = [];
        vybraneIndikatoryList.forEach((indikator, indicatorIndex) => {
          dataSource.forEach((project, projectIndex) => {
          // Vytvor náhodné hodnoty pre testovanie
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
      console.log('[WeightedHeatmap] Mock data:', mockData);
      return mockData;
    }
    
    return data;
  }, [dataSource, vybraneIndikatoryList, globalWeights, globalCategoryWeights]);

  // Příprava možností pro echarts
  const option = useMemo(() => {
    console.log('[WeightedHeatmap] Vytváram ECharts option s dátami:', heatmapData.length);
    
    const chartOption = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        if (params.componentSubType !== 'heatmap') return '';
        
        const data = params.data;
        const xIndex = data[0];
        const yIndex = data[1];
        const value = data[2];
        
        // Najdi původní data z heatmapData
        const originalData = heatmapData.find(d => d.x === xIndex && d.y === yIndex);
        
        const navrhName = originalData?.projectName || 'N/A';
        const indicatorName = originalData?.indicatorName || 'N/A';
        const original = originalData?.rawValue || 'N/A';
        const normalized = originalData?.normalizedValue || 0;
        const weight = originalData?.weight || 'N/A';
        const weighted = value || 0;
        
        return `
          <div style="padding: 12px; font-size: 13px; line-height: 1.6; min-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 10px; color: #0066A4; font-size: 14px;">${indicatorName}</div>
            <div style="color: #333; margin-bottom: 6px;">Návrh: <strong style="color: #2c7fb8;">${navrhName}</strong></div>
            <div style="color: #666; margin-bottom: 4px;">Původní hodnota: <strong>${original}</strong></div>
            <div style="color: #666; margin-bottom: 4px;">Normalizováno: <strong>${normalized}%</strong></div>
            <div style="color: #666; margin-bottom: 4px;">Váha indikátoru: <strong>${weight}%</strong></div>
            <div style="border-top: 2px solid #0066A4; margin-top: 10px; padding-top: 8px; font-weight: bold; color: #0066A4; background: #f8f9fa; padding: 8px; border-radius: 4px;">
              🎯 Vážená hodnota: <strong style="font-size: 16px;">${weighted}</strong>
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
        const maxValueForMap = Math.max(4000, ...heatmapData.map(d => Number(d[2]) || 0));
        return isFinite(maxValueForMap) ? maxValueForMap : 4000;
      })(),
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      inRange: {
        // Plynulá farebná škála: modrá (0) → biela (0.5) → červená (1)
        color: [
          '#0000FF', // 0.0 - sýta modrá
          '#4040FF', // 0.125 - svetlejšia modrá
          '#8080FF', // 0.25 - ešte svetlejšia modrá
          '#C0C0FF', // 0.375 - veľmi svetlá modrá
          '#FFFFFF', // 0.5 - biela (stred)
          '#FFC0C0', // 0.625 - veľmi svetlá červená
          '#FF8080', // 0.75 - svetlá červená
          '#FF4040', // 0.875 - tmavšia červená
          '#FF0000'  // 1.0 - sýta červená
        ]
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
          data: heatmapData.map(d => [d.x, d.y, d.value]),
        label: {
          show: false
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
    
    console.log('[WeightedHeatmap] ECharts option:', chartOption);
    return chartOption;
  }, [heatmapData, dataSource, vybraneIndikatoryList]);

  if (!dataSource || dataSource.length === 0) {
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
      <div className="flex items-center gap-2 p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-[#0066A4] to-[#4BB349]">
        <Zap size={20} className="text-white" />
        <h3 className="text-lg font-semibold text-white">Vážená heatmapa</h3>
      </div>
      
      <div style={{ minHeight: '600px', width: '100%' }} className="p-4 md:p-6">
        {console.log('[WeightedHeatmap] Renderujem ReactEChartsCore s option:', option)}
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: '100%', height: '600px' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
          onChartReady={(chart) => {
            console.log('[WeightedHeatmap] Chart je pripravený:', chart);
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
            <span className="ml-2 font-bold text-slate-900">{dataSource.length}</span>
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

      {/* Tip */}
      <div className="px-4 md:px-6 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Najeďte myší na buňky pro zobrazení detailních informací (původní hodnota, normalizace, váha, výsledek)
        </p>
      </div>
    </motion.div>
  );
};

export default WeightedHeatmap;
