/* ========================================
   Oblique Map Strategies - Allmaps Integration
   allmaps.js - Fetches random georeferenced maps from Allmaps
   ======================================== */

// ========================================
// Allmaps API Configuration
// Based on allmaps/arcade implementation
// ========================================
const ALLMAPS_CONFIG = {
    // Allmaps API endpoint for fetching maps
    apiBase: 'https://api.allmaps.org',
    
    // Number of maps to fetch per request
    fetchLimit: 100,
    
    // Cache for fetched maps to enable faster shuffling
    mapCache: [],
    
    // Index for tracking position in cache
    cacheIndex: 0
};

// ========================================
// Fetch Maps from Allmaps
// ========================================

/**
 * Fetch a batch of random georeferenced maps from Allmaps
 * Populates the cache for faster subsequent selections
 * @returns {Promise<Array>} Array of map objects
 */
async function fetchMapsFromAllmaps() {
    try {
        // Allmaps API endpoint for random maps
        // This follows the pattern from allmaps/arcade
        const response = await fetch(
            `${ALLMAPS_CONFIG.apiBase}/maps?random=true&limit=${ALLMAPS_CONFIG.fetchLimit}`
        );
        
        if (!response.ok) {
            throw new Error(`Allmaps API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract map items from response
        // Allmaps returns maps in a 'items' or 'maps' array
        const maps = data.items || data.maps || data;
        
        console.log(`Fetched ${maps.length} maps from Allmaps`);
        
        return maps;
        
    } catch (error) {
        console.error('Error fetching from Allmaps:', error);
        throw error;
    }
}

/**
 * Get a random map from the cache or fetch new maps if needed
 * @returns {Promise<Object>} A random map object with metadata
 */
async function fetchRandomMap() {
    try {
        // If cache is empty or exhausted, fetch new maps
        if (ALLMAPS_CONFIG.mapCache.length === 0 || 
            ALLMAPS_CONFIG.cacheIndex >= ALLMAPS_CONFIG.mapCache.length) {
            
            console.log('Fetching new maps from Allmaps...');
            const maps = await fetchMapsFromAllmaps();
            
            // Shuffle the maps for variety
            ALLMAPS_CONFIG.mapCache = shuffleArray(maps);
            ALLMAPS_CONFIG.cacheIndex = 0;
        }
        
        // Get next map from cache
        const rawMap = ALLMAPS_CONFIG.mapCache[ALLMAPS_CONFIG.cacheIndex];
        ALLMAPS_CONFIG.cacheIndex++;
        
        // Process and normalize the map data
        const processedMap = await processMapData(rawMap);
        
        return processedMap;
        
    } catch (error) {
        console.error('Error getting random map:', error);
        return null;
    }
}

// ========================================
// Map Data Processing
// ========================================

/**
 * Process and normalize map data from Allmaps response
 * Extracts metadata and IIIF manifest information
 * @param {Object} rawMap - Raw map object from Allmaps API
 * @returns {Promise<Object>} Normalized map object
 */
async function processMapData(rawMap) {
    try {
        console.log('Raw map data:', rawMap); // Debug log
        
        // Extract metadata from nested structure
        const resource = rawMap.resource;
        const partOf = resource?.partOf?.[0];
        const canvas = partOf;
        const manifest = canvas?.partOf?.[0];
        
        const mapData = {
            // Core identifiers
            id: rawMap.id || 'unknown',
            
            // IIIF information
            manifestUrl: manifest?.id || resource?.id || null,
            manifest: null,
            
            // Image service URL
            imageService: resource?.id || resource?.uri || null,
            
            // Georeferencing data
            georeference: rawMap,
            
            // Metadata - extract from nested IIIF structure
            title: extractLabel(manifest?.label) || extractLabel(canvas?.label) || 'Untitled Map',
            date: 'Date unknown', // Allmaps doesn't provide date in this structure
            creator: 'Unknown', // Allmaps doesn't provide creator in this structure
            institution: 'Unknown', // Would need to fetch full manifest for this
            sourceUrl: manifest?.id || resource?.id || null,
            
            // Raw data
            raw: rawMap
        };
        
        console.log('Processed map data:', mapData);
        
        return mapData;
        
    } catch (error) {
        console.error('Error processing map data:', error);
        return {
            id: 'unknown',
            title: 'Map data unavailable',
            date: 'Unknown',
            creator: 'Unknown',
            institution: 'Unknown',
            sourceUrl: null,
            raw: rawMap
        };
    }
}

/**
 * Extract label from IIIF label structure
 * IIIF labels can be objects with language keys
 */
function extractLabel(label) {
    if (!label) return null;
    
    // If it's a string, return it
    if (typeof label === 'string') return label;
    
    // If it's an object with 'none' key (common in IIIF)
    if (label.none && Array.isArray(label.none)) {
        return label.none[0];
    }
    
    // If it has other language keys, get the first value
    const keys = Object.keys(label);
    if (keys.length > 0 && Array.isArray(label[keys[0]])) {
        return label[keys[0]][0];
    }
    
    return null;
}

// ========================================
// Metadata Extraction Helpers
// ========================================

/**
 * Extract IIIF image service URL from map data
 */
function extractImageService(rawMap, manifest) {
    // Try Allmaps structure first
    if (rawMap.image?.uri) {
        return rawMap.image.uri;
    }
    
    // Try IIIF manifest structure
    if (manifest?.sequences?.[0]?.canvases?.[0]?.images?.[0]?.resource?.service) {
        const service = manifest.sequences[0].canvases[0].images[0].resource.service;
        return service['@id'] || service.id;
    }
    
    return null;
}

/**
 * Extract title from map data or IIIF manifest
 */
function extractTitle(rawMap, manifest) {
    // Try various title fields
    return rawMap.title || 
           rawMap.label ||
           manifest?.label ||
           manifest?.metadata?.find(m => m.label === 'Title')?.value ||
           'Untitled Map';
}

/**
 * Extract date from map data or IIIF manifest
 */
function extractDate(rawMap, manifest) {
    return rawMap.date ||
           rawMap.created ||
           manifest?.metadata?.find(m => m.label === 'Date')?.value ||
           manifest?.navDate ||
           'Date unknown';
}

/**
 * Extract creator/cartographer from map data
 */
function extractCreator(rawMap, manifest) {
    return rawMap.creator ||
           rawMap.author ||
           manifest?.metadata?.find(m => m.label === 'Creator')?.value ||
           manifest?.metadata?.find(m => m.label === 'Author')?.value ||
           'Unknown';
}

/**
 * Extract institution/repository from map data
 */
function extractInstitution(rawMap, manifest) {
    return rawMap.institution ||
           rawMap.provider ||
           manifest?.metadata?.find(m => m.label === 'Repository')?.value ||
           manifest?.provider?.label ||
           'Unknown';
}

/**
 * Extract source URL for viewing original
 */
function extractSourceUrl(rawMap, manifest) {
    return rawMap.url ||
           rawMap.homepage ||
           manifest?.related ||
           manifest?.['@id'] ||
           null;
}

// ========================================
// Utility Functions
// ========================================

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled copy of array
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
 * Clear the map cache (useful for forcing fresh data)
 */
function clearMapCache() {
    ALLMAPS_CONFIG.mapCache = [];
    ALLMAPS_CONFIG.cacheIndex = 0;
}

/**
 * Get cache statistics (useful for debugging)
 */
function getCacheStats() {
    return {
        total: ALLMAPS_CONFIG.mapCache.length,
        current: ALLMAPS_CONFIG.cacheIndex,
        remaining: ALLMAPS_CONFIG.mapCache.length - ALLMAPS_CONFIG.cacheIndex
    };
}