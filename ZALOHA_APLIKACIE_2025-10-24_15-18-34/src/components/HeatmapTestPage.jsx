import React from 'react';
import HeatmapTest from './HeatmapTest';
import WeightedHeatmapDebug from './WeightedHeatmapDebug';

const HeatmapTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Heatmapy</h1>
          <p className="text-gray-600">
            Táto stránka obsahuje testovacie komponenty pre heatmapu s debug funkciami.
          </p>
        </div>

        {/* Test Heatmapa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Základná Test Heatmapa</h2>
          <p className="text-gray-600 mb-4">
            Jednoduchá heatmapa s náhodnými dátami pre testovanie funkcionality.
          </p>
          <HeatmapTest />
        </div>

        {/* Debug Heatmapa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Debug Heatmapa</h2>
          <p className="text-gray-600 mb-4">
            Rozšírená heatmapa s debug funkciami a mock dátami.
          </p>
          <WeightedHeatmapDebug
            vybraneNavrhyData={[]}
            vybraneIndikatoryList={[]}
            vahy={{}}
            categoryWeights={{}}
          />
        </div>

        {/* Instrukcie */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Instrukcie pre testovanie</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1. Základná Test Heatmapa:</strong> Mala by zobraziť farebnú heatmapu s náhodnými hodnotami</p>
            <p><strong>2. Debug Heatmapa:</strong> Zobrazí mock dáta ak nie sú k dispozícii skutočné dáta</p>
            <p><strong>3. Konzola:</strong> Otvorte Developer Tools (F12) pre debug logy</p>
            <p><strong>4. Obnovenie:</strong> Kliknite "Obnovit" pre generovanie nových náhodných hodnôt</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapTestPage;




