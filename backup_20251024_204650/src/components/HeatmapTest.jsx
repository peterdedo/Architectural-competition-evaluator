import React, { useState, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Zaregistrujeme potřebné komponenty pro echarts
echarts.use([HeatmapChart, GridComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);

const HeatmapTest = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Generovanie testovacích dát
  const generateTestData = () => {
    const indicators = [
      'Parkovací stání celkem',
      'Parkovací stání podzemní', 
      'Parkovací stání venkovní',
      'Parkovací stání krytá',
      'HPP parkování',
      'HPP technologie',
      'HPP veřejná vybavenost',
      'HPP kanceláře',
      'HPP komerce',
      'HPP bydlení',
      'Celková plocha podzemních podlaží',
      'Celková plocha nadzemních podlaží',
      'Plochy ostatní',
      'Plochy zpevněné',
      'Plochy zelené',
      'Zastavěná plocha objektů',
      'Plocha řešeného území'
    ];

    const projects = ['CHKAU', 'PHAP'];

    const data = [];
    indicators.forEach((indicator, indicatorIndex) => {
      projects.forEach((project, projectIndex) => {
        const value = Math.random() * 100;
        data.push({
          x: indicatorIndex,
          y: projectIndex,
          value: value,
          indicatorName: indicator,
          projectName: project
        });
      });
    });

    return { data, indicators, projects };
  };

  const { data, indicators, projects } = useMemo(() => generateTestData(), [refreshKey]);

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const data = params.data;
        return `
          <div style="padding: 12px; font-size: 13px; line-height: 1.6; min-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 10px; color: #0066A4; font-size: 14px;">${data.indicatorName}</div>
            <div style="color: #333; margin-bottom: 6px;">Návrh: <strong style="color: #2c7fb8;">${data.projectName}</strong></div>
            <div style="border-top: 2px solid #0066A4; margin-top: 10px; padding-top: 8px; font-weight: bold; color: #0066A4; background: #f8f9fa; padding: 8px; border-radius: 4px;">
              🎯 Hodnota: <strong style="font-size: 16px;">${data.value.toFixed(1)}%</strong>
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
      data: projects,
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
      data: indicators,
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
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      inRange: {
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
        name: 'Test hodnoty',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          formatter: ({ value }) => `${value.toFixed(1)}%`,
          color: '#fff',
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-[#0066A4] to-[#4BB349]">
        <Zap size={20} className="text-white" />
        <h3 className="text-lg font-semibold text-white">Test Heatmapy</h3>
        <button
          onClick={handleRefresh}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} />
          Obnovit
        </button>
      </div>

      {/* Test info */}
      <div className="p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">Testovací mód - zobrazuje náhodné hodnoty</span>
        </div>
      </div>
      
      {/* Heatmapa */}
      <div style={{ minHeight: '600px', width: '100%' }} className="p-4 md:p-6">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: '100%', height: '600px' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
          onChartReady={(chart) => {
            console.log('✅ Test heatmapa je pripravená:', chart);
          }}
        />
      </div>

      {/* Legenda */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 md:px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-t border-gray-200"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-600 font-medium">Návrhů:</span>
            <span className="ml-2 font-bold text-slate-900">{projects.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium">Indikátorů:</span>
            <span className="ml-2 font-bold text-slate-900">{indicators.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium">Datových bodů:</span>
            <span className="ml-2 font-bold text-slate-900">{data.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium">Škála:</span>
            <span className="ml-2 font-bold text-slate-900">0–100%</span>
          </div>
        </div>
      </motion.div>

      {/* Tip */}
      <div className="px-4 md:px-6 py-3 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Najeďte myší na buňky pro zobrazení detailních informací. 
          Klikněte "Obnovit" pro generování nových náhodných hodnot.
        </p>
      </div>
    </motion.div>
  );
};

export default HeatmapTest;





