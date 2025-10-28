import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Award } from 'lucide-react';

const RadarChartAdvanced = ({ data, indicators, weights = {} }) => {
  const chartOption = useMemo(() => {
    if (!data || data.length === 0 || !indicators || indicators.length === 0) {
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
    const radarData = indicators.map(indicator => {
      const indicatorData = {
        name: indicator.nazev,
        max: 100 // Normalizujeme na 0-100
      };
      
      console.log(`🔍 RadarChart - spracovávam indikátor: ${indicator.nazev}`);

      // Pridáme hodnoty pre každý návrh
      data.forEach((navrh, index) => {
        const value = navrh.data[indicator.id];
        const actualValue = value && typeof value === 'object' && 'value' in value ? value.value : value;
        
        console.log(`  📊 ${navrh.nazev}: ${actualValue} (${typeof actualValue})`);
        
        if (actualValue !== null && actualValue !== undefined) {
          // Pokročilá normalizácia hodnoty
          let normalizedValue = 0;
          
          if (typeof actualValue === 'number') {
            // Pre hodnoty 0-100 (už normalizované)
            if (actualValue >= 0 && actualValue <= 100) {
              normalizedValue = actualValue;
            } else {
              // Normalizácia podľa rozsahu všetkých hodnôt pre tento indikátor
              const allValues = data
                .map(n => {
                  const v = n.data[indicator.id];
                  return v && typeof v === 'object' && 'value' in v ? v.value : v;
                })
                .filter(v => v !== null && v !== undefined && typeof v === 'number');
              
              if (allValues.length > 0) {
                const max = Math.max(...allValues);
                if (max > 0) {
                  normalizedValue = (actualValue / max) * 100;
                } else {
                  normalizedValue = 0; // Ak je maximum 0
                }
              } else {
                normalizedValue = 0; // Fallback ak nie sú dáta
              }
            }
          } else {
            normalizedValue = 0; // Ak nie je číslo
          }
          
          indicatorData[`navrh_${index}`] = Math.round(normalizedValue);
          console.log(`    ✅ Normalizované: ${actualValue} → ${Math.round(normalizedValue)}`);
        } else {
          indicatorData[`navrh_${index}`] = 0;
        }
      });

      return indicatorData;
    });

    // Pripravíme série pre každý návrh
    const series = data.map((navrh, index) => {
      return {
        name: navrh.nazev,
        type: 'radar',
        data: [{
          value: radarData.map(indicator => indicator[`navrh_${index}`] || 0),
          name: navrh.nazev,
          itemStyle: {
            color: colors[index % colors.length]
          },
          areaStyle: {
            color: colors[index % colors.length],
            opacity: 0.1
          },
          lineStyle: {
            width: 3,
            color: colors[index % colors.length]
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
            shadowColor: colors[index % colors.length]
          }
        }
      };
    });

    return {
      title: {
        text: 'Porovnání návrhů podle indikátorů',
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
        confine: true, // Zabráni prekrytiu tooltipu
        textStyle: {
          color: '#1F2937',
          fontSize: 14
        },
        formatter: function(params) {
          const indicatorName = radarData[params.dataIndex]?.name || '';
          const value = params.value[params.dataIndex] || 0;
          const weight = weights[indicators[params.dataIndex]?.id] || 10;
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.seriesName}</div>
              <div style="margin-bottom: 2px;"><strong>${indicatorName}:</strong></div>
              <div style="color: ${params.color}; font-weight: bold;">${value.toFixed(1)}%</div>
              <div style="font-size: 12px; color: #6B7280;">Váha: ${weight}%</div>
            </div>
          `;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 10, // Zmenšené bottom aby neprekrýval popisky
        left: 'center',
        data: data.map(navrh => navrh.nazev),
        textStyle: {
          fontSize: 12,
          color: '#6B7280'
        },
        itemGap: 20
      },
      grid: {
        containLabel: true // Zabráni prekrytiu labelov
      },
      radar: {
        center: ['50%', '55%'],
        radius: window.innerWidth < 900 ? '60%' : '75%', // Adaptívny radius
        indicator: radarData.map(indicator => ({
          name: indicator.name,
          max: indicator.max,
          nameGap: 10,
          nameTextStyle: {
            fontSize: 12,
            color: '#6B7280',
            fontWeight: '500'
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
        }
      },
      series: series,
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicInOut'
    };
  }, [data, indicators, weights]);

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
              {data.length} návrhů × {indicators.length} indikátorů
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
              <span className="text-sm font-medium text-purple-900">Indikátory</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {indicators.length}
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
