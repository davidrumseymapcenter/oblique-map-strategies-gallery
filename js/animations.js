/* ========================================
   Oblique Map Strategies - Animation Effects
   animations.js - Manages visual feedback and animations
   ======================================== */

// ========================================
// Animation Configuration
// ========================================
const ANIMATION_CONFIG = {
    // Shuffle animation duration (milliseconds)
    shuffleDuration: 800,
    
    // Minimum display time for animation (prevents flashing on fast loads)
    minDisplayTime: 500,
    
    // Animation easing
    easing: 'ease-in-out'
};

// ========================================
// Shuffle Animation
// ========================================

/**
 * Enhanced shuffle animation with timing control
 * Ensures animation displays for minimum time even if load is fast
 * @param {Function} callback - Function to execute during shuffle
 * @returns {Promise} Resolves when animation complete
 */
async function animateShuffle(callback) {
    const startTime = Date.now();
    
    // Show animation
    showShuffleOverlay();
    
    // Execute the callback (map/prompt loading)
    if (callback) {
        await callback();
    }
    
    // Calculate remaining time to meet minimum display duration
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, ANIMATION_CONFIG.minDisplayTime - elapsed);
    
    // Wait for remaining time if needed
    if (remaining > 0) {
        await sleep(remaining);
    }
    
    // Hide animation
    hideShuffleOverlay();
}

/**
 * Show shuffle animation overlay
 */
function showShuffleOverlay() {
    const overlay = document.getElementById('shuffle-animation');
    if (overlay) {
        overlay.classList.remove('hidden');
        // Trigger reflow to enable CSS transition
        void overlay.offsetWidth;
        overlay.style.opacity = '1';
    }
}

/**
 * Hide shuffle animation overlay
 */
function hideShuffleOverlay() {
    const overlay = document.getElementById('shuffle-animation');
    if (overlay) {
        overlay.style.opacity = '0';
        // Wait for fade out, then hide
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
    }
}

// ========================================
// Button Interaction Animations
// ========================================

/**
 * Add "pressed" animation to button
 * @param {HTMLElement} button - Button element
 */
function animateButtonPress(button) {
    if (!button) return;
    
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
}

/**
 * Add pulse animation to element
 * @param {HTMLElement} element - Element to animate
 */
function pulseElement(element) {
    if (!element) return;
    
    element.classList.add('pulse');
    
    setTimeout(() => {
        element.classList.remove('pulse');
    }, 600);
}

// ========================================
// Content Transition Animations
// ========================================

/**
 * Fade out element
 * @param {HTMLElement} element - Element to fade
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when fade complete
 */
function fadeOut(element, duration = 300) {
    return new Promise(resolve => {
        if (!element) {
            resolve();
            return;
        }
        
        element.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easing}`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
            resolve();
        }, duration);
    });
}

/**
 * Fade in element
 * @param {HTMLElement} element - Element to fade
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when fade complete
 */
function fadeIn(element, duration = 300) {
    return new Promise(resolve => {
        if (!element) {
            resolve();
            return;
        }
        
        element.style.display = 'block';
        element.style.opacity = '0';
        
        // Trigger reflow
        void element.offsetWidth;
        
        element.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easing}`;
        element.style.opacity = '1';
        
        setTimeout(resolve, duration);
    });
}

/**
 * Slide in element from top
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in milliseconds
 */
function slideInFromTop(element, duration = 400) {
    if (!element) return;
    
    element.style.transform = 'translateY(-20px)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ${ANIMATION_CONFIG.easing}`;
    
    // Trigger reflow
    void element.offsetWidth;
    
    element.style.transform = 'translateY(0)';
    element.style.opacity = '1';
}

// ========================================
// Prompt Change Animation
// ========================================

/**
 * Animate prompt text change
 * @param {HTMLElement} promptElement - Prompt text element
 * @param {string} newText - New prompt text
 */
async function animatePromptChange(promptElement, newText) {
    if (!promptElement) return;
    
    // Fade out old text
    await fadeOut(promptElement, 200);
    
    // Change text
    promptElement.textContent = newText;
    
    // Fade in new text
    await fadeIn(promptElement, 200);
    
    // Add emphasis animation
    slideInFromTop(promptElement, 300);
}

// ========================================
// Map Viewer Transition
// ========================================

/**
 * Animate transition between viewer modes
 * @param {HTMLElement} hideElement - Element to hide
 * @param {HTMLElement} showElement - Element to show
 */
async function transitionViewers(hideElement, showElement) {
    if (!hideElement || !showElement) return;
    
    // Fade out current viewer
    await fadeOut(hideElement, 250);
    
    // Swap visibility classes
    hideElement.classList.remove('active');
    hideElement.classList.add('hidden');
    
    showElement.classList.remove('hidden');
    showElement.classList.add('active');
    
    // Fade in new viewer
    await fadeIn(showElement, 250);
}

// ========================================
// Loading State Animations
// ========================================

/**
 * Show loading spinner on element
 * @param {HTMLElement} element - Container element
 * @returns {HTMLElement} Spinner element (for later removal)
 */
function showLoadingSpinner(element) {
    if (!element) return null;
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-circle"></div>
        <p>Loading...</p>
    `;
    
    element.appendChild(spinner);
    
    return spinner;
}

/**
 * Remove loading spinner
 * @param {HTMLElement} spinner - Spinner element to remove
 */
function hideLoadingSpinner(spinner) {
    if (spinner && spinner.parentNode) {
        fadeOut(spinner, 200).then(() => {
            if (spinner.parentNode) {
                spinner.parentNode.removeChild(spinner);
            }
        });
    }
}

// ========================================
// Success/Error Feedback Animations
// ========================================

/**
 * Show success message with animation
 * @param {string} message - Success message
 * @param {number} duration - How long to display (milliseconds)
 */
function showSuccessMessage(message, duration = 3000) {
    showToast(message, 'success', duration);
}

/**
 * Show error message with animation
 * @param {string} message - Error message
 * @param {number} duration - How long to display (milliseconds)
 */
function showErrorMessage(message, duration = 4000) {
    showToast(message, 'error', duration);
}

/**
 * Generic toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'info')
 * @param {number} duration - Display duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// ========================================
// Utility Functions
// ========================================

/**
 * Sleep/delay utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Request animation frame wrapper
 * @param {Function} callback - Function to call on next frame
 * @returns {number} Animation frame ID
 */
function nextFrame(callback) {
    return requestAnimationFrame(callback);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// Preload Animation Assets
// ========================================

/**
 * Preload any animation-related assets
 * Call this on page load to ensure smooth animations
 */
function preloadAnimationAssets() {
    // Add any preloading logic here if needed
    console.log('Animation system ready');
}

// Initialize animation system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadAnimationAssets);
} else {
    preloadAnimationAssets();
}