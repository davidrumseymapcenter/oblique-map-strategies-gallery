/* ========================================
   Oblique Map Strategies - Prompts Module
   prompts.js - Manages prompt data and selection
   ======================================== */

// ========================================
// Prompts Data
// Single-map analysis prompts
// To add new prompts: simply add strings to this array
// ========================================
const PROMPTS = [
    "Find three things that make the map seem accurate or credible.",
    "Note three things about the map's physical properties.",
    "List three cartographic details or decorations included on the map.",
    "Name three salient or defining features of the map.",
    "Name three things the map could have included but are left out.",
    "Name three odd, weird, or confusing things on or about the map.",
    "Find three things that hint at the intended audience for this map.",
    "Find three things that suggest bias by the cartographer.",
    "Find three valuable pieces of information on the map.",
    "Find three things to fact-check about this map.",
    "Find three clues about how this map was intended to be used.",
    "Find three things that tell you something about the mapmaker.",
    "Choose three words to describe how this map makes you feel.",
    "Name three design choices the author(s) made when creating this map.",
    "Name three possible audiences for this map.",
    "Name three possible reasons for making this map.",
    "Find three things you could remove from the map without changing its meaning.",
    "Note three things about the writing on the map.",
    "Find three things that are persuasive about the map.",
    "Name three things that are beautiful about the map.",
    "Find three Wikipedia pages related to things on this map.",
    "Name three things that could be the subject of this map.",
    "Find three things to Google that could help explain this map.",
    "List three possible answers to the question \"what is this map about?\"",
    "List three ways this map could be used as propaganda.",
    "Name three different roles, jobs, or sets of skills required to produce this map.",
    "Suggest three changes that could make this map more useful.",
    "Whose names are on the map, if any? Try to find out something about them.",
    "Find three details in the map that make you ask \"why the heck is this on here?\"",
    "Pick a map. Try to find a another map of the same place and time online.",
    "Note three aesthetic choices made on the map and say what you like or don't like about them.",
    "Describe three ways people are depicted (or not) on the map.",
    "Come up with a hypothetical argument that the map could help prove.",
    "Try to find another map by the same author online."
];

// ========================================
// Prompt Selection State
// Track recently used prompts to avoid immediate repeats
// ========================================
const promptHistory = {
    recentPrompts: [],
    maxHistorySize: 5 // Number of prompts to remember and avoid
};

// ========================================
// Core Functions
// ========================================

/**
 * Get a random prompt from the collection
 * Avoids recently shown prompts if possible
 * @returns {string} A random prompt text
 */
function getRandomPrompt() {
    // If we haven't shown many prompts yet, just pick randomly
    if (promptHistory.recentPrompts.length < PROMPTS.length - 1) {
        return getRandomPromptSimple();
    }
    
    // Filter out recently used prompts
    const availablePrompts = PROMPTS.filter(
        prompt => !promptHistory.recentPrompts.includes(prompt)
    );
    
    // If all prompts have been used recently, reset history
    if (availablePrompts.length === 0) {
        promptHistory.recentPrompts = [];
        return getRandomPromptSimple();
    }
    
    // Pick from available prompts
    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    const selectedPrompt = availablePrompts[randomIndex];
    
    // Add to history
    addToPromptHistory(selectedPrompt);
    
    return selectedPrompt;
}

/**
 * Simple random prompt selection (no history checking)
 * @returns {string} A random prompt text
 */
function getRandomPromptSimple() {
    const randomIndex = Math.floor(Math.random() * PROMPTS.length);
    const selectedPrompt = PROMPTS[randomIndex];
    
    addToPromptHistory(selectedPrompt);
    
    return selectedPrompt;
}

/**
 * Add a prompt to the recent history
 * Maintains a fixed-size history to avoid immediate repeats
 * @param {string} prompt - The prompt to add to history
 */
function addToPromptHistory(prompt) {
    promptHistory.recentPrompts.push(prompt);
    
    // Keep history size under limit
    if (promptHistory.recentPrompts.length > promptHistory.maxHistorySize) {
        promptHistory.recentPrompts.shift(); // Remove oldest
    }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Get total number of prompts available
 * @returns {number} Total prompt count
 */
function getPromptCount() {
    return PROMPTS.length;
}

/**
 * Get all prompts (useful for export or admin features)
 * @returns {Array<string>} Copy of all prompts
 */
function getAllPrompts() {
    return [...PROMPTS];
}

/**
 * Get a specific prompt by index
 * @param {number} index - The index of the prompt
 * @returns {string|null} The prompt text or null if index invalid
 */
function getPromptByIndex(index) {
    if (index >= 0 && index < PROMPTS.length) {
        return PROMPTS[index];
    }
    return null;
}

/**
 * Reset prompt history (useful for testing or reset features)
 */
function resetPromptHistory() {
    promptHistory.recentPrompts = [];
}

// ========================================
// Instructions for Adding New Prompts
// ========================================

/*
 * TO ADD NEW PROMPTS:
 * 
 * 1. Add new prompt strings to the PROMPTS array above
 * 2. Ensure prompts are formatted as questions or instructions
 * 3. Keep prompts focused on single-map analysis
 * 4. No code changes needed elsewhere - the random selection
 *    will automatically include new prompts
 * 
 * PROMPT GUIDELINES:
 * - Use imperative voice ("Find...", "Name...", "Describe...")
 * - Ask for specific, countable observations (often "three things")
 * - Encourage close looking and critical thinking
 * - Vary between factual observation and interpretive analysis
 * 
 * EXAMPLE:
 * PROMPTS.push("Find three examples of exaggeration on this map.");
 */