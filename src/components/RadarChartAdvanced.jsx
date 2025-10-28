import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Award } from 'lucide-react';

const RadarChartAdvanced = ({ data, indicators, allIndicators = null }) => {
  // Parser pre číselné hodnoty
  const parseNumericValue = (val) => {
    if (val === null || val === undefined) return null;

    // Handle objects with a 'value' property, especially for manually entered data
    if (typeof val === "object" && 'value' in val && val.value !== null && val.value !== undefined) {
      // Recursively call parseNumericValue for the nested value
      return parseNumericValue(val.value);
    }

    // Prevedeme na číslo, odstránime všetky nečíselné znaky
    const numericStr = String(val).replace(/[^\d.-]/g, '');
    const parsed = Number(numericStr);
    const result = isNaN(parsed) ? null : parsed;

    return result;
  };

  const chartOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }

    // 🔹 Použijeme LEN vybrané indikátory (nie všetkých 34)
    const zobrazovaneIndikatory = (indicators || []).filter(ind => ind.id !== 'custom_1761333530207');
    
    if (zobrazovaneIndikatory.length === 0) {
      return {};
    }


    // Farbové schémy pre návrhy
    const colors = [
      '#0066A4', // Modrá
      '#4BB349', // Zelená
      '#F59E0B', // Oranžová
      '#EF4444', // Červená
      '#8B5CF6', // Fialová
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316'  // Orange
    ];

    // Pripravíme dáta pre radarový graf
    const radarLabels = [];
    const datasets = data.map((navrh, index) => ({
      label: navrh.nazev,
      data: [],
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20', // 20% opacity
      pointBackgroundColor: colors[index % colors.length],
      borderWidth: 3,
      pointRadius: 6
    }));

    // Spracujeme každý indikátor
    zobrazovaneIndikatory.forEach((indikator) => {
      const indicatorName = indikator.nazev.length > 50 ? indikator.nazev.slice(0, 50) + "…" : indikator.nazev;
      
      console.log(`🔍 RadarChart - spracovávam indikátor: ${indikator.nazev}`);

      // Získame všetky hodnoty pre tento indikátor
      const hodnoty = data.map(navrh => {
        const value = navrh.data[indikator.id];
        return parseNumericValue(value);
      }).filter(v => v !== null && v !== undefined);

      if (hodnoty.length === 0) {
        radarLabels.push(indicatorName);
        datasets.forEach(dataset => dataset.data.push(0));
        return;
      }

      // Najvyššia a najnižšia hodnota medzi všetkými návrhmi
      const min = Math.min(...hodnoty);
      const max = Math.max(...hodnoty);
      
      // Určíme, či je nižšia hodnota lepšia
      const lowerBetter = indikator.lower_better || indikator.mensi_lepsi || false;

      // Normalizácia pre každý návrh
      data.forEach((navrh, navrhIndex) => {
        const value = navrh.data[indikator.id];
        const actualValue = parseNumericValue(value);
        
        if (actualValue !== null && actualValue !== undefined) {
          let normalized;
          
          if (max === min) {
            // Ak sú všetky hodnoty rovnaké, nastavíme 100%
            normalized = 100;
          } else if (lowerBetter) {
            // Inverzní indikátory (nižší = lepší): ((max - value) / (max - min)) * 100
            normalized = ((max - actualValue) / (max - min)) * 100;
          } else {
            // Standardní indikátory (vyšší = lepší): (value / max) * 100
            normalized = (actualValue / max) * 100;
          }
          
          datasets[navrhIndex].data.push(normalized);
        } else {
          datasets[navrhIndex].data.push(0);
        }
      });

      radarLabels.push(indicatorName);
    });

    // Pripravíme série pre každý návrh (ECharts formát)
    const series = datasets.map((dataset, index) => {
      return {
        name: dataset.label,
        type: 'radar',
        data: [{
          value: dataset.data,
          name: dataset.label,
          itemStyle: {
            color: dataset.borderColor
          },
          areaStyle: {
            color: dataset.borderColor,
            opacity: 0.1
          },
          lineStyle: {
            width: 3,
            color: dataset.borderColor
          },
          symbol: 'circle',
          symbolSize: 6
        }],
        emphasis: {
          lineStyle: {
            width: 4
          },
          itemStyle: {
            borderWidth: 3,
            borderColor: '#fff',
            shadowBlur: 10,
            shadowColor: dataset.borderColor
          }
        }
      };
    });

    return {
      title: {
        text: 'Porovnání návrhů podle vybraných indikátorů',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1F2937'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 8,
        confine: true,
        textStyle: {
          color: '#1F2937',
          fontSize: 14
        },
        formatter: function(params) {
          const indicatorName = radarLabels[params.dataIndex] || '';
          const value = params.value[params.dataIndex] || 0;
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.seriesName}</div>
              <div style="margin-bottom: 2px;"><strong>${indicatorName}:</strong></div>
              <div style="color: ${params.color}; font-weight: bold;">${value.toFixed(1)}%</div>
              <div style="font-size: 12px; color: #6B7280;">Relativní skóre</div>
            </div>
          `;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        left: 'center',
        data: data.map(navrh => navrh.nazev),
        textStyle: {
          fontSize: 12,
          color: '#6B7280'
        },
        itemGap: 20
      },
      grid: {
        containLabel: true
      },
      radar: {
        center: ['50%', '55%'],
        radius: window.innerWidth < 900 ? '60%' : '75%',
        indicator: radarLabels.map(label => ({
          name: label,
          max: 100,
          min: 0,
          nameGap: 15,
          nameTextStyle: {
            fontSize: 11,
            color: '#6B7280',
            fontWeight: '500',
            width: 80,
            overflow: 'truncate'
          }
        })),
        splitArea: {
          areaStyle: {
            color: ['rgba(250, 250, 250, 0.3)', 'rgba(200, 200, 200, 0.1)']
          }
        },
        splitLine: {
          lineStyle: {
            color: '#E5E7EB',
            width: 1
          }
        },
        axisLine: {
          lineStyle: {
            color: '#D1D5DB'
          }
        },
        splitNumber: 5, // Rozdelíme na 5 častí (0%, 20%, 40%, 60%, 80%, 100%)
        axisLabel: {
          formatter: function(value) {
            return `${value}%`;
          }
        }
      },
      series: series,
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicInOut'
    };
  }, [data, indicators, allIndicators]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl">
        <div className="text-center">
          <Target size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Žádné data k zobrazení</h3>
          <p className="text-gray-500">Vyberte návrhy pro zobrazení radarového grafu</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Header s štatistikami */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Radarový graf porovnání</h3>
            <p className="text-gray-600 text-sm">
              {data.length} návrhů × {indicators?.length || 0} indikátorů
            </p>
          </div>
        </div>

        {/* Rýchle štatistiky */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Najlepší skóre</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {Math.max(...data.map(navrh => navrh.weightedScore || 0))}%
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-900">Priemerné skóre</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {Math.round(data.reduce((acc, navrh) => acc + (navrh.weightedScore || 0), 0) / data.length)}%
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Vybrané indikátory</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {(indicators || []).filter(ind => ind.id !== 'custom_1761333530207').length}
            </div>
          </div>
        </div>
      </div>

      {/* ECharts komponent */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <ReactECharts
          option={chartOption}
          style={{ height: '500px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Legenda s farbami */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {data.map((navrh, index) => {
          const colors = [
            '#0066A4', '#4BB349', '#F59E0B', '#EF4444', 
            '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
          ];
          const color = colors[index % colors.length];
          
          return (
            <div key={navrh.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{navrh.nazev}</span>
              <span className="text-sm font-medium text-gray-900">
                ({navrh.weightedScore || 0}%)
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RadarChartAdvanced;