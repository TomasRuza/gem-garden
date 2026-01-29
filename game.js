/* ===========================================
   GEM GARDEN - Match 3 Puzzle Game Logic
   With Level System
   =========================================== */

// ===========================================
// GAME CONFIGURATION
// ===========================================

const CONFIG = {
    ROWS: 8,
    COLS: 8,
    NUM_GEM_TYPES: 6,
    POINTS_PER_GEM: 10,
    ANIMATION_DELAY: 300,
    STORAGE_KEY: 'gemGardenProgress'
};

const GEM_SYMBOLS = ['💎', '🔷', '💚', '⭐', '🔮', '🧡'];
const GEM_NAMES = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst', 'Citrine'];

// ===========================================
// GAME STATE
// ===========================================

let grid = [];
let score = 0;
let selectedGem = null;
let isProcessing = false;
let hintTimeout = null;

// Level System State
let currentLevel = 1;
let movesLeft = 20;
let totalMoves = 20;
let gemsCollected = {};  // Track collected gems by type
let totalGemsCollected = 0;
let levelProgress = {};  // Saved progress: { levelId: { completed: true, stars: 3 } }

// ===========================================
// DOM ELEMENTS
// ===========================================

const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const statusElement = document.getElementById('game-status');
const levelElement = document.getElementById('level');

// Goal elements
const currentScoreEl = document.getElementById('current-score');
const targetScoreEl = document.getElementById('target-score');
const movesLeftEl = document.getElementById('moves-left');
const goalScoreEl = document.getElementById('goal-score');
const goalMovesEl = document.getElementById('goal-moves');
const goalGemsEl = document.getElementById('goal-gems');
const goalGemIconEl = document.getElementById('goal-gem-icon');
const gemsCollectedEl = document.getElementById('gems-collected');
const gemsTargetEl = document.getElementById('gems-target');

// Buttons
const levelsBtn = document.getElementById('levels-btn');
const hintBtn = document.getElementById('hint-btn');
const restartBtn = document.getElementById('restart-btn');

// Modals
const levelCompleteModal = document.getElementById('level-complete-modal');
const levelFailedModal = document.getElementById('level-failed-modal');
const levelSelectModal = document.getElementById('level-select-modal');

// ===========================================
// INITIALIZATION
// ===========================================

function initGame() {
    loadProgress();
    loadLevel(currentLevel);
}

function loadLevel(levelId) {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
        console.error('Level not found:', levelId);
        return;
    }

    // Reset state
    currentLevel = levelId;
    score = 0;
    movesLeft = level.moves;
    totalMoves = level.moves;
    selectedGem = null;
    isProcessing = false;
    gemsCollected = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    totalGemsCollected = 0;
    clearHint();

    // Update UI
    levelElement.textContent = levelId;
    updateScore(0);
    updateGoalsUI(level);
    setStatus(level.description);

    // Create and render board
    createGrid();
    renderBoard();

    // Ensure valid moves exist
    if (!hasValidMoves()) {
        shuffleBoard();
    }

    // Hide any open modals
    hideAllModals();
}

function updateGoalsUI(level) {
    const goals = level.goals;

    // Score goal
    if (goals.score) {
        goalScoreEl.classList.remove('hidden');
        targetScoreEl.textContent = goals.score;
        currentScoreEl.textContent = score;
    } else {
        goalScoreEl.classList.add('hidden');
    }

    // Moves display
    movesLeftEl.textContent = movesLeft;

    // Gem collection goal (primary)
    if (goals.collectGem) {
        goalGemsEl.classList.remove('hidden');
        goalGemIconEl.textContent = GEM_SYMBOLS[goals.collectGem.type];
        gemsTargetEl.textContent = goals.collectGem.count;
        gemsCollectedEl.textContent = gemsCollected[goals.collectGem.type] || 0;
    } else if (goals.collectAny) {
        goalGemsEl.classList.remove('hidden');
        goalGemIconEl.textContent = '💎';
        gemsTargetEl.textContent = goals.collectAny;
        gemsCollectedEl.textContent = totalGemsCollected;
    } else {
        goalGemsEl.classList.add('hidden');
    }
}

// ===========================================
// PROGRESS PERSISTENCE
// ===========================================

function loadProgress() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            levelProgress = data.levelProgress || {};
            currentLevel = data.currentLevel || 1;
        }
    } catch (e) {
        console.warn('Could not load progress:', e);
    }
}

function saveProgress() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
            levelProgress,
            currentLevel
        }));
    } catch (e) {
        console.warn('Could not save progress:', e);
    }
}

function isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    // Level is unlocked if previous level is completed
    return levelProgress[levelId - 1]?.completed === true;
}

// ===========================================
// GRID CREATION
// ===========================================

function createGrid() {
    grid = [];
    for (let row = 0; row < CONFIG.ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < CONFIG.COLS; col++) {
            grid[row][col] = getRandomGemWithoutMatch(row, col);
        }
    }
}

function getRandomGemWithoutMatch(row, col) {
    let gemType;
    let attempts = 0;

    do {
        gemType = Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES);
        attempts++;
        if (attempts >= 100) break;
    } while (wouldCreateMatch(row, col, gemType));

    return gemType;
}

function wouldCreateMatch(row, col, gemType) {
    if (col >= 2 && grid[row][col - 1] === gemType && grid[row][col - 2] === gemType) {
        return true;
    }
    if (row >= 2 && grid[row - 1][col] === gemType && grid[row - 2][col] === gemType) {
        return true;
    }
    return false;
}

// ===========================================
// RENDERING
// ===========================================

function renderBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            const gemElement = createGemElement(row, col);
            boardElement.appendChild(gemElement);
        }
    }
}

function createGemElement(row, col) {
    const gem = document.createElement('div');
    const gemType = grid[row][col];

    gem.className = `gem gem-${gemType}`;
    gem.dataset.row = row;
    gem.dataset.col = col;
    gem.textContent = GEM_SYMBOLS[gemType];
    gem.addEventListener('click', () => handleGemClick(row, col));

    return gem;
}

function updateGemElement(row, col) {
    const index = row * CONFIG.COLS + col;
    const gemElement = boardElement.children[index];
    const gemType = grid[row][col];

    gemElement.className = `gem gem-${gemType}`;
    gemElement.textContent = GEM_SYMBOLS[gemType];
}

function getGemElement(row, col) {
    const index = row * CONFIG.COLS + col;
    return boardElement.children[index];
}

// ===========================================
// USER INTERACTION
// ===========================================

function handleGemClick(row, col) {
    if (isProcessing) return;
    clearHint();

    const clickedGem = { row, col };

    if (selectedGem === null) {
        selectGem(row, col);
        return;
    }

    if (selectedGem.row === row && selectedGem.col === col) {
        deselectGem();
        return;
    }

    if (isAdjacent(selectedGem, clickedGem)) {
        trySwap(selectedGem.row, selectedGem.col, row, col);
    } else {
        deselectGem();
        selectGem(row, col);
    }
}

function isAdjacent(pos1, pos2) {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function selectGem(row, col) {
    selectedGem = { row, col };
    getGemElement(row, col).classList.add('selected');
}

function deselectGem() {
    if (selectedGem) {
        getGemElement(selectedGem.row, selectedGem.col).classList.remove('selected');
        selectedGem = null;
    }
}

// ===========================================
// SWAP LOGIC
// ===========================================

async function trySwap(row1, col1, row2, col2) {
    isProcessing = true;
    deselectGem();

    swap(row1, col1, row2, col2);
    updateGemElement(row1, col1);
    updateGemElement(row2, col2);

    const matches = findAllMatches();

    if (matches.length > 0) {
        // Valid move - use a move
        movesLeft--;
        movesLeftEl.textContent = movesLeft;

        // Update moves warning
        if (movesLeft <= 3) {
            goalMovesEl.classList.add('warning');
        }

        setStatus('Nice match!');
        await processMatches(matches);

        // Check win/lose after processing
        checkLevelEnd();
    } else {
        setStatus('No match! Try again.');
        getGemElement(row1, col1).classList.add('invalid');
        getGemElement(row2, col2).classList.add('invalid');

        await delay(CONFIG.ANIMATION_DELAY);

        swap(row1, col1, row2, col2);
        updateGemElement(row1, col1);
        updateGemElement(row2, col2);

        getGemElement(row1, col1).classList.remove('invalid');
        getGemElement(row2, col2).classList.remove('invalid');
    }

    if (!hasValidMoves()) {
        setStatus('No moves left! Shuffling...');
        await delay(500);
        shuffleBoard();
        setStatus('Board shuffled!');
    }

    isProcessing = false;
}

function swap(row1, col1, row2, col2) {
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
}

// ===========================================
// MATCH DETECTION
// ===========================================

function findAllMatches() {
    const matches = new Set();

    // Horizontal
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS - 2; col++) {
            const gemType = grid[row][col];
            if (grid[row][col + 1] === gemType && grid[row][col + 2] === gemType) {
                let matchEnd = col + 2;
                while (matchEnd + 1 < CONFIG.COLS && grid[row][matchEnd + 1] === gemType) {
                    matchEnd++;
                }
                for (let c = col; c <= matchEnd; c++) {
                    matches.add(`${row},${c}`);
                }
                col = matchEnd;
            }
        }
    }

    // Vertical
    for (let col = 0; col < CONFIG.COLS; col++) {
        for (let row = 0; row < CONFIG.ROWS - 2; row++) {
            const gemType = grid[row][col];
            if (grid[row + 1][col] === gemType && grid[row + 2][col] === gemType) {
                let matchEnd = row + 2;
                while (matchEnd + 1 < CONFIG.ROWS && grid[matchEnd + 1][col] === gemType) {
                    matchEnd++;
                }
                for (let r = row; r <= matchEnd; r++) {
                    matches.add(`${r},${col}`);
                }
                row = matchEnd;
            }
        }
    }

    return Array.from(matches).map(pos => {
        const [row, col] = pos.split(',').map(Number);
        return { row, col };
    });
}

// ===========================================
// MATCH PROCESSING
// ===========================================

async function processMatches(matches) {
    let cascadeLevel = 0;

    while (matches.length > 0) {
        cascadeLevel++;

        // Track collected gems
        for (const { row, col } of matches) {
            const gemType = grid[row][col];
            gemsCollected[gemType] = (gemsCollected[gemType] || 0) + 1;
            totalGemsCollected++;
        }

        // Calculate points
        const points = matches.length * CONFIG.POINTS_PER_GEM * cascadeLevel;
        updateScore(points);

        if (cascadeLevel > 1) {
            setStatus(`Cascade x${cascadeLevel}! +${points} points!`, true);
        }

        // Update goals display
        updateGoalsProgress();

        await animateMatches(matches);
        removeMatches(matches);
        await applyGravity();
        await fillEmptySpaces();

        matches = findAllMatches();
    }

    setStatus('Match 3 or more gems!');
}

function updateGoalsProgress() {
    const level = LEVELS.find(l => l.id === currentLevel);
    const goals = level.goals;

    // Update score display
    currentScoreEl.textContent = score;
    if (goals.score && score >= goals.score) {
        goalScoreEl.classList.add('completed');
    }

    // Update gem collection display
    if (goals.collectGem) {
        const collected = gemsCollected[goals.collectGem.type] || 0;
        gemsCollectedEl.textContent = collected;
        if (collected >= goals.collectGem.count) {
            goalGemsEl.classList.add('completed');
        }
    } else if (goals.collectAny) {
        gemsCollectedEl.textContent = totalGemsCollected;
        if (totalGemsCollected >= goals.collectAny) {
            goalGemsEl.classList.add('completed');
        }
    }
}

async function animateMatches(matches) {
    for (const { row, col } of matches) {
        getGemElement(row, col).classList.add('matched');
    }
    await delay(CONFIG.ANIMATION_DELAY);
}

function removeMatches(matches) {
    for (const { row, col } of matches) {
        grid[row][col] = -1;
    }
}

// ===========================================
// GRAVITY & FILLING
// ===========================================

async function applyGravity() {
    let gemsFell = false;

    for (let col = 0; col < CONFIG.COLS; col++) {
        let emptyRow = CONFIG.ROWS - 1;

        for (let row = CONFIG.ROWS - 1; row >= 0; row--) {
            if (grid[row][col] !== -1) {
                if (row !== emptyRow) {
                    grid[emptyRow][col] = grid[row][col];
                    grid[row][col] = -1;
                    gemsFell = true;
                }
                emptyRow--;
            }
        }
    }

    if (gemsFell) {
        renderBoard();
        await delay(CONFIG.ANIMATION_DELAY);
    }
}

async function fillEmptySpaces() {
    let filled = false;

    for (let col = 0; col < CONFIG.COLS; col++) {
        for (let row = 0; row < CONFIG.ROWS; row++) {
            if (grid[row][col] === -1) {
                grid[row][col] = Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES);
                filled = true;
            }
        }
    }

    if (filled) {
        renderBoard();

        for (let row = 0; row < CONFIG.ROWS; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                getGemElement(row, col).classList.add('falling');
            }
        }

        await delay(CONFIG.ANIMATION_DELAY);

        for (let row = 0; row < CONFIG.ROWS; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                getGemElement(row, col).classList.remove('falling');
            }
        }
    }
}

// ===========================================
// LEVEL WIN/LOSE CHECKS
// ===========================================

function checkLevelEnd() {
    const level = LEVELS.find(l => l.id === currentLevel);
    const goals = level.goals;

    // Check if all goals are met
    const goalsComplete = checkAllGoalsComplete(goals);

    if (goalsComplete) {
        // Level complete!
        setTimeout(() => showLevelComplete(level), 500);
    } else if (movesLeft <= 0) {
        // Out of moves - check if goals were met
        if (checkAllGoalsComplete(goals)) {
            setTimeout(() => showLevelComplete(level), 500);
        } else {
            setTimeout(() => showLevelFailed(level), 500);
        }
    }
}

function checkAllGoalsComplete(goals) {
    // Check score goal
    if (goals.score && score < goals.score) {
        return false;
    }

    // Check gem collection goals
    if (goals.collectGem) {
        if ((gemsCollected[goals.collectGem.type] || 0) < goals.collectGem.count) {
            return false;
        }
    }

    if (goals.collectGem2) {
        if ((gemsCollected[goals.collectGem2.type] || 0) < goals.collectGem2.count) {
            return false;
        }
    }

    if (goals.collectGem3) {
        if ((gemsCollected[goals.collectGem3.type] || 0) < goals.collectGem3.count) {
            return false;
        }
    }

    if (goals.collectAny && totalGemsCollected < goals.collectAny) {
        return false;
    }

    return true;
}

function calculateStars(level) {
    const thresholds = level.starThresholds;
    let stars = 0;

    if (score >= thresholds[0]) stars = 1;
    if (score >= thresholds[1]) stars = 2;
    if (score >= thresholds[2]) stars = 3;

    return stars;
}

// ===========================================
// MODALS
// ===========================================

function showLevelComplete(level) {
    const stars = calculateStars(level);
    const movesUsed = totalMoves - movesLeft;

    // Update progress
    const existingProgress = levelProgress[level.id] || {};
    levelProgress[level.id] = {
        completed: true,
        stars: Math.max(existingProgress.stars || 0, stars),
        bestScore: Math.max(existingProgress.bestScore || 0, score)
    };
    saveProgress();

    // Update modal
    document.getElementById('final-score').textContent = score;
    document.getElementById('moves-used').textContent = movesUsed;

    // Update stars display
    const starsContainer = document.getElementById('stars');
    const starElements = starsContainer.querySelectorAll('.star');
    starElements.forEach((star, index) => {
        star.classList.remove('earned');
        if (index < stars) {
            setTimeout(() => star.classList.add('earned'), index * 300);
        }
    });

    // Show/hide next level button
    const nextBtn = document.getElementById('next-level-btn');
    if (currentLevel < LEVELS.length) {
        nextBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'none';
    }

    levelCompleteModal.classList.remove('hidden');
}

function showLevelFailed(level) {
    document.getElementById('failed-score').textContent = score;
    document.getElementById('failed-target').textContent = level.goals.score || 'N/A';

    levelFailedModal.classList.remove('hidden');
}

function showLevelSelect() {
    const levelGrid = document.getElementById('level-grid');
    levelGrid.innerHTML = '';

    LEVELS.forEach(level => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';

        const unlocked = isLevelUnlocked(level.id);
        const progress = levelProgress[level.id];

        if (unlocked) {
            btn.classList.add('unlocked');
            if (progress?.completed) {
                btn.classList.add('completed');
            }
            if (level.id === currentLevel) {
                btn.classList.add('current');
            }

            btn.innerHTML = `
                <span>${level.id}</span>
                ${progress?.stars ? `<span class="level-stars">${'⭐'.repeat(progress.stars)}</span>` : ''}
            `;

            btn.addEventListener('click', () => {
                loadLevel(level.id);
                levelSelectModal.classList.add('hidden');
            });
        } else {
            btn.classList.add('locked');
            btn.innerHTML = `<span>🔒</span>`;
        }

        levelGrid.appendChild(btn);
    });

    levelSelectModal.classList.remove('hidden');
}

function hideAllModals() {
    levelCompleteModal.classList.add('hidden');
    levelFailedModal.classList.add('hidden');
    levelSelectModal.classList.add('hidden');
    goalScoreEl.classList.remove('completed');
    goalGemsEl.classList.remove('completed');
    goalMovesEl.classList.remove('warning');
}

// ===========================================
// VALID MOVES CHECK
// ===========================================

function hasValidMoves() {
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (col < CONFIG.COLS - 1) {
                swap(row, col, row, col + 1);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row, col + 1);
                if (hasMatch) return true;
            }
            if (row < CONFIG.ROWS - 1) {
                swap(row, col, row + 1, col);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row + 1, col);
                if (hasMatch) return true;
            }
        }
    }
    return false;
}

function findValidMove() {
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (col < CONFIG.COLS - 1) {
                swap(row, col, row, col + 1);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row, col + 1);
                if (hasMatch) return { row1: row, col1: col, row2: row, col2: col + 1 };
            }
            if (row < CONFIG.ROWS - 1) {
                swap(row, col, row + 1, col);
                const hasMatch = findAllMatches().length > 0;
                swap(row, col, row + 1, col);
                if (hasMatch) return { row1: row, col1: col, row2: row + 1, col2: col };
            }
        }
    }
    return null;
}

function shuffleBoard() {
    const gems = [];
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            gems.push(grid[row][col]);
        }
    }

    for (let i = gems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gems[i], gems[j]] = [gems[j], gems[i]];
    }

    let index = 0;
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            grid[row][col] = gems[index++];
        }
    }

    renderBoard();

    if (!hasValidMoves()) {
        shuffleBoard();
    }
}

// ===========================================
// HINT SYSTEM
// ===========================================

function showHint() {
    if (isProcessing) return;
    clearHint();

    const move = findValidMove();
    if (move) {
        getGemElement(move.row1, move.col1).classList.add('hint');
        getGemElement(move.row2, move.col2).classList.add('hint');
        hintTimeout = setTimeout(clearHint, 2000);
    }
}

function clearHint() {
    if (hintTimeout) {
        clearTimeout(hintTimeout);
        hintTimeout = null;
    }
    document.querySelectorAll('.gem.hint').forEach(gem => gem.classList.remove('hint'));
}

// ===========================================
// SCORING & UI
// ===========================================

function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
}

function setStatus(message, isCascade = false) {
    statusElement.textContent = message;
    if (isCascade) {
        statusElement.classList.add('cascade');
        setTimeout(() => statusElement.classList.remove('cascade'), 500);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// EVENT LISTENERS
// ===========================================

levelsBtn.addEventListener('click', showLevelSelect);
hintBtn.addEventListener('click', showHint);
restartBtn.addEventListener('click', () => loadLevel(currentLevel));

// Level Complete Modal buttons
document.getElementById('next-level-btn').addEventListener('click', () => {
    if (currentLevel < LEVELS.length) {
        loadLevel(currentLevel + 1);
    }
});
document.getElementById('modal-levels-btn').addEventListener('click', () => {
    hideAllModals();
    showLevelSelect();
});

// Level Failed Modal buttons
document.getElementById('retry-btn').addEventListener('click', () => loadLevel(currentLevel));
document.getElementById('failed-levels-btn').addEventListener('click', () => {
    hideAllModals();
    showLevelSelect();
});

// Level Select Modal close
document.getElementById('close-levels-btn').addEventListener('click', () => {
    levelSelectModal.classList.add('hidden');
});

// ===========================================
// START THE GAME
// ===========================================

initGame();
console.log('Gem Garden loaded with Level System!');
