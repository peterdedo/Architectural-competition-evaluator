import React, { useState } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { CRITERIA } from '../models/CriteriaModel';
import ComparisonDashboard from './ComparisonDashboard';
import WinnerCalculationBreakdown from './WinnerCalculationBreakdown';

const StepComparison = () => {
  const { projects, selectedCriteria, analysisResults, setStep } = useWizard();
  const [viewMode, setViewMode] = useState('dashboard');
  const [selectedProjects, setSelectedProjects] = useState(new Set());

  // Filtrovat jen vybrané projekty
  const selectedProjectsData = projects.filter(p => p.selected);

  // Filtrovat jen vybraná kritéria
  const filteredCriteria = Object.fromEntries(
    Object.entries(CRITERIA).filter(([key]) => selectedCriteria.has(key))
  );

  // Konverzia dát pre ComparisonDashboard
  const navrhy = projects.map(project => ({
    id: project.id,
    nazev: project.name,
    status: project.status === 'completed' ? 'zpracován' : 'pending',
    data: project.analysisResult?.data || {}
  }));

  const vybraneNavrhy = new Set(selectedProjectsData.map(p => p.id));
  const vybraneIndikatory = selectedCriteria;

  // Handler pre zmenu výberu projektov
  const handleVybraniNavrhu = (navrhId) => {
    const noveVybrane = new Set(selectedProjects);
    if (noveVybrane.has(navrhId)) {
      noveVybrane.delete(navrhId);
    } else {
      noveVybrane.add(navrhId);
    }
    setSelectedProjects(noveVybrane);
  };

  // Handler pre zmenu názvu návrhu
  const handleProposalNameChange = (proposalId, newName) => {
    // Tu by sa malo aktualizovať názov v projektoch
    console.log('Zmena názvu návrhu:', proposalId, newName);
  };

  if (selectedProjectsData.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Porovnanie Projektov</h2>
              <p className="text-indigo-100 text-sm">Vizuálne porovnanie projektov</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Vyberte projekty pre porovnanie</h3>
            <p className="text-slate-500 mb-6">Prejdite na krok "Výsledky" a vyberte aspoň jeden projekt.</p>
            <button className="btn btn-primary" onClick={() => setStep('results')}>
              ← Späť na Výsledky
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Dashboard */}
      <ComparisonDashboard
        navrhy={navrhy}
        vybraneNavrhy={vybraneNavrhy}
        setVybraneNavrhy={setSelectedProjects}
        vybraneIndikatory={vybraneIndikatory}
        vahy={{}}
        onBack={() => setStep('results')}
      />

      {/* Winner Calculation Breakdown */}
      <WinnerCalculationBreakdown
        navrhy={navrhy}
        vybraneNavrhy={vybraneNavrhy}
        vybraneIndikatory={vybraneIndikatory}
        vahy={{}}
        onBack={() => setStep('results')}
      />
    </div>
  );
};

export default StepComparison;







