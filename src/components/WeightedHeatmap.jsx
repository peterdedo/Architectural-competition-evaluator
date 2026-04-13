import React, { useMemo, useEffect, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWizard } from '../contexts/WizardContext';
import { withoutLegacyExcludedById } from '../config/legacyIndicatorFilters';

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
  
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [results, vybraneIndikatoryList, globalWeights, globalCategoryWeights]);

  // Použij results z WizardContext (majú vážené normalizované skóre)
  const dataSource = results.length > 0 ? results : vybraneNavrhyData;
  

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

  const indicatorsForHeatmap = useMemo(
    () => withoutLegacyExcludedById(vybraneIndikatoryList || []),
    [vybraneIndikatoryList]
  );

  // Parser pre číselné hodnoty - rovnaká logika ako v WinnerCalculationBreakdown
  // Handles all data formats including manually entered values
  const parseNumericValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "object" && "value" in val)
      return parseNumericValue(val.value);
    const numericStr = String(val)
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".");
    const parsed = Number(numericStr);
    return isNaN(parsed) ? null : parsed;
  };

  // Příprava dat pro heatmapu
  const heatmapData = useMemo(() => {
    if (!dataSource || dataSource.length === 0 || !vybraneIndikatoryList || vybraneIndikatoryList.length === 0) {
      console.warn('[WeightedHeatmap] Nejsou data pro heatmapu');
      return [];
    }

    const data = [];
    
    indicatorsForHeatmap.forEach((indikator, indicatorIndex) => {
      dataSource.forEach((project, projectIndex) => {
        // Vždy najprv skús extrahovať z project.data (pre ručne zadané hodnoty)
        let actualValue = null;
        let useWeightedScore = false;
        
        const hodnota = project.data?.[indikator.id];
        
        // Použi rovnakú logiku ako WinnerCalculationBreakdown
        actualValue = parseNumericValue(hodnota);
        
        // Ak máme hodnotu v project.data, použijeme ju
        // Ak nie a existujú results, skús použiť vážené skóre
        if (actualValue === null && results.length > 0 && project.scores?.indicators?.[indikator.id]) {
          // Použij vážené normalizované skóre z results len ak nemáme hodnotu v project.data
          actualValue = project.scores.indicators[indikator.id] || 0;
          useWeightedScore = true;
        }
        
        // Ak nemáme hodnotu, použij 0 namiesto preskočenia bunky
        // Takto sa zobrazí každá bunka, aj keď nemá hodnotu
        if (actualValue === null || actualValue === undefined) {
          actualValue = 0;
        }
        
        // Pre vážené skóre: použij priamo hodnotu (už je normalizovaná)
        let normalizedValue = 0;
        
        if (useWeightedScore) {
          // Vážené skóre je už normalizované (0-100%)
          normalizedValue = actualValue;
        } else {
          // Pre pôvodné dáta: normalizácia hodnoty (0-100%)
          const numericValue = parseFloat(actualValue);
          if (isNaN(numericValue)) {
            return;
          }
          
          // Najdi maximum pre tento indikátor - používaj rovnakú parseNumericValue logiku
          const allValues = dataSource
            .map(p => parseNumericValue(p.data?.[indikator.id]))
            .filter(v => v !== null && !isNaN(v)); // Filtruj len platné čísla (vrátane 0)
          
          if (allValues.length === 0) {
            // Ak nie sú žiadne platné hodnoty, použij 0
            normalizedValue = 0;
          } else {
            const maxValue = Math.max(...allValues);
            // Ak je maxValue 0, všetky hodnoty sú 0, normalizuj na 0
            normalizedValue = maxValue > 0 ? (numericValue / maxValue) * 100 : (numericValue === 0 ? 0 : 0);
          }
        }
        
        let weightedValue = 0;
        
        if (useWeightedScore) {
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
          weight: useWeightedScore ? 'N/A (vážené skóre)' : (globalWeights[indikator.id] || 10),
          categoryWeight: useWeightedScore ? 'N/A (vážené skóre)' : (globalCategoryWeights[indikator.kategorie] || 33.33),
          normalizedValue: normalizedValue,
          indicatorName: indikator.nazev,
          projectName: project.nazev
        });
      });
    });

    if (data.length === 0) {
      console.warn('[WeightedHeatmap] Heatmapa nemá dostatek dat k zobrazení');
    }
    return data;
  }, [dataSource, indicatorsForHeatmap, globalWeights, globalCategoryWeights]);

  // Příprava možností pro echarts
  const option = useMemo(() => {
    // Vypočítaj maximum hodnoty raz pre všetky použitia
    const maxValueForMap = Math.max(2000, ...heatmapData.map(d => Number(d.value) || 0));
    const finalMaxValue = isFinite(maxValueForMap) ? maxValueForMap : 2000;
    
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
      data: indicatorsForHeatmap.map((i) => i.nazev),
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
      max: finalMaxValue,
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
            show: true,
            formatter: (params) => {
              const value = params.data[2];
              if (value === null || value === undefined) return '';
              // Zobraz hodnotu zaokrúhlenú na celé číslo
              return Math.round(value).toString();
            },
            color: (params) => {
              // Dynamická farba textu podľa hodnoty - tmavšia farba pre svetlé pozadie
              const value = params.data[2] || 0;
              const normalized = finalMaxValue > 0 ? value / finalMaxValue : 0;
              // Pre svetlé bunky (modré, biele) použij tmavý text, pre tmavé bunky (červené) svetlý text
              return normalized < 0.5 ? '#333' : '#fff';
            },
            fontWeight: 'bold',
            fontSize: 11
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
    
    return chartOption;
  }, [heatmapData, dataSource, indicatorsForHeatmap]);

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

  if (heatmapData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Zap size={32} className="text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Heatmapa nemá dostatek dat k zobrazení</h3>
        <p className="text-slate-500">Pro heatmapu nejsou k dispozici data.</p>
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
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: '100%', height: '600px' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
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
