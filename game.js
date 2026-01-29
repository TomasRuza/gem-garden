/* ===========================================
   GEM GARDEN - Match 3 Puzzle Game Logic
   ===========================================

   This file contains all the game mechanics:
   - Grid representation and initialization
   - Match detection (3+ in a row/column)
   - Gem removal and gravity
   - Score tracking
   - User interaction handling

   =========================================== */

// ===========================================
// GAME CONFIGURATION
// ===========================================

const CONFIG = {
    ROWS: 8,              // Number of rows in the grid
    COLS: 8,              // Number of columns in the grid
    NUM_GEM_TYPES: 6,     // Number of different gem colors
    POINTS_PER_GEM: 10,   // Base points for each matched gem
    ANIMATION_DELAY: 300, // Milliseconds for animations
};

// Gem symbols for display (using emoji for visual appeal)
const GEM_SYMBOLS = ['💎', '🔷', '💚', '⭐', '🔮', '🧡'];

// ===========================================
// GAME STATE
// ===========================================

let grid = [];           // 2D array representing the game board
let score = 0;           // Current player score
let selectedGem = null;  // Currently selected gem {row, col}
let isProcessing = false; // Prevents input during animations
let hintTimeout = null;  // Timer for hint animation

// ===========================================
// DOM ELEMENTS
// ===========================================

const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const statusElement = document.getElementById('game-status');
const newGameBtn = document.getElementById('new-game-btn');
const hintBtn = document.getElementById('hint-btn');

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize a new game
 * - Creates empty grid
 * - Fills with random gems (avoiding initial matches)
 * - Renders the board
 */
function initGame() {
    // Reset game state
    score = 0;
    selectedGem = null;
    isProcessing = false;
    clearHint();

    // Update score display
    updateScore(0);
    setStatus('Match 3 or more gems!');

    // Create and fill the grid
    createGrid();

    // Render the board
    renderBoard();

    // Check if there are valid moves (should always be true for new game)
    if (!hasValidMoves()) {
        shuffleBoard();
    }
}

/**
 * Create the grid and fill with random gems
 * Ensures no matches exist at the start
 */
function createGrid() {
    grid = [];

    for (let row = 0; row < CONFIG.ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < CONFIG.COLS; col++) {
            // Generate a gem that doesn't create an immediate match
            grid[row][col] = getRandomGemWithoutMatch(row, col);
        }
    }
}

/**
 * Generate a random gem type that won't create a match at position
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {number} Gem type (0 to NUM_GEM_TYPES-1)
 */
function getRandomGemWithoutMatch(row, col) {
    let gemType;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        gemType = Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES);
        attempts++;

        // Safety check to prevent infinite loop
        if (attempts >= maxAttempts) break;

    } while (wouldCreateMatch(row, col, gemType));

    return gemType;
}

/**
 * Check if placing a gem would create a match
 * Only checks left and up (since we fill top-to-bottom, left-to-right)
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @param {number} gemType - Type of gem to check
 * @returns {boolean} True if it would create a match
 */
function wouldCreateMatch(row, col, gemType) {
    // Check horizontal (2 gems to the left)
    if (col >= 2) {
        if (grid[row][col - 1] === gemType &&
            grid[row][col - 2] === gemType) {
            return true;
        }
    }

    // Check vertical (2 gems above)
    if (row >= 2) {
        if (grid[row - 1][col] === gemType &&
            grid[row - 2][col] === gemType) {
            return true;
        }
    }

    return false;
}

// ===========================================
// RENDERING
// ===========================================

/**
 * Render the entire game board
 * Creates gem elements for each cell in the grid
 */
function renderBoard() {
    boardElement.innerHTML = '';

    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            const gemElement = createGemElement(row, col);
            boardElement.appendChild(gemElement);
        }
    }
}

/**
 * Create a single gem DOM element
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {HTMLElement} The gem element
 */
function createGemElement(row, col) {
    const gem = document.createElement('div');
    const gemType = grid[row][col];

    gem.className = `gem gem-${gemType}`;
    gem.dataset.row = row;
    gem.dataset.col = col;
    gem.textContent = GEM_SYMBOLS[gemType];

    // Add click handler
    gem.addEventListener('click', () => handleGemClick(row, col));

    return gem;
}

/**
 * Update a single gem's appearance
 * @param {number} row - Row position
 * @param {number} col - Column position
 */
function updateGemElement(row, col) {
    const index = row * CONFIG.COLS + col;
    const gemElement = boardElement.children[index];
    const gemType = grid[row][col];

    // Update class and content
    gemElement.className = `gem gem-${gemType}`;
    gemElement.textContent = GEM_SYMBOLS[gemType];
}

/**
 * Get the DOM element for a specific gem
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {HTMLElement} The gem element
 */
function getGemElement(row, col) {
    const index = row * CONFIG.COLS + col;
    return boardElement.children[index];
}

// ===========================================
// USER INTERACTION
// ===========================================

/**
 * Handle when a gem is clicked
 * @param {number} row - Row of clicked gem
 * @param {number} col - Column of clicked gem
 */
function handleGemClick(row, col) {
    // Ignore clicks while processing animations
    if (isProcessing) return;

    // Clear any hint animation
    clearHint();

    const clickedGem = { row, col };

    // If no gem is selected, select this one
    if (selectedGem === null) {
        selectGem(row, col);
        return;
    }

    // If clicking the same gem, deselect it
    if (selectedGem.row === row && selectedGem.col === col) {
        deselectGem();
        return;
    }

    // Check if the clicked gem is adjacent to selected gem
    if (isAdjacent(selectedGem, clickedGem)) {
        // Try to swap the gems
        trySwap(selectedGem.row, selectedGem.col, row, col);
    } else {
        // Not adjacent - select the new gem instead
        deselectGem();
        selectGem(row, col);
    }
}

/**
 * Check if two positions are adjacent (horizontally or vertically)
 * @param {Object} pos1 - First position {row, col}
 * @param {Object} pos2 - Second position {row, col}
 * @returns {boolean} True if adjacent
 */
function isAdjacent(pos1, pos2) {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // Adjacent means exactly one step away (not diagonal)
    return (rowDiff === 1 && colDiff === 0) ||
           (rowDiff === 0 && colDiff === 1);
}

/**
 * Select a gem (highlight it)
 * @param {number} row - Row position
 * @param {number} col - Column position
 */
function selectGem(row, col) {
    selectedGem = { row, col };
    const gemElement = getGemElement(row, col);
    gemElement.classList.add('selected');
}

/**
 * Deselect the currently selected gem
 */
function deselectGem() {
    if (selectedGem) {
        const gemElement = getGemElement(selectedGem.row, selectedGem.col);
        gemElement.classList.remove('selected');
        selectedGem = null;
    }
}

// ===========================================
// SWAP LOGIC
// ===========================================

/**
 * Attempt to swap two gems
 * If the swap creates a match, process it
 * If not, swap back (invalid move)
 * @param {number} row1 - First gem row
 * @param {number} col1 - First gem column
 * @param {number} row2 - Second gem row
 * @param {number} col2 - Second gem column
 */
async function trySwap(row1, col1, row2, col2) {
    isProcessing = true;
    deselectGem();

    // Perform the swap in the grid
    swap(row1, col1, row2, col2);

    // Update visual representation
    updateGemElement(row1, col1);
    updateGemElement(row2, col2);

    // Check for matches
    const matches = findAllMatches();

    if (matches.length > 0) {
        // Valid move - process matches
        setStatus('Nice match!');
        await processMatches(matches);
    } else {
        // Invalid move - swap back
        setStatus('No match! Try again.');

        // Add shake animation
        getGemElement(row1, col1).classList.add('invalid');
        getGemElement(row2, col2).classList.add('invalid');

        await delay(CONFIG.ANIMATION_DELAY);

        // Swap back
        swap(row1, col1, row2, col2);
        updateGemElement(row1, col1);
        updateGemElement(row2, col2);

        // Remove shake animation
        getGemElement(row1, col1).classList.remove('invalid');
        getGemElement(row2, col2).classList.remove('invalid');
    }

    // Check if there are any valid moves left
    if (!hasValidMoves()) {
        setStatus('No moves left! Shuffling...');
        await delay(500);
        shuffleBoard();
        setStatus('Board shuffled! Keep playing!');
    }

    isProcessing = false;
}

/**
 * Swap two gems in the grid
 * @param {number} row1 - First gem row
 * @param {number} col1 - First gem column
 * @param {number} row2 - Second gem row
 * @param {number} col2 - Second gem column
 */
function swap(row1, col1, row2, col2) {
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
}

// ===========================================
// MATCH DETECTION
// ===========================================

/**
 * Find all matches on the board
 * A match is 3 or more gems of the same type in a row or column
 * @returns {Array} Array of matched positions [{row, col}, ...]
 */
function findAllMatches() {
    const matches = new Set(); // Use Set to avoid duplicates

    // Check horizontal matches
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS - 2; col++) {
            const gemType = grid[row][col];

            // Check if next 2 gems match
            if (grid[row][col + 1] === gemType &&
                grid[row][col + 2] === gemType) {

                // Found a match! Find how far it extends
                let matchEnd = col + 2;
                while (matchEnd + 1 < CONFIG.COLS &&
                       grid[row][matchEnd + 1] === gemType) {
                    matchEnd++;
                }

                // Add all matched positions
                for (let c = col; c <= matchEnd; c++) {
                    matches.add(`${row},${c}`);
                }

                // Skip to end of this match
                col = matchEnd;
            }
        }
    }

    // Check vertical matches
    for (let col = 0; col < CONFIG.COLS; col++) {
        for (let row = 0; row < CONFIG.ROWS - 2; row++) {
            const gemType = grid[row][col];

            // Check if next 2 gems match
            if (grid[row + 1][col] === gemType &&
                grid[row + 2][col] === gemType) {

                // Found a match! Find how far it extends
                let matchEnd = row + 2;
                while (matchEnd + 1 < CONFIG.ROWS &&
                       grid[matchEnd + 1][col] === gemType) {
                    matchEnd++;
                }

                // Add all matched positions
                for (let r = row; r <= matchEnd; r++) {
                    matches.add(`${r},${col}`);
                }

                // Skip to end of this match
                row = matchEnd;
            }
        }
    }

    // Convert Set back to array of objects
    return Array.from(matches).map(pos => {
        const [row, col] = pos.split(',').map(Number);
        return { row, col };
    });
}

// ===========================================
// MATCH PROCESSING
// ===========================================

/**
 * Process matches: remove gems, apply gravity, fill, check for cascades
 * @param {Array} matches - Array of matched positions
 */
async function processMatches(matches) {
    let cascadeLevel = 0;

    while (matches.length > 0) {
        cascadeLevel++;

        // Calculate points (more for cascades!)
        const points = matches.length * CONFIG.POINTS_PER_GEM * cascadeLevel;
        updateScore(points);

        // Show cascade message
        if (cascadeLevel > 1) {
            setStatus(`Cascade x${cascadeLevel}! +${points} points!`, true);
        }

        // Animate matched gems
        await animateMatches(matches);

        // Remove matched gems (set to -1)
        removeMatches(matches);

        // Apply gravity (gems fall down)
        await applyGravity();

        // Fill empty spaces with new gems
        await fillEmptySpaces();

        // Check for new matches (cascade)
        matches = findAllMatches();
    }

    setStatus('Match 3 or more gems!');
}

/**
 * Animate matched gems (pop effect)
 * @param {Array} matches - Array of matched positions
 */
async function animateMatches(matches) {
    // Add matched class to all matched gems
    for (const { row, col } of matches) {
        const gemElement = getGemElement(row, col);
        gemElement.classList.add('matched');
    }

    // Wait for animation to complete
    await delay(CONFIG.ANIMATION_DELAY);
}

/**
 * Remove matched gems from the grid
 * @param {Array} matches - Array of matched positions
 */
function removeMatches(matches) {
    for (const { row, col } of matches) {
        grid[row][col] = -1; // -1 represents empty
    }
}

// ===========================================
// GRAVITY & FILLING
// ===========================================

/**
 * Apply gravity - make gems fall into empty spaces
 */
async function applyGravity() {
    let gemsFell = false;

    // Process each column from bottom to top
    for (let col = 0; col < CONFIG.COLS; col++) {
        let emptyRow = CONFIG.ROWS - 1;

        // Find empty spaces and shift gems down
        for (let row = CONFIG.ROWS - 1; row >= 0; row--) {
            if (grid[row][col] !== -1) {
                // This cell has a gem
                if (row !== emptyRow) {
                    // Move gem down to empty position
                    grid[emptyRow][col] = grid[row][col];
                    grid[row][col] = -1;
                    gemsFell = true;
                }
                emptyRow--;
            }
        }
    }

    // Update display
    if (gemsFell) {
        renderBoard();
        await delay(CONFIG.ANIMATION_DELAY);
    }
}

/**
 * Fill empty spaces at the top with new random gems
 */
async function fillEmptySpaces() {
    let filled = false;

    for (let col = 0; col < CONFIG.COLS; col++) {
        for (let row = 0; row < CONFIG.ROWS; row++) {
            if (grid[row][col] === -1) {
                // Generate new random gem
                grid[row][col] = Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES);
                filled = true;
            }
        }
    }

    // Update display with falling animation
    if (filled) {
        renderBoard();

        // Add falling animation to new gems
        for (let col = 0; col < CONFIG.COLS; col++) {
            for (let row = 0; row < CONFIG.ROWS; row++) {
                const gemElement = getGemElement(row, col);
                gemElement.classList.add('falling');
            }
        }

        await delay(CONFIG.ANIMATION_DELAY);

        // Remove falling class
        for (let col = 0; col < CONFIG.COLS; col++) {
            for (let row = 0; row < CONFIG.ROWS; row++) {
                const gemElement = getGemElement(row, col);
                gemElement.classList.remove('falling');
            }
        }
    }
}

// ===========================================
// VALID MOVES CHECK
// ===========================================

/**
 * Check if there are any valid moves left on the board
 * @returns {boolean} True if at least one valid move exists
 */
function hasValidMoves() {
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            // Try swapping with right neighbor
            if (col < CONFIG.COLS - 1) {
                swap(row, col, row, col + 1);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row, col + 1); // Undo

                if (hasMatch) return true;
            }

            // Try swapping with bottom neighbor
            if (row < CONFIG.ROWS - 1) {
                swap(row, col, row + 1, col);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row + 1, col); // Undo

                if (hasMatch) return true;
            }
        }
    }

    return false;
}

/**
 * Find one valid move (for hint system)
 * @returns {Object|null} {row1, col1, row2, col2} or null if no moves
 */
function findValidMove() {
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            // Try swapping with right neighbor
            if (col < CONFIG.COLS - 1) {
                swap(row, col, row, col + 1);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row, col + 1); // Undo

                if (hasMatch) {
                    return { row1: row, col1: col, row2: row, col2: col + 1 };
                }
            }

            // Try swapping with bottom neighbor
            if (row < CONFIG.ROWS - 1) {
                swap(row, col, row + 1, col);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row + 1, col); // Undo

                if (hasMatch) {
                    return { row1: row, col1: col, row2: row + 1, col2: col };
                }
            }
        }
    }

    return null;
}

/**
 * Shuffle the board when no valid moves exist
 */
function shuffleBoard() {
    // Collect all gem types
    const gems = [];
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            gems.push(grid[row][col]);
        }
    }

    // Shuffle using Fisher-Yates algorithm
    for (let i = gems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gems[i], gems[j]] = [gems[j], gems[i]];
    }

    // Put gems back in grid
    let index = 0;
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            grid[row][col] = gems[index++];
        }
    }

    // Render the new board
    renderBoard();

    // If still no valid moves, try again (rare but possible)
    if (!hasValidMoves()) {
        shuffleBoard();
    }
}

// ===========================================
// HINT SYSTEM
// ===========================================

/**
 * Show a hint by highlighting a valid move
 */
function showHint() {
    if (isProcessing) return;

    clearHint();

    const move = findValidMove();
    if (move) {
        const gem1 = getGemElement(move.row1, move.col1);
        const gem2 = getGemElement(move.row2, move.col2);

        gem1.classList.add('hint');
        gem2.classList.add('hint');

        // Auto-clear hint after 2 seconds
        hintTimeout = setTimeout(clearHint, 2000);
    }
}

/**
 * Clear the hint animation
 */
function clearHint() {
    if (hintTimeout) {
        clearTimeout(hintTimeout);
        hintTimeout = null;
    }

    // Remove hint class from all gems
    const hints = document.querySelectorAll('.gem.hint');
    hints.forEach(gem => gem.classList.remove('hint'));
}

// ===========================================
// SCORING & UI
// ===========================================

/**
 * Update the score display
 * @param {number} points - Points to add
 */
function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
}

/**
 * Set the status message
 * @param {string} message - Message to display
 * @param {boolean} isCascade - Whether this is a cascade message
 */
function setStatus(message, isCascade = false) {
    statusElement.textContent = message;

    if (isCascade) {
        statusElement.classList.add('cascade');
        setTimeout(() => statusElement.classList.remove('cascade'), 500);
    }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Promise-based delay function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// EVENT LISTENERS
// ===========================================

// New Game button
newGameBtn.addEventListener('click', initGame);

// Hint button
hintBtn.addEventListener('click', showHint);

// ===========================================
// START THE GAME
// ===========================================

// Initialize when page loads
initGame();

console.log('Gem Garden loaded! Enjoy the game!');
