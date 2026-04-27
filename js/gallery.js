/* ========================================
   Oblique Map Strategies (Gallery Version)
   gallery.js - Fetches maps from a IIIF Collection/Gallery
   ======================================== */

// ========================================
// Gallery Configuration
// ========================================
const GALLERY_CONFIG = {
    // Default gallery URL - American West S26
    defaultGalleryUrl: 'https://raw.githubusercontent.com/davidrumseymapcenter/set-builder/main/manifests/American%20West%20S26-gallery.json',
    
    // Current gallery data
    currentGallery: null,
    manifests: [],
    currentIndex: 0,
    
    // Cache
    manifestCache: new Map()
};

/**
 * Get gallery URL from URL parameter or use default
 * @returns {string} Gallery URL to load
 */
function getGalleryUrlFromParams() {
    const params = new URLSearchParams(window.location.search);
    const galleryParam = params.get('gallery');
    
    if (galleryParam) {
        console.log('Loading gallery from URL parameter:', galleryParam);
        return galleryParam;
    }
    
    console.log('No gallery parameter found, using default');
    return GALLERY_CONFIG.defaultGalleryUrl;
}

// ========================================
// Fetch Gallery from GitHub
// ========================================

/**
 * Load gallery JSON from URL
 * @param {string} url - URL to gallery JSON (optional, will check URL params)
 * @returns {Promise<Object>} Gallery collection object
 */
async function loadGallery(url = null) {
    try {
        // If no URL provided, check URL parameters first, then fall back to default
        if (!url) {
            url = getGalleryUrlFromParams();
        }
        
        console.log('Loading gallery from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to load gallery: ${response.status}`);
        }
        
        const gallery = await response.json();
        
        // Store gallery data
        GALLERY_CONFIG.currentGallery = gallery;
        
        // Extract manifest URLs from items
        if (gallery.items && Array.isArray(gallery.items)) {
            GALLERY_CONFIG.manifests = gallery.items.map(item => item['@id'] || item.id);
            console.log(`Loaded ${GALLERY_CONFIG.manifests.length} manifests from gallery`);
        } else {
            throw new Error('Gallery has no items array');
        }
        
        // Shuffle manifests for variety
        GALLERY_CONFIG.manifests = shuffleArray(GALLERY_CONFIG.manifests);
        GALLERY_CONFIG.currentIndex = 0;
        
        return gallery;
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        throw error;
    }
}

// ========================================
// Get Random Map from Gallery
// ========================================

/**
 * Get next random map from the gallery
 * @returns {Promise<Object>} Processed map data
 */
async function fetchRandomMap() {
    try {
        // Load gallery if not already loaded
        if (!GALLERY_CONFIG.manifests || GALLERY_CONFIG.manifests.length === 0) {
            await loadGallery();
        }
        
        // Get next manifest URL
        const manifestUrl = GALLERY_CONFIG.manifests[GALLERY_CONFIG.currentIndex];
        GALLERY_CONFIG.currentIndex = (GALLERY_CONFIG.currentIndex + 1) % GALLERY_CONFIG.manifests.length;
        
        // Check cache first
        if (GALLERY_CONFIG.manifestCache.has(manifestUrl)) {
            console.log('Using cached manifest');
            return GALLERY_CONFIG.manifestCache.get(manifestUrl);
        }
        
        // Fetch and process manifest
        const mapData = await fetchAndProcessManifest(manifestUrl);
        
        // Cache it
        GALLERY_CONFIG.manifestCache.set(manifestUrl, mapData);
        
        return mapData;
        
    } catch (error) {
        console.error('Error fetching random map:', error);
        return null;
    }
}

// ========================================
// Fetch and Process Individual Manifest
// ========================================

/**
 * Fetch a IIIF manifest and extract map data
 * @param {string} manifestUrl - URL to IIIF manifest
 * @returns {Promise<Object>} Processed map data
 */
async function fetchAndProcessManifest(manifestUrl) {
    try {
        console.log('Fetching manifest:', manifestUrl);
        
        const response = await fetch(manifestUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.status}`);
        }
        
        const manifest = await response.json();
        
        // Process based on manifest type (handles both Stanford and Rumsey formats)
        return processManifest(manifest, manifestUrl);
        
    } catch (error) {
        console.error('Error fetching manifest:', error);
        throw error;
    }
}

// ========================================
// Process IIIF Manifest
// ========================================

/**
 * Process IIIF manifest to extract usable data
 * Handles both IIIF Presentation 2 and 3, Stanford and Rumsey formats
 * @param {Object} manifest - IIIF manifest
 * @param {string} manifestUrl - Original manifest URL
 * @returns {Object} Normalized map data
 */
function processManifest(manifest, manifestUrl) {
    try {
        // Get first canvas/sequence
        const canvas = getFirstCanvas(manifest);
        
        if (!canvas) {
            throw new Error('No canvas found in manifest');
        }
        
        // Extract image service URL
        const imageService = extractImageService(canvas);
        
        // Extract metadata
        const metadata = extractMetadata(manifest);
        
        const mapData = {
            id: manifest['@id'] || manifest.id || manifestUrl,
            manifestUrl: manifestUrl,
            manifest: manifest,
            
            // Image info for OpenSeadragon
            imageService: imageService,
            
            // Metadata
            title: metadata.title || 'Untitled Map',
            date: metadata.date || 'Date unknown',
            creator: metadata.creator || 'Unknown',
            institution: metadata.institution || 'Unknown',
            sourceUrl: metadata.viewUrl || manifestUrl, // Use viewUrl, fallback to manifest
            
            // Raw data
            raw: manifest
        };
        
        console.log('Processed manifest:', mapData);
        
        return mapData;
        
    } catch (error) {
        console.error('Error processing manifest:', error);
        return {
            id: manifestUrl,
            title: 'Error loading map',
            date: 'Unknown',
            creator: 'Unknown',
            institution: 'Unknown',
            sourceUrl: manifestUrl,
            raw: manifest
        };
    }
}

// ========================================
// Helper Functions for Manifest Parsing
// ========================================

/**
 * Get first canvas from manifest (handles both IIIF 2 and 3)
 */
function getFirstCanvas(manifest) {
    // IIIF Presentation 3
    if (manifest.items && manifest.items[0]) {
        return manifest.items[0];
    }
    
    // IIIF Presentation 2
    if (manifest.sequences && manifest.sequences[0] && manifest.sequences[0].canvases) {
        return manifest.sequences[0].canvases[0];
    }
    
    return null;
}

/**
 * Extract image service URL from canvas
 */
function extractImageService(canvas) {
    // Try IIIF 2 structure
    if (canvas.images && canvas.images[0]) {
        const resource = canvas.images[0].resource;
        if (resource) {
            if (resource.service) {
                const service = Array.isArray(resource.service) ? resource.service[0] : resource.service;
                return service['@id'] || service.id;
            }
            return resource['@id'] || resource.id;
        }
    }
    
    // Try IIIF 3 structure
    if (canvas.items && canvas.items[0] && canvas.items[0].items) {
        const body = canvas.items[0].items[0].body;
        if (body && body.service) {
            const service = Array.isArray(body.service) ? body.service[0] : body.service;
            return service['@id'] || service.id;
        }
    }
    
    return null;
}

/**
 * Extract metadata from manifest
 * Enhanced to handle Stanford and Rumsey formats better
 */
function extractMetadata(manifest) {
    const metadata = {
        title: null,
        date: null,
        creator: null,
        institution: null,
        viewUrl: null
    };
    
    // Get label (title)
    metadata.title = extractLabel(manifest.label);
    
    // Extract viewing URL (not manifest URL)
    // Stanford uses 'related', Rumsey uses 'related' or has it in metadata
    if (manifest.related) {
        metadata.viewUrl = typeof manifest.related === 'string' ? 
            manifest.related : 
            manifest.related['@id'] || manifest.related.id;
    }
    
    // Parse metadata array
    if (manifest.metadata && Array.isArray(manifest.metadata)) {
        manifest.metadata.forEach(item => {
            const label = extractLabel(item.label);
            const value = extractLabel(item.value);
            
            if (label && value) {
                const labelLower = label.toLowerCase();
                
                // Date variations - Rumsey uses "Date", Stanford uses "Date" or "Pub Date"
                if (labelLower === 'date' || 
                    labelLower.includes('pub date') ||
                    labelLower.includes('publication date')) {
                    if (!metadata.date || labelLower === 'date') { // Prefer exact "Date"
                        metadata.date = value;
                    }
                }
                
                // Creator variations - Rumsey uses "Author", Stanford uses "Contributor" or "Creator"
                if (labelLower === 'author' ||
                    labelLower === 'authors' ||
                    labelLower === 'creator' || 
                    labelLower.includes('contributor')) {
                    if (!metadata.creator || labelLower === 'author') { // Prefer "Author"
                        metadata.creator = value;
                    }
                }
                
                // Institution variations
                if (labelLower.includes('institution') || 
                    labelLower.includes('repository') || 
                    labelLower.includes('relation')) {
                    if (!metadata.institution) {
                        metadata.institution = value;
                    }
                }
                
                // View URL might be in metadata as "Available Online"
                if (labelLower.includes('available online')) {
                    // Extract URL from HTML if needed
                    const urlMatch = value.match(/https?:\/\/[^\s<'"]+/);
                    if (urlMatch) {
                        metadata.viewUrl = urlMatch[0];
                    }
                }
            }
        });
    }
    
    // Try attribution for institution if not found
    if (!metadata.institution && manifest.attribution) {
        metadata.institution = extractLabel(manifest.attribution);
    }
    
    // Rumsey: check canvas metadata for additional info if main metadata didn't have it
    if (!metadata.date || !metadata.creator) {
        const canvas = getFirstCanvas(manifest);
        if (canvas && canvas.metadata && Array.isArray(canvas.metadata)) {
            canvas.metadata.forEach(item => {
                const label = extractLabel(item.label);
                const value = extractLabel(item.value);
                
                if (label && value) {
                    const labelLower = label.toLowerCase();
                    
                    if (!metadata.date && labelLower === 'date') {
                        metadata.date = value;
                    }
                    
                    if (!metadata.creator && labelLower === 'author') {
                        metadata.creator = value;
                    }
                }
            });
        }
    }
    
    // If no viewUrl found, try to construct from manifest URL or related field
    if (!metadata.viewUrl && manifest['@id']) {
        // Stanford pattern: manifest URL to PURL
        // https://purl.stanford.edu/xx123xx1234/iiif/manifest -> https://purl.stanford.edu/xx123xx1234
        const stanfordMatch = manifest['@id'].match(/(https:\/\/purl\.stanford\.edu\/[a-z0-9]+)/);
        if (stanfordMatch) {
            metadata.viewUrl = stanfordMatch[1];
        }
    }
    
    return metadata;
}
/**
 * Extract text from IIIF label (handles different formats)
 * Enhanced to clean HTML tags
 */
function extractLabel(label) {
    if (!label) return null;
    
    let text = null;
    
    // String
    if (typeof label === 'string') {
        text = label;
    }
    // Object with language keys
    else if (typeof label === 'object') {
        // Try 'none' key first (common in IIIF)
        if (label.none) {
            text = Array.isArray(label.none) ? label.none[0] : label.none;
        }
        // Try 'en' or '@none'
        else if (label.en) {
            text = Array.isArray(label.en) ? label.en[0] : label.en;
        }
        else if (label['@none']) {
            text = Array.isArray(label['@none']) ? label['@none'][0] : label['@none'];
        }
        // Try first available key
        else {
            const keys = Object.keys(label);
            if (keys.length > 0) {
                const value = label[keys[0]];
                text = Array.isArray(value) ? value[0] : value;
            }
        }
    }
    // Array
    else if (Array.isArray(label)) {
        text = label[0];
    }
    
    // Clean HTML tags if present
    if (text && typeof text === 'string') {
        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        text = textarea.value;
    }
    
    return text;
}

// ========================================
// Utility Functions
// ========================================

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get gallery info
 */
function getGalleryInfo() {
    const label = GALLERY_CONFIG.currentGallery?.label;
    return {
        label: extractLabel(label) || 'Unknown Gallery',
        total: GALLERY_CONFIG.manifests?.length || 0,
        current: GALLERY_CONFIG.currentIndex
    };
}

/**
 * Clear cache (useful for debugging or refresh)
 */
function clearManifestCache() {
    GALLERY_CONFIG.manifestCache.clear();
    console.log('Manifest cache cleared');
}
