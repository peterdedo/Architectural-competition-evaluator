/**
 * Version Manager Utility
 * 
 * Manages project versions for Urban Analytics v2.0
 * - Save project configurations, weights, and results as versions
 * - Restore previous versions
 * - List all saved versions with timestamps
 * 
 * Uses localStorage for persistence
 */

/**
 * Save current project as a new version
 * @param {Object} projectData - Complete project data including config, weights, and results
 * @param {string} versionName - Optional custom name for this version
 * @returns {Object} Saved version info
 */
export const saveVersion = (projectData, versionName = null) => {
  try {
    // Generate version ID
    const versionId = `v_${Date.now()}`;
    
    // Create version object
    const version = {
      id: versionId,
      name: versionName || `Version ${new Date().toLocaleString('cs-CZ')}`,
      timestamp: new Date().toISOString(),
      data: {
        config: projectData.config || {},
        weights: projectData.weights || {},
        categoryWeights: projectData.categoryWeights || {},
        selectedIndicators: projectData.selectedIndicators || [],
        results: projectData.results || [],
        navrhy: projectData.navrhy || []
      }
    };
    
    // Get existing versions
    const existingVersions = getVersions();
    
    // Add new version
    existingVersions.push(version);
    
    // Save to localStorage
    localStorage.setItem('urban_analytics_versions', JSON.stringify(existingVersions));
    
    console.log('[VersionManager] Version saved:', version.name);
    
    return version;
  } catch (error) {
    console.error('[VersionManager] Error saving version:', error);
    throw error;
  }
};

/**
 * Get all saved versions
 * @returns {Array} List of all saved versions
 */
export const getVersions = () => {
  try {
    const versionsJson = localStorage.getItem('urban_analytics_versions');
    if (!versionsJson) return [];
    
    const versions = JSON.parse(versionsJson);
    
    // Sort by timestamp (newest first)
    return versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('[VersionManager] Error getting versions:', error);
    return [];
  }
};

/**
 * Get a specific version by ID
 * @param {string} versionId - Version ID to retrieve
 * @returns {Object|null} Version data or null if not found
 */
export const getVersion = (versionId) => {
  try {
    const versions = getVersions();
    return versions.find(v => v.id === versionId) || null;
  } catch (error) {
    console.error('[VersionManager] Error getting version:', error);
    return null;
  }
};

/**
 * Restore a version (load its data)
 * @param {string} versionId - Version ID to restore
 * @returns {Object} Version data
 */
export const restoreVersion = (versionId) => {
  try {
    const version = getVersion(versionId);
    
    if (!version) {
      throw new Error('Version not found');
    }
    
    console.log('[VersionManager] Restoring version:', version.name);
    
    return version.data;
  } catch (error) {
    console.error('[VersionManager] Error restoring version:', error);
    throw error;
  }
};

/**
 * Delete a version
 * @param {string} versionId - Version ID to delete
 * @returns {boolean} Success status
 */
export const deleteVersion = (versionId) => {
  try {
    let versions = getVersions();
    
    // Filter out the deleted version
    versions = versions.filter(v => v.id !== versionId);
    
    // Save back to localStorage
    localStorage.setItem('urban_analytics_versions', JSON.stringify(versions));
    
    console.log('[VersionManager] Version deleted:', versionId);
    
    return true;
  } catch (error) {
    console.error('[VersionManager] Error deleting version:', error);
    return false;
  }
};

/**
 * Clear all versions
 * @returns {boolean} Success status
 */
export const clearAllVersions = () => {
  try {
    localStorage.removeItem('urban_analytics_versions');
    console.log('[VersionManager] All versions cleared');
    return true;
  } catch (error) {
    console.error('[VersionManager] Error clearing versions:', error);
    return false;
  }
};

/**
 * Get current project as version data
 * @param {Object} wizardContext - WizardContext from useWizard hook
 * @returns {Object} Version data
 */
export const getCurrentProjectData = (wizardContext) => {
  return {
    config: {
      nazev: wizardContext.nazev,
      popis: wizardContext.popis,
      selectedNavrhy: Array.from(wizardContext.vybraneNavrhy)
    },
    weights: wizardContext.weights || {},
    categoryWeights: wizardContext.categoryWeights || {},
    selectedIndicators: wizardContext.vybraneIndikatory ? Array.from(wizardContext.vybraneIndikatory) : [],
    results: wizardContext.results || [],
    navrhy: wizardContext.navrhy || []
  };
};

