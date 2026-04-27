/* ========================================
   Oblique Map Strategies (Gallery Version)
   app.js - Main Application Controller
   ======================================== */

// ========================================
// Application State
// ========================================
const AppState = {
    currentMap: null,
    currentPrompt: null,
    isLoading: false,
    galleryInfo: null
};

// ========================================
// DOM Elements
// ========================================
const DOM = {
    // Viewer
    imageViewer: document.getElementById('image-viewer'),
    
    // Gallery info
    galleryNameLink: document.getElementById('gallery-name-link'),
    galleryName: document.getElementById('gallery-name'),
    currentIndex: document.getElementById('current-index'),
    totalMaps: document.getElementById('total-maps'),
    footerGalleryName: document.getElementById('footer-gallery-name'),
    
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
    console.log('Initializing Oblique Map Strategies (Gallery Version)...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load gallery info first, then shuffle
    loadGalleryInfo().then(() => {
        shuffleBoth();
    }).catch(error => {
        console.error('Error loading gallery:', error);
        alert('Failed to load gallery. Please refresh the page.');
    });
}

// ========================================
// Gallery Info Management
// ========================================
async function loadGalleryInfo() {
    try {
        // Load the gallery (defined in gallery.js)
        await loadGallery();
        
        // Get gallery info
        const info = getGalleryInfo();
        AppState.galleryInfo = info;
        
        // Update display
        updateGalleryDisplay();
        
    } catch (error) {
        console.error('Error loading gallery info:', error);
        throw error;
    }
}

function updateGalleryDisplay() {
    if (AppState.galleryInfo) {
        const label = AppState.galleryInfo.label || 'Unknown Gallery';
        
        DOM.galleryName.textContent = label;
        DOM.footerGalleryName.textContent = label;
        DOM.totalMaps.textContent = AppState.galleryInfo.total;
        DOM.currentIndex.textContent = AppState.galleryInfo.current + 1;
        
        // Set link to open gallery in viewer
        // Construct viewer URL with gallery parameter
        const galleryUrl = getGalleryUrlFromParams(); // from gallery.js
        const viewerUrl = `https://davidrumseymapcenter.github.io/set-builder/viewer.html?file=${encodeURIComponent(galleryUrl)}`;
        DOM.galleryNameLink.href = viewerUrl;
    }
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
        // Fetch random map from gallery (defined in gallery.js)
        const mapData = await fetchRandomMap();
        
        if (!mapData) {
            throw new Error('Failed to fetch map');
        }
        
        AppState.currentMap = mapData;
        
        // Update metadata display
        updateMapMetadata(mapData);
        
        // Update gallery counter
        updateGalleryDisplay();
        
        // Initialize viewer (defined in viewers.js)
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
        updateGalleryDisplay();
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
        analysisText: DOM.analysisText.value,
        galleryName: AppState.galleryInfo?.label || 'Unknown Gallery'
    };
}

// ========================================
// Start Application
// ========================================
document.addEventListener('DOMContentLoaded', init);
