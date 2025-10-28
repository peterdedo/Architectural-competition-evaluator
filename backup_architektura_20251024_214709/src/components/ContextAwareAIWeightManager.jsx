import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Settings, 
  History, 
  Star,
  Zap,
  BarChart3,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useWizard } from '../contexts/WizardContext';

const ContextAwareAIWeightManager = ({
  indicators,
  proposals,
  currentWeights = {},
  categoryWeights = {},
  onWeightsUpdate,
  onCategoryWeightsUpdate,
  className = ""
}) => {
  // Použitie WizardContext pre globálnu synchronizáciu (s fallback)
  let updateWeights = null;
  let weights = {};
  let globalCategoryWeights = {};
  
  try {
    const wizardContext = useWizard();
    updateWeights = wizardContext.updateWeights;
    weights = wizardContext.weights || {};
    globalCategoryWeights = wizardContext.categoryWeights || {};
  } catch (error) {
    // Fallback ak WizardContext nie je dostupný
    console.warn('WizardContext nie je dostupný, používam lokálne váhy');
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedWeights, setSuggestedWeights] = useState({});
  const [suggestedCategoryWeights, setSuggestedCategoryWeights] = useState({});
  const [context, setContext] = useState('general');
  const [contextText, setContextText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [history, setHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Context options
  const contextOptions = [
    {
      id: 'general',
      name: 'Všeobecné urbanistické súťaže',
      description: 'Štandardné váhy pre bežné urbanistické projekty',
      icon: Target,
      color: 'blue'
    },
    {
      id: 'residential',
      name: 'Rezidenčné projekty',
      description: 'Optimalizované pre bytovú výstavbu',
      icon: Home,
      color: 'green'
    },
    {
      id: 'commercial',
      name: 'Komerčné projekty',
      description: 'Zamerané na obchodné a kancelárske budovy',
      icon: Building,
      color: 'purple'
    },
    {
      id: 'mixed_use',
      name: 'Zmiešané využitie',
      description: 'Kombinácia bytov, obchodu a služieb',
      icon: Layers,
      color: 'orange'
    },
    {
      id: 'public_space',
      name: 'Verejné priestory',
      description: 'Parky, námestia a verejné budovy',
      icon: TreePine,
      color: 'emerald'
    },
    {
      id: 'sustainability',
      name: 'Udržateľnosť',
      description: 'Zamerané na ekologické aspekty',
      icon: Leaf,
      color: 'green'
    }
  ];

  // Analyze project data to determine context
  const analyzeProjectContext = useMemo(() => {
    if (!proposals || proposals.length === 0) return 'general';
    
    const analysis = {
      totalArea: 0,
      residentialArea: 0,
      commercialArea: 0,
      publicArea: 0,
      greenArea: 0,
      sustainabilityIndicators: 0
    };
    
    proposals.forEach(proposal => {
      const data = proposal.data || {};
      
      // Analyze area distribution
      if (data.celkova_plocha?.value) analysis.totalArea += data.celkova_plocha.value;
      if (data.byty_plocha?.value) analysis.residentialArea += data.byty_plocha.value;
      if (data.obchod_plocha?.value) analysis.commercialArea += data.obchod_plocha.value;
      if (data.zelena_plocha?.value) analysis.greenArea += data.zelena_plocha.value;
      
      // Count sustainability indicators
      const sustainabilityKeys = ['energeticka_efektivnost', 'vodni_cyklus', 'recyklace', 'zelena_strecha'];
      sustainabilityKeys.forEach(key => {
        if (data[key]?.value !== null && data[key]?.value !== undefined) {
          analysis.sustainabilityIndicators++;
        }
      });
    });
    
    // Determine context based on analysis
    if (analysis.sustainabilityIndicators > 2) return 'sustainability';
    if (analysis.greenArea / analysis.totalArea > 0.3) return 'public_space';
    if (analysis.commercialArea > analysis.residentialArea) return 'commercial';
    if (analysis.residentialArea > analysis.commercialArea * 2) return 'residential';
    if (analysis.commercialArea > 0 && analysis.residentialArea > 0) return 'mixed_use';
    
    return 'general';
  }, [proposals]);

  // Bezpečné parsovanie AI výstupu
  const safeParseAIResponse = (responseText) => {
    let parsedWeights;
    try {
      parsedWeights = JSON.parse(responseText);
    } catch (e) {
      console.error("AI response JSON error:", e);
      // Oprava bežných JSON chýb
      const fixed = responseText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Pridanie úvodzoviek k kľúčom
        .replace(/:\s*([^",{\[\s][^,}\]\s]*)/g, ': "$1"'); // Pridanie úvodzoviek k hodnotám
      
      try {
        parsedWeights = JSON.parse(fixed);
      } catch (e2) {
        console.error("Failed to fix JSON:", e2);
        return null;
      }
    }
    return parsedWeights;
  };

  // Mapovanie váh podľa interní štruktúry
  const mapWeightsToInternalStructure = (parsedWeights, criteriaSchema) => {
    if (!parsedWeights || !criteriaSchema) return { weights: {}, categoryWeights: {} };
    
    const mappedWeights = {};
    const mappedCategoryWeights = {};
    
    // Mapovanie váh kategórií
    criteriaSchema.forEach(cat => {
      const categoryWeight = parsedWeights[cat.name] ?? cat.defaultWeight ?? 25;
      mappedCategoryWeights[cat.id] = Number.isFinite(categoryWeight) ? categoryWeight : 25;
      
      // Mapovanie váh indikátorov v kategórii
      if (cat.indicators) {
        cat.indicators.forEach(ind => {
          const indicatorWeight = parsedWeights[ind.name] ?? ind.defaultWeight ?? 10;
          mappedWeights[ind.id] = Number.isFinite(indicatorWeight) ? indicatorWeight : 10;
        });
      }
    });
    
    return { weights: mappedWeights, categoryWeights: mappedCategoryWeights };
  };

  // Generate AI suggestions based on context
  const generateSuggestions = async () => {
    setIsGenerating(true);
    setIsAnalyzing(true);
    
    try {
      // Ak je zadaný kontextový text, použij OpenAI API
      if (contextText.trim()) {
        await generateContextualSuggestions();
        return;
      }
      
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get context-specific weights
      const contextWeights = getContextWeights(context);
      const contextCategoryWeights = getContextCategoryWeights(context);
      
      // Analyze project characteristics
      const projectAnalysis = analyzeProjectCharacteristics();
      
      // Generate suggestions with confidence scoring
      const suggestions = generateWeightSuggestions(contextWeights, projectAnalysis);
      const categorySuggestions = generateCategorySuggestions(contextCategoryWeights, projectAnalysis);
      
      setSuggestedWeights(suggestions.weights);
      setSuggestedCategoryWeights(categorySuggestions.weights);
      setConfidence(suggestions.confidence);
      setExplanation(suggestions.explanation);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        context,
        timestamp: new Date(),
        confidence: suggestions.confidence,
        weights: suggestions.weights,
        categoryWeights: categorySuggestions.weights
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  };

  // Generate contextual suggestions using OpenAI
  const generateContextualSuggestions = async () => {
    try {
      const apiKey = localStorage.getItem('apiKey') || localStorage.getItem('openai_api_key');
      if (!apiKey) {
        throw new Error('OpenAI API kľúč nie je nastavený');
      }

      const prompt = `
        Na základe tohto kontextu: "${contextText}"
        navrhni optimálne rozdelenie váh medzi kategóriami a indikátormi
        pre urbanistickú súťaž. Vráť JSON v tvare:
        {
          "kategorie": { "parkovani": 30, "plochy": 40, "objekty": 30 },
          "indikatory": { "parkovani_celkem": 10, "parkovani_podzemni": 10, "plochy_celkova": 15, "plochy_zastavena": 12, "plochy_zelena": 8, "objekty_byty": 10, "objekty_obchod": 8, "objekty_sluzby": 7 }
        }
        
        Kategórie: parkovani, plochy, objekty
        Indikátory: parkovani_celkem, parkovani_podzemni, plochy_celkova, plochy_zastavena, plochy_zelena, objekty_byty, objekty_obchod, objekty_sluzby
        
        Váhy kategórií musia súčet 100, váhy indikátorov v rámci kategórie musia súčet 100.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parsovanie AI odpovede
      const aiWeights = safeParseAIResponse(content);
      if (aiWeights) {
        setSuggestedWeights(aiWeights.indikatory || {});
        setSuggestedCategoryWeights(aiWeights.kategorie || {});
        setConfidence(85); // Vysoká dôvera v AI odpoveď
        setExplanation(`AI navrhol váhy na základe kontextu: "${contextText}"`);
        
        // Add to history
        const historyEntry = {
          id: Date.now(),
          context: 'custom',
          contextText,
          timestamp: new Date(),
          confidence: 85,
          weights: aiWeights.indikatory || {},
          categoryWeights: aiWeights.kategorie || {}
        };
        setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error generating contextual suggestions:', error);
      throw error;
    }
  };

  // Get context-specific base weights
  const getContextWeights = (contextType) => {
    const baseWeights = {
      general: {
        celkova_plocha: 15,
        zastavena_plocha: 12,
        zelena_plocha: 10,
        byty_pocet: 8,
        byty_plocha: 8,
        obchod_plocha: 6,
        sluzby_plocha: 6,
        parkovani_pocet: 8,
        parkovani_plocha: 6,
        naklady: 10,
        energeticka_efektivnost: 5,
        vodni_cyklus: 3,
        recyklace: 2,
        zelena_strecha: 2,
        doprava_pristupnost: 4,
        verejne_prostory: 3,
        hromadna_doprava: 2
      },
      residential: {
        celkova_plocha: 10,
        zastavena_plocha: 15,
        zelena_plocha: 12,
        byty_pocet: 15,
        byty_plocha: 15,
        obchod_plocha: 3,
        sluzby_plocha: 3,
        parkovani_pocet: 10,
        parkovani_plocha: 8,
        naklady: 8,
        energeticka_efektivnost: 6,
        vodni_cyklus: 4,
        recyklace: 3,
        zelena_strecha: 3,
        doprava_pristupnost: 5,
        verejne_prostory: 4,
        hromadna_doprava: 3
      },
      commercial: {
        celkova_plocha: 12,
        zastavena_plocha: 15,
        zelena_plocha: 8,
        byty_pocet: 2,
        byty_plocha: 2,
        obchod_plocha: 15,
        sluzby_plocha: 15,
        parkovani_pocet: 12,
        parkovani_plocha: 10,
        naklady: 12,
        energeticka_efektivnost: 8,
        vodni_cyklus: 5,
        recyklace: 4,
        zelena_strecha: 3,
        doprava_pristupnost: 8,
        verejne_prostory: 6,
        hromadna_doprava: 6
      },
      sustainability: {
        celkova_plocha: 8,
        zastavena_plocha: 10,
        zelena_plocha: 20,
        byty_pocet: 6,
        byty_plocha: 6,
        obchod_plocha: 4,
        sluzby_plocha: 4,
        parkovani_pocet: 6,
        parkovani_plocha: 5,
        naklady: 8,
        energeticka_efektivnost: 15,
        vodni_cyklus: 12,
        recyklace: 10,
        zelena_strecha: 8,
        doprava_pristupnost: 6,
        verejne_prostory: 8,
        hromadna_doprava: 5
      }
    };
    
    return baseWeights[contextType] || baseWeights.general;
  };

  const getContextCategoryWeights = (contextType) => {
    const baseCategoryWeights = {
      general: {
        "Bilance ploch řešeného území": 40,
        "Bilance HPP dle funkce": 40,
        "Bilance parkovacích ploch": 20
      },
      residential: {
        "Bilance ploch řešeného území": 35,
        "Bilance HPP dle funkce": 45,
        "Bilance parkovacích ploch": 20
      },
      commercial: {
        "Bilance ploch řešeného území": 30,
        "Bilance HPP dle funkce": 50,
        "Bilance parkovacích ploch": 20
      },
      sustainability: {
        "Bilance ploch řešeného území": 50,
        "Bilance HPP dle funkce": 30,
        "Bilance parkovacích ploch": 20
      }
    };
    
    return baseCategoryWeights[contextType] || baseCategoryWeights.general;
  };

  // Analyze project characteristics
  const analyzeProjectCharacteristics = () => {
    if (!proposals || proposals.length === 0) return {};
    
    const analysis = {
      totalProjects: proposals.length,
      averageArea: 0,
      hasResidential: false,
      hasCommercial: false,
      hasSustainability: false,
      complexity: 'medium'
    };
    
    let totalArea = 0;
    let residentialCount = 0;
    let commercialCount = 0;
    let sustainabilityCount = 0;
    
    proposals.forEach(proposal => {
      const data = proposal.data || {};
      
      if (data.celkova_plocha?.value) {
        totalArea += data.celkova_plocha.value;
      }
      
      if (data.byty_plocha?.value && data.byty_plocha.value > 0) {
        residentialCount++;
      }
      
      if (data.obchod_plocha?.value && data.obchod_plocha.value > 0) {
        commercialCount++;
      }
      
      const sustainabilityKeys = ['energeticka_efektivnost', 'vodni_cyklus', 'recyklace', 'zelena_strecha'];
      const hasSustainability = sustainabilityKeys.some(key => 
        data[key]?.value !== null && data[key]?.value !== undefined
      );
      if (hasSustainability) sustainabilityCount++;
    });
    
    analysis.averageArea = totalArea / proposals.length;
    analysis.hasResidential = residentialCount > proposals.length / 2;
    analysis.hasCommercial = commercialCount > proposals.length / 2;
    analysis.hasSustainability = sustainabilityCount > proposals.length / 2;
    
    // Determine complexity
    if (analysis.averageArea > 50000) analysis.complexity = 'high';
    else if (analysis.averageArea < 10000) analysis.complexity = 'low';
    
    return analysis;
  };

  // Generate weight suggestions with confidence scoring
  const generateWeightSuggestions = (baseWeights, analysis) => {
    const suggestions = { ...baseWeights };
    let confidence = 0.8; // Base confidence
    let explanation = `Základné váhy pre ${contextOptions.find(c => c.id === context)?.name.toLowerCase()}.`;
    
    // Adjust weights based on analysis
    if (analysis.hasResidential) {
      suggestions.byty_pocet = Math.min(suggestions.byty_pocet * 1.2, 20);
      suggestions.byty_plocha = Math.min(suggestions.byty_plocha * 1.2, 20);
      confidence += 0.1;
      explanation += " Zvýšené váhy pre bytové ukazovatele kvôli rezidenčnému zameraniu.";
    }
    
    if (analysis.hasCommercial) {
      suggestions.obchod_plocha = Math.min(suggestions.obchod_plocha * 1.3, 20);
      suggestions.sluzby_plocha = Math.min(suggestions.sluzby_plocha * 1.3, 20);
      confidence += 0.1;
      explanation += " Zvýšené váhy pre komerčné ukazovatele kvôli obchodnému zameraniu.";
    }
    
    if (analysis.hasSustainability) {
      suggestions.energeticka_efektivnost = Math.min(suggestions.energeticka_efektivnost * 1.5, 20);
      suggestions.vodni_cyklus = Math.min(suggestions.vodni_cyklus * 1.5, 15);
      suggestions.recyklace = Math.min(suggestions.recyklace * 1.5, 15);
      confidence += 0.15;
      explanation += " Zvýšené váhy pre udržateľnosť kvôli ekologickým aspektom.";
    }
    
    if (analysis.complexity === 'high') {
      suggestions.naklady = Math.min(suggestions.naklady * 1.2, 15);
      confidence += 0.05;
      explanation += " Zvýšená váha nákladov kvôli komplexnosti projektu.";
    }
    
    // Normalize weights to sum to 100
    const totalWeight = Object.values(suggestions).reduce((sum, weight) => sum + weight, 0);
    Object.keys(suggestions).forEach(key => {
      suggestions[key] = Math.round((suggestions[key] / totalWeight) * 100);
    });
    
    return {
      weights: suggestions,
      confidence: Math.min(confidence, 1.0),
      explanation
    };
  };

  const generateCategorySuggestions = (baseCategoryWeights, analysis) => {
    const suggestions = { ...baseCategoryWeights };
    let confidence = 0.8;
    let explanation = `Základné váhy kategórií pre ${contextOptions.find(c => c.id === context)?.name.toLowerCase()}.`;
    
    if (analysis.hasResidential) {
      suggestions["Bilance HPP dle funkce"] = Math.min(suggestions["Bilance HPP dle funkce"] * 1.1, 50);
      confidence += 0.1;
      explanation += " Zvýšená váha funkčného rozdelenia kvôli rezidenčnému zameraniu.";
    }
    
    if (analysis.hasCommercial) {
      suggestions["Bilance HPP dle funkce"] = Math.min(suggestions["Bilance HPP dle funkce"] * 1.2, 55);
      confidence += 0.1;
      explanation += " Zvýšená váha funkčného rozdelenia kvôli komerčnému zameraniu.";
    }
    
    if (analysis.hasSustainability) {
      suggestions["Bilance ploch řešeného území"] = Math.min(suggestions["Bilance ploch řešeného území"] * 1.2, 60);
      confidence += 0.15;
      explanation += " Zvýšená váha plošného rozdelenia kvôli udržateľnosti.";
    }
    
    // Normalize to sum to 100
    const totalWeight = Object.values(suggestions).reduce((sum, weight) => sum + weight, 0);
    Object.keys(suggestions).forEach(key => {
      suggestions[key] = Math.round((suggestions[key] / totalWeight) * 100);
    });
    
    return {
      weights: suggestions,
      confidence: Math.min(confidence, 1.0),
      explanation
    };
  };

  // Apply suggestions - aktualizácia cez WizardContext
  const applySuggestions = () => {
    try {
      // Aktualizuj globálny stav cez WizardContext (ak je dostupný)
      if (updateWeights) {
        updateWeights({
          weights: suggestedWeights,
          categoryWeights: suggestedCategoryWeights
        });
        
        // Zobrazenie úspešnej správy
        console.log("✅ AI váhy úspěšně aplikovány do globálního stavu!");
        
        // Toast notifikácia
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast("AI váhy byly úspěšně aplikovány!", "success");
        }
      }
      
      // Zachovaj kompatibilitu s existujúcimi callback funkciami
      if (onWeightsUpdate) {
        onWeightsUpdate(suggestedWeights);
      }
      if (onCategoryWeightsUpdate) {
        onCategoryWeightsUpdate(suggestedCategoryWeights);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("❌ Chyba při aplikaci váh:", error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast("Chyba při aplikaci váh!", "error");
      }
    }
  };

  // Synchronizácia s globálnym stavom
  useEffect(() => {
    // Načítaj aktuálne váhy z WizardContext pri otvorení
    if (Object.keys(weights).length > 0) {
      setSuggestedWeights(weights);
    }
    if (Object.keys(globalCategoryWeights).length > 0) {
      setSuggestedCategoryWeights(globalCategoryWeights);
    }
  }, [weights, globalCategoryWeights]);

  // Auto-detect context on mount
  useEffect(() => {
    if (analyzeProjectContext !== 'general') {
      setContext(analyzeProjectContext);
    }
  }, [analyzeProjectContext]);

  return (
    <div className={className}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
      >
        <Brain size={20} />
        <span>AI Weight Manager</span>
        {isAnalyzing && <Loader2 size={16} className="animate-spin" />}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Brain size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">AI Weight Manager</h2>
                      <p className="text-purple-100">Inteligentné návrhy váh na základe kontextu projektu</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Context Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontext projektu</h3>
                  
                  {/* Custom Context Text Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vlastný kontext projektu (voliteľné)
                    </label>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      placeholder="Napíšte špecifický kontext vášho projektu, napr.: 'Rezidenčný projekt s dôrazom na zelené plochy a energetickú efektívnosť'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      AI použije tento text na presnejšie navrhnutie váh
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {contextOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = context === option.id;
                      
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setContext(option.id)}
                          className={`
                            p-4 rounded-xl border-2 transition-all duration-200 text-left
                            ${isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent size={20} className={`text-${option.color}-600`} />
                            <span className="font-medium text-gray-900">{option.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateSuggestions}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Generuje sa...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Generovať návrhy
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Results */}
                {Object.keys(suggestedWeights).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Confidence and Explanation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={20} className="text-blue-600" />
                        <span className="font-medium text-blue-900">Analýza a dôveryhodnosť</span>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-700">Dôveryhodnosť:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= confidence * 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                            <span className="text-sm font-medium text-blue-700 ml-2">
                              {(confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-700">{explanation}</p>
                    </div>

                    {/* Suggested Weights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Váhy indikátorov</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {Object.entries(suggestedWeights).map(([key, weight]) => {
                            const indicator = indicators.find(i => i.id === key);
                            if (!indicator) return null;
                            
                            return (
                              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{indicator.name}</div>
                                  <div className="text-xs text-gray-500">{indicator.category}</div>
                                </div>
                                <div className="text-sm font-semibold text-blue-600">{weight}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Váhy kategórií</h4>
                        <div className="space-y-2">
                          {Object.entries(suggestedCategoryWeights).map(([category, weight]) => (
                            <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-900">{category}</div>
                              <div className="text-sm font-semibold text-green-600">{weight}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Zrušiť
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={applySuggestions}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Aplikovať návrhy
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* History */}
                {history.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">História návrhov</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {history.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <History size={16} className="text-gray-400" />
                            <span>{contextOptions.find(c => c.id === entry.context)?.name}</span>
                            <span className="text-gray-500">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-current" />
                            <span>{(entry.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextAwareAIWeightManager;
