# 🏗️ Architektúra Aplikácie - Urban Analysis App

## 📐 Celková Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│                    Urban Analysis App                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React 18 + Vite)                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   UI Layer      │ │  State Layer    │ │  Data Layer  │  │
│  │                 │ │                 │ │              │  │
│  │ • Components    │ │ • WizardContext │ │ • Indicators │  │
│  │ • Hooks         │ │ • LocalStorage  │ │ • Projects   │  │
│  │ • Styling       │ │ • State Mgmt    │ │ • Results    │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   OpenAI API    │ │   PDF Parser    │ │   File I/O   │  │
│  │                 │ │                 │ │              │  │
│  │ • GPT-4o-mini   │ │ • PDF.js        │ │ • Upload     │  │
│  │ • Chat Complet. │ │ • Text Extract  │ │ • Export     │  │
│  │ • AI Analysis   │ │ • Data Process  │ │ • Storage    │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🧩 Komponentová Architektúra

### 1. Hlavné Komponenty
```
App.jsx
├── Header.jsx
├── Sidebar.jsx
├── WizardTopNav.jsx
└── Main Content
    ├── StepUpload.jsx
    ├── StepCriteria.jsx
    ├── StepResults.jsx
    ├── StepComparison.jsx
    └── AdvancedAIAssistant.jsx
```

### 2. Podporné Komponenty
```
components/
├── AIAssistant.jsx (legacy)
├── ComparisonDashboard.jsx
├── EditIndicatorModal.jsx
├── ErrorBoundary.jsx
├── PdfExportPanel.jsx
├── RadarChartAdvanced.jsx
├── ResultsSummary.jsx
├── StepComparison.jsx
├── Toast.jsx
├── WeightSettings.jsx
└── WeightedHeatmap.jsx
```

## 🔄 State Management

### WizardContext.jsx
```javascript
const WizardContext = {
  // Current step
  currentStep: 1,
  
  // Data
  projects: [],           // Uploaded PDFs
  indicators: [],         // Available indicators
  selectedIndicators: Set,
  selectedProjects: Set,
  
  // Weights
  weights: {},           // Indicator weights
  categoryWeights: {},   // Category weights
  
  // Results
  results: [],           // Calculated scores
  
  // Actions
  setCurrentStep,
  addProject,
  updateProject,
  selectIndicator,
  updateWeights,
  calculateResults
}
```

### Local Storage Persistence
```javascript
// Automatické ukladanie do localStorage
- apiKey: OpenAI API key
- projects: Uploaded projects
- selectedIndicators: Selected criteria
- weights: Weight configuration
- results: Calculated results
```

## 🎯 AI Asistent - Konsolidovaná Architektúra

### useAIAssistant.js Hook
```javascript
const useAIAssistant = (apiKey) => {
  // State
  isAnalyzing: boolean
  analysisProgress: number
  lastAnalysis: string
  
  // Functions
  analyzeComparison(data, context)    // Hlavná analýza
  generateComments(proposals, ...)    // Detailné komentáre
  suggestWeights(criteria, context)   // Návrh vah
  suggestCategoryWeights(categories)  // Návrh vah kategórií
}
```

### AdvancedAIAssistant.jsx
```javascript
// Konsolidovaný AI asistent
- Jednotné rozhranie pre analýzu aj komentáre
- Progress tracking
- Error handling
- Mock data fallback
- HTML formátovanie výstupov
```

## 📊 Data Flow

### 1. Upload Phase
```
PDF Upload → PDF Parser → Text Extraction → Project Object → WizardContext
```

### 2. Criteria Phase
```
Indicator Selection → Weight Configuration → Category Weights → WizardContext
```

### 3. Analysis Phase
```
Project Data + Indicators + Weights → Score Calculation → Results → AI Analysis
```

### 4. AI Processing
```
Results + Context → OpenAI API → AI Analysis + Comments → UI Display
```

## 🔧 Hooks Architektúra

### Custom Hooks
```javascript
useAIAssistant(apiKey)           // AI functionality
useLocalStorage(key, defaultValue) // Persistence
usePdfExport()                   // PDF generation
usePdfProcessor()                // PDF parsing
useToast()                       // Notifications
useVisionAnalyzer()              // OCR processing
```

## 🎨 Styling Architektúra

### Tailwind CSS Classes
```css
/* Design System */
- Primary: purple-600, blue-600
- Secondary: gray-500, gray-600
- Success: green-500, green-600
- Warning: yellow-500, orange-500
- Error: red-500, red-600

/* Layout */
- Container: max-w-6xl, mx-auto
- Cards: rounded-xl, shadow-lg
- Buttons: rounded-lg, transition-all
- Forms: border-gray-300, focus:ring-2
```

### Framer Motion Animations
```javascript
// Page transitions
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}

// Component animations
initial={{ scale: 0.9, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
```

## 🔒 Error Handling

### Error Boundaries
```javascript
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

### API Error Handling
```javascript
try {
  const response = await fetch(apiUrl, options)
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  return await response.json()
} catch (error) {
  console.error('Error:', error)
  return { success: false, error: error.message }
}
```

## 📈 Performance Optimizations

### React Optimizations
```javascript
// Memoization
const memoizedValue = useMemo(() => 
  expensiveCalculation(data), [data]
)

// Callback memoization
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])

// Component memoization
const MemoizedComponent = React.memo(Component)
```

### Bundle Optimization
```javascript
// Vite configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          charts: ['echarts', 'recharts']
        }
      }
    }
  }
})
```

## 🚀 Deployment Architecture

### Development
```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview build
```

### Production
```bash
# Static files served from CDN
# Environment variables for API keys
# HTTPS required for OpenAI API
```

## 🔄 Data Persistence Strategy

### Local Storage
- User preferences
- API keys
- Project data
- Configuration

### Session Storage
- Temporary state
- Form data
- UI state

### Memory
- Calculated results
- AI responses
- Real-time updates

---

**Architektúra je navrhnutá pre:**
- ✅ Škálovateľnosť
- ✅ Udržateľnosť  
- ✅ Výkon
- ✅ Bezpečnosť
- ✅ Použiteľnosť


