import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, Target } from 'lucide-react';

const ResultsSummary = ({ vybraneNavrhyData, vybraneIndikatoryList }) => {
  // Vypočítání klíčových metrik
  const totalProjects = vybraneNavrhyData.length;
  const totalIndicators = vybraneIndikatoryList.length;
  
  // Najdi nejlepší projekt pro každý indikátor
  const bestProjects = vybraneIndikatoryList.map(indikator => {
    let bestValue = null;
    let bestProject = null;
    
    vybraneNavrhyData.forEach(navrh => {
      const value = navrh.data[indikator.id];
      if (value !== null && value !== undefined) {
        if (bestValue === null || 
            (indikator.lower_better ? value < bestValue : value > bestValue)) {
          bestValue = value;
          bestProject = navrh;
        }
      }
    });
    
    return { indikator, bestProject, bestValue };
  });

  const projectsWithBestValues = bestProjects.filter(p => p.bestProject).length;
  const completionRate = Math.round((projectsWithBestValues / totalIndicators) * 100);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="results-summary mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <BarChart3 size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="heading-3 text-text-dark">📊 Shrnutí výsledků</h3>
          <p className="body-small text-text-light">Klíčové metriky a porovnání návrhů</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-white rounded-xl p-4 border border-green-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-primary" />
            <span className="label-small">Projekty</span>
          </div>
          <div className="text-2xl font-bold text-text-dark">{totalProjects}</div>
          <div className="text-xs text-text-light">celkem porovnáno</div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl p-4 border border-green-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-primary" />
            <span className="label-small">Indikátory</span>
          </div>
          <div className="text-2xl font-bold text-text-dark">{totalIndicators}</div>
          <div className="text-xs text-text-light">hodnoceno</div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl p-4 border border-green-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-primary" />
            <span className="label-small">Kompletnost</span>
          </div>
          <div className="text-2xl font-bold text-text-dark">{completionRate}%</div>
          <div className="text-xs text-text-light">dat k dispozici</div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl p-4 border border-green-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="label-small">Nejlepší</span>
          </div>
          <div className="text-2xl font-bold text-text-dark">{projectsWithBestValues}</div>
          <div className="text-xs text-text-light">výherních pozic</div>
        </motion.div>
      </div>

      {/* Nejlepší projekty podle indikátorů */}
      {bestProjects.length > 0 && (
        <motion.div
          className="mt-6 p-4 bg-green-50/50 rounded-xl border border-green-100"
          variants={itemVariants}
        >
          <h4 className="font-semibold text-text-dark mb-3">🏆 Nejlepší projekty podle indikátorů</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {bestProjects.slice(0, 6).map(({ indikator, bestProject }, index) => (
              bestProject && (
                <motion.div
                  key={indikator.id}
                  className="flex items-center gap-2 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="best-value-badge">
                    {bestProject.nazev}
                  </span>
                  <span className="text-text-light">- {indikator.nazev}</span>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResultsSummary;
