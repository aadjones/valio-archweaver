// Baldur's Gate 2 Stat Roller - Game Logic

// Game state
let currentStats = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    strExceptional: 0, // For fighters with 18 STR (0-100)
    total: 60
};

let storedStats = null;
let rollCount = 0;
let totalRolledPoints = 60; // Track the original rolled total for point distribution

// DOM elements
const statElements = {
    str: document.getElementById('stat-str'),
    dex: document.getElementById('stat-dex'),
    con: document.getElementById('stat-con'),
    int: document.getElementById('stat-int'),
    wis: document.getElementById('stat-wis'),
    cha: document.getElementById('stat-cha')
};

const strExceptionalElement = document.getElementById('stat-str-exceptional');
const totalElement = document.getElementById('total-value');
const pointsAvailableElement = document.getElementById('points-available');
const rollCountElement = document.getElementById('roll-count');
const rollButton = document.getElementById('roll-button');
const storeButton = document.getElementById('store-button');
const recallButton = document.getElementById('recall-button');

// Get all arrow buttons
const arrowButtons = document.querySelectorAll('.arrow-btn');

// Audio for dice rolling
const diceAudio = new Audio('assets/dice-roll.mp3');

/**
 * Roll a single stat using 4d6 drop lowest (four six-sided dice, drop the lowest)
 * @returns {number} A value between 3 and 18
 */
function rollStat() {
    const dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];

    // Sort and remove the lowest die
    dice.sort((a, b) => a - b);

    // Sum the three highest dice
    return dice[1] + dice[2] + dice[3];
}

/**
 * Roll all six ability scores and calculate total
 * For fighters with 18 STR, also roll exceptional strength (18/01 to 18/00)
 * @returns {object} Object containing all stats and total
 */
function rollAllStats() {
    const stats = {
        str: rollStat(),
        dex: rollStat(),
        con: rollStat(),
        int: rollStat(),
        wis: rollStat(),
        cha: rollStat(),
        strExceptional: 0
    };

    // If fighter has 18 STR, roll exceptional strength (1-100, where 100 displays as 00)
    if (stats.str === 18) {
        stats.strExceptional = Math.floor(Math.random() * 100) + 1;
    }

    stats.total = stats.str + stats.dex + stats.con + stats.int + stats.wis + stats.cha;

    return stats;
}

/**
 * Update the UI to display current stats
 */
function updateDisplay() {
    statElements.str.textContent = currentStats.str;
    statElements.dex.textContent = currentStats.dex;
    statElements.con.textContent = currentStats.con;
    statElements.int.textContent = currentStats.int;
    statElements.wis.textContent = currentStats.wis;
    statElements.cha.textContent = currentStats.cha;

    // Display exceptional strength for fighters with 18 STR
    if (currentStats.str === 18 && currentStats.strExceptional > 0) {
        const displayValue = currentStats.strExceptional === 100 ? '00' : String(currentStats.strExceptional).padStart(2, '0');
        strExceptionalElement.textContent = `/${displayValue}`;
    } else {
        strExceptionalElement.textContent = '';
    }

    totalElement.textContent = currentStats.total;

    // Calculate and display available points
    const pointsAvailable = totalRolledPoints - currentStats.total;
    pointsAvailableElement.textContent = pointsAvailable;

    rollCountElement.textContent = rollCount;

    // Enable/disable recall button based on whether we have stored stats
    recallButton.disabled = storedStats === null;

    // Update arrow button states
    updateArrowButtons();
}

/**
 * Play dice rolling sound effect
 */
function playDiceSound() {
    diceAudio.currentTime = 0; // Reset to start
    diceAudio.play().catch(err => {
        // Silently handle if audio fails to play (e.g., user hasn't interacted yet)
        console.log('Audio play failed:', err);
    });
}

/**
 * Handle Re-Roll button click
 */
function handleReRoll() {
    currentStats = rollAllStats();
    totalRolledPoints = currentStats.total; // Update the pool when rolling
    rollCount++;
    updateDisplay();
    playDiceSound();
}

/**
 * Handle Store button click
 */
function handleStore() {
    storedStats = { ...currentStats };
    updateDisplay();

    // Visual feedback
    storeButton.textContent = 'Stored!';
    setTimeout(() => {
        storeButton.textContent = 'Store';
    }, 1000);
}

/**
 * Handle Recall button click
 */
function handleRecall() {
    if (storedStats !== null) {
        currentStats = { ...storedStats };
        totalRolledPoints = currentStats.total; // Update pool to match recalled stats
        updateDisplay();

        // Visual feedback
        recallButton.textContent = 'Recalled!';
        setTimeout(() => {
            recallButton.textContent = 'Recall';
        }, 1000);
    }
}

/**
 * Update arrow button enabled/disabled states
 */
function updateArrowButtons() {
    arrowButtons.forEach(btn => {
        const stat = btn.dataset.stat;
        const isUp = btn.classList.contains('arrow-up');
        const currentValue = currentStats[stat];

        if (isUp) {
            // Can only increase if: stat < 18 AND current total < rolled total (have points to spend)
            const canIncrease = currentValue < 18 && currentStats.total < totalRolledPoints;
            btn.disabled = !canIncrease;
        } else {
            // Can always decrease if stat > 3 (to free up points for redistribution)
            btn.disabled = currentValue <= 3;
        }
    });
}

/**
 * Handle arrow button clicks to adjust stats
 */
function handleArrowClick(e) {
    const btn = e.currentTarget;
    const stat = btn.dataset.stat;
    const isUp = btn.classList.contains('arrow-up');

    if (isUp && currentStats[stat] < 18) {
        currentStats[stat]++;
        // Don't change total - user must decrease another stat to balance

        // If we just increased STR to 18, roll exceptional strength
        if (stat === 'str' && currentStats[stat] === 18) {
            currentStats.strExceptional = Math.floor(Math.random() * 100) + 1;
        }
    } else if (!isUp && currentStats[stat] > 3) {
        currentStats[stat]--;
        // Don't change total - user can now increase another stat

        // If we just decreased STR from 18, clear exceptional strength
        if (stat === 'str' && currentStats[stat] === 17) {
            currentStats.strExceptional = 0;
        }
    }

    // Recalculate total
    currentStats.total = currentStats.str + currentStats.dex + currentStats.con +
        currentStats.int + currentStats.wis + currentStats.cha;

    updateDisplay();
}

// Event listeners
rollButton.addEventListener('click', handleReRoll);
storeButton.addEventListener('click', handleStore);
recallButton.addEventListener('click', handleRecall);
arrowButtons.forEach(button => button.addEventListener('click', handleArrowClick));

// Keyboard shortcuts for convenience
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
        e.preventDefault();
        handleReRoll();
    } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStore();
    } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleRecall();
    }
});

// Initialize with a roll
handleReRoll();
