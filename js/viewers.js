/* ========================================
   Oblique Map Strategies - Viewer Management
   viewers.js - Initializes and manages OpenSeadragon viewer
   ======================================== */

// ========================================
// Viewer Instance
// ========================================
let openSeadragonViewer = null;

// ========================================
// OpenSeadragon Viewer Setup
// ========================================

/**
 * Initialize OpenSeadragon viewer for image analysis
 * @param {Object} mapData - Processed map data with IIIF info
 */
function initializeOpenSeadragonViewer(mapData) {
    try {
        // Destroy existing viewer if present
        if (openSeadragonViewer) {
            openSeadragonViewer.destroy();
            openSeadragonViewer = null;
        }
        
        // Check if we have image service URL
        if (!mapData.imageService && !mapData.manifestUrl) {
            console.error('No image service or manifest URL available');
            showViewerError('image-viewer', 'Image not available for this map');
            return;
        }
        
        // Configure OpenSeadragon
        const viewerConfig = {
            id: 'image-viewer',
            prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@4.1.0/build/openseadragon/images/',
            
            // Tile source - use IIIF image service
            tileSources: mapData.imageService + '/info.json',
            
            // Viewer settings for optimal map viewing
            showNavigationControl: true,
            navigationControlAnchor: OpenSeadragon.ControlAnchor.TOP_RIGHT,
            showNavigator: false, // Remove zoom extent preview
            
            // Zoom settings
            minZoomLevel: 0.5,
            maxZoomLevel: 10,
            visibilityRatio: 1.0,
            constrainDuringPan: true,
            
            // Performance settings
            immediateRender: false,
            blendTime: 0.1,
            
            // Gesture settings
            gestureSettingsMouse: {
                clickToZoom: false,
                dblClickToZoom: true
            },
            gestureSettingsTouch: {
                pinchToZoom: true,
                flickEnabled: true
            }
        };
        
        // Initialize OpenSeadragon
        openSeadragonViewer = OpenSeadragon(viewerConfig);
        
        // Add event handlers
        openSeadragonViewer.addHandler('open', function() {
            console.log('OpenSeadragon viewer loaded successfully');
        });
        
        openSeadragonViewer.addHandler('open-failed', function(event) {
            console.error('Failed to open image:', event);
            showViewerError('image-viewer', 'Failed to load image');
        });
        
    } catch (error) {
        console.error('Error initializing OpenSeadragon:', error);
        showViewerError('image-viewer', 'Error loading image viewer');
    }
}

// ========================================
// Viewer Initialization
// ========================================

/**
 * Initialize viewer with map data
 * @param {Object} mapData - Processed map data
 */
async function initializeViewers(mapData) {
    try {
        initializeOpenSeadragonViewer(mapData);
    } catch (error) {
        console.error('Error initializing viewer:', error);
    }
}

// ========================================
// Error Handling
// ========================================

/**
 * Display error message in viewer container
 * @param {string} viewerId - ID of viewer container
 * @param {string} message - Error message to display
 */
function showViewerError(viewerId, message) {
    const viewerElement = document.getElementById(viewerId);
    viewerElement.innerHTML = `
        <div class="viewer-error" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center;">
            <p style="margin-bottom: 1rem; font-size: 1.1rem;">${message}</p>
            <button class="btn btn-secondary" onclick="location.reload()">
                Reload Page
            </button>
        </div>
    `;
}

// ========================================
// Screenshot/Export Helpers
// ========================================

/**
 * Capture screenshot of OpenSeadragon viewer
 * Returns base64 encoded image data
 * @returns {Promise<string>} Base64 image data
 */
async function captureImageViewerScreenshot() {
    try {
        if (!openSeadragonViewer) {
            throw new Error('OpenSeadragon viewer not initialized');
        }
        
        // Get the canvas element from OpenSeadragon
        const canvas = openSeadragonViewer.drawer.canvas;
        
        // Convert to base64
        return canvas.toDataURL('image/png');
        
    } catch (error) {
        console.error('Error capturing image viewer screenshot:', error);
        return null;
    }
}