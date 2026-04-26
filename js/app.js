/* ========================================
   Oblique Map Strategies - Main Application Controller
   app.js - Coordinates all modules and manages application state
   ======================================== */

// ========================================
// Application State
// ========================================
const AppState = {
    currentMap: null,
    currentPrompt: null,
    isLoading: false
};

// ========================================
// DOM Elements
// ========================================
const DOM = {
    // Viewer
    imageViewer: document.getElementById('image-viewer'),
    
    // Metadata
    metadataSidebar: document.getElementById('metadata-sidebar'),
    metadataToggleBtn: document.getElementById('metadata-toggle-btn'),
    metadataCloseBtn: document.getElementById('metadata-close-btn'),
    mapTitle: document.getElementById('map-title'),
    mapDate: document.getElementById('map-date'),
    mapCreator: document.getElementById('map-creator'),
    mapInstitution: document.getElementById('map-institution'),
    mapSource: document.getElementById('map-source'),
    
    // Prompt display
    promptText: document.getElementById('prompt-text'),
    
    // Shuffle controls
    newMapBtn: document.getElementById('new-map-btn'),
    newPromptBtn: document.getElementById('new-prompt-btn'),
    shuffleBothBtn: document.getElementById('shuffle-both-btn'),
    shuffleAnimation: document.getElementById('shuffle-animation'),
    
    // Analysis
    analysisText: document.getElementById('analysis-text'),
    
    // Export options
    exportImageView: document.getElementById('export-image-view'),
    exportPrompt: document.getElementById('export-prompt'),
    exportMetadata: document.getElementById('export-metadata'),
    exportAnalysis: document.getElementById('export-analysis'),
    
    // Export buttons
    exportPdfBtn: document.getElementById('export-pdf-btn'),
    exportMarkdownBtn: document.getElementById('export-markdown-btn'),
    exportJsonBtn: document.getElementById('export-json-btn')
};

// ========================================
// Initialization
// ========================================
function init() {
    console.log('Initializing Oblique Map Strategies...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial content
    shuffleBoth();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Metadata toggle
    DOM.metadataToggleBtn.addEventListener('click', toggleMetadata);
    DOM.metadataCloseBtn.addEventListener('click', hideMetadata);
    
    // Shuffle controls
    DOM.newMapBtn.addEventListener('click', loadNewMap);
    DOM.newPromptBtn.addEventListener('click', loadNewPrompt);
    DOM.shuffleBothBtn.addEventListener('click', shuffleBoth);
    
    // Export buttons
    DOM.exportPdfBtn.addEventListener('click', exportAsPDF);
    DOM.exportMarkdownBtn.addEventListener('click', exportAsMarkdown);
    DOM.exportJsonBtn.addEventListener('click', exportAsJSON);
}

// ========================================
// Metadata Sidebar Functions
// ========================================
function toggleMetadata() {
    if (DOM.metadataSidebar.classList.contains('hidden')) {
        showMetadata();
    } else {
        hideMetadata();
    }
}

function showMetadata() {
    DOM.metadataSidebar.classList.remove('hidden');
    DOM.metadataToggleBtn.textContent = 'Hide Metadata';
}

function hideMetadata() {
    DOM.metadataSidebar.classList.add('hidden');
    DOM.metadataToggleBtn.textContent = 'Show Metadata';
}

// ========================================
// Content Loading Functions
// ========================================

/**
 * Load a new random map
 */
async function loadNewMap() {
    if (AppState.isLoading) return;
    
    showShuffleAnimation();
    
    try {
        // Fetch random map from Allmaps (defined in allmaps.js)
        const mapData = await fetchRandomMap();
        
        if (!mapData) {
            throw new Error('Failed to fetch map');
        }
        
        AppState.currentMap = mapData;
        
        // Update metadata display
        updateMapMetadata(mapData);
        
        // Initialize viewers (defined in viewers.js)
        await initializeViewers(mapData);
        
        hideShuffleAnimation();
        
    } catch (error) {
        console.error('Error loading map:', error);
        hideShuffleAnimation();
        alert('Failed to load map. Please try again.');
    }
}

/**
 * Load a new random prompt
 */
function loadNewPrompt() {
    if (AppState.isLoading) return;
    
    showShuffleAnimation();
    
    // Get random prompt (defined in prompts.js)
    const prompt = getRandomPrompt();
    
    AppState.currentPrompt = prompt;
    DOM.promptText.textContent = prompt;
    
    hideShuffleAnimation();
}

/**
 * Shuffle both map and prompt
 */
async function shuffleBoth() {
    if (AppState.isLoading) return;
    
    showShuffleAnimation();
    
    try {
        // Load new prompt (synchronous)
        const prompt = getRandomPrompt();
        AppState.currentPrompt = prompt;
        DOM.promptText.textContent = prompt;
        
        // Load new map (asynchronous)
        const mapData = await fetchRandomMap();
        
        if (!mapData) {
            throw new Error('Failed to fetch map');
        }
        
        AppState.currentMap = mapData;
        updateMapMetadata(mapData);
        await initializeViewers(mapData);
        
        hideShuffleAnimation();
        
    } catch (error) {
        console.error('Error shuffling:', error);
        hideShuffleAnimation();
        alert('Failed to shuffle. Please try again.');
    }
}

// ========================================
// UI Update Functions
// ========================================

/**
 * Update map metadata display
 */
function updateMapMetadata(mapData) {
    DOM.mapTitle.textContent = mapData.title || 'Untitled Map';
    DOM.mapDate.textContent = mapData.date || 'Unknown';
    DOM.mapCreator.textContent = mapData.creator || 'Unknown';
    DOM.mapInstitution.textContent = mapData.institution || 'Unknown';
    DOM.mapSource.href = mapData.sourceUrl || '#';
    DOM.mapSource.textContent = mapData.sourceUrl ? 'View original' : 'Source unavailable';
}

/**
 * Show shuffle animation
 */
function showShuffleAnimation() {
    AppState.isLoading = true;
    DOM.shuffleAnimation.classList.remove('hidden');
}

/**
 * Hide shuffle animation
 */
function hideShuffleAnimation() {
    // Add slight delay for better UX
    setTimeout(() => {
        AppState.isLoading = false;
        DOM.shuffleAnimation.classList.add('hidden');
    }, 500);
}

// ========================================
// Export Functions (delegated to export.js)
// ========================================

/**
 * Export as PDF
 */
function exportAsPDF() {
    const exportOptions = getExportOptions();
    generatePDF(AppState, exportOptions);
}

/**
 * Export as Markdown
 */
function exportAsMarkdown() {
    const exportOptions = getExportOptions();
    generateMarkdown(AppState, exportOptions);
}

/**
 * Export as JSON
 */
function exportAsJSON() {
    const exportOptions = getExportOptions();
    generateJSON(AppState, exportOptions);
}

/**
 * Get selected export options
 */
function getExportOptions() {
    return {
        includeImageView: DOM.exportImageView.checked,
        includePrompt: DOM.exportPrompt.checked,
        includeMetadata: DOM.exportMetadata.checked,
        includeAnalysis: DOM.exportAnalysis.checked,
        analysisText: DOM.analysisText.value
    };
}

// ========================================
// Start Application
// ========================================
document.addEventListener('DOMContentLoaded', init);
