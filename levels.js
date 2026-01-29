/* ===========================================
   GEM GARDEN - Level Definitions
   ===========================================

   Each level has:
   - id: Unique level number
   - name: Display name
   - description: Brief description shown before level
   - moves: Maximum moves allowed
   - goals: Object with goal types and targets
   - starThresholds: Score needed for 1, 2, 3 stars

   Goal Types:
   - score: Reach target score
   - collectGem: Collect specific gem type (0-5)
   - collectAny: Collect any gems (total count)

   =========================================== */

const LEVELS = [
    // ===== BEGINNER LEVELS (1-5) =====
    {
        id: 1,
        name: "First Steps",
        description: "Learn the basics! Match gems to score points.",
        moves: 20,
        goals: {
            score: 500
        },
        starThresholds: [500, 800, 1200]
    },
    {
        id: 2,
        name: "Getting Started",
        description: "Keep matching! Reach a higher score.",
        moves: 20,
        goals: {
            score: 1000
        },
        starThresholds: [1000, 1500, 2000]
    },
    {
        id: 3,
        name: "Ruby Hunt",
        description: "Collect red Ruby gems!",
        moves: 15,
        goals: {
            score: 500,
            collectGem: { type: 0, count: 10 }  // 10 Rubies
        },
        starThresholds: [500, 1000, 1500]
    },
    {
        id: 4,
        name: "Sapphire Search",
        description: "Find and match blue Sapphires!",
        moves: 15,
        goals: {
            score: 600,
            collectGem: { type: 1, count: 12 }  // 12 Sapphires
        },
        starThresholds: [600, 1200, 1800]
    },
    {
        id: 5,
        name: "Cascade Training",
        description: "Create chain reactions for bonus points!",
        moves: 18,
        goals: {
            score: 1500
        },
        starThresholds: [1500, 2500, 3500]
    },

    // ===== EASY LEVELS (6-10) =====
    {
        id: 6,
        name: "Emerald Valley",
        description: "Collect green Emeralds from the valley.",
        moves: 18,
        goals: {
            score: 800,
            collectGem: { type: 2, count: 15 }
        },
        starThresholds: [800, 1500, 2200]
    },
    {
        id: 7,
        name: "Golden Touch",
        description: "Gather precious Topaz gems!",
        moves: 16,
        goals: {
            score: 1000,
            collectGem: { type: 3, count: 15 }
        },
        starThresholds: [1000, 1800, 2600]
    },
    {
        id: 8,
        name: "Purple Rain",
        description: "Amethysts are falling! Catch them all!",
        moves: 20,
        goals: {
            collectGem: { type: 4, count: 20 }
        },
        starThresholds: [1000, 2000, 3000]
    },
    {
        id: 9,
        name: "Orange Crush",
        description: "Collect Citrine gems before time runs out!",
        moves: 15,
        goals: {
            score: 1200,
            collectGem: { type: 5, count: 12 }
        },
        starThresholds: [1200, 2000, 2800]
    },
    {
        id: 10,
        name: "Score Master",
        description: "Show your skills! Reach a big score!",
        moves: 25,
        goals: {
            score: 3000
        },
        starThresholds: [3000, 4500, 6000]
    },

    // ===== MEDIUM LEVELS (11-15) =====
    {
        id: 11,
        name: "Dual Collection",
        description: "Collect both Rubies AND Sapphires!",
        moves: 20,
        goals: {
            collectGem: { type: 0, count: 10 },
            collectGem2: { type: 1, count: 10 }
        },
        starThresholds: [1500, 2500, 3500]
    },
    {
        id: 12,
        name: "Gem Frenzy",
        description: "Match as many gems as you can!",
        moves: 22,
        goals: {
            score: 2500,
            collectAny: 50
        },
        starThresholds: [2500, 4000, 5500]
    },
    {
        id: 13,
        name: "Precision Play",
        description: "Limited moves! Make each one count!",
        moves: 12,
        goals: {
            score: 1500
        },
        starThresholds: [1500, 2200, 3000]
    },
    {
        id: 14,
        name: "Rainbow Quest",
        description: "Collect gems of every color!",
        moves: 25,
        goals: {
            collectGem: { type: 0, count: 8 },
            collectGem2: { type: 2, count: 8 },
            collectGem3: { type: 4, count: 8 }
        },
        starThresholds: [2000, 3500, 5000]
    },
    {
        id: 15,
        name: "High Stakes",
        description: "Big score target, limited moves!",
        moves: 18,
        goals: {
            score: 4000
        },
        starThresholds: [4000, 5500, 7000]
    },

    // ===== HARD LEVELS (16-20) =====
    {
        id: 16,
        name: "Expert Challenge",
        description: "Only the best can complete this!",
        moves: 15,
        goals: {
            score: 3500,
            collectGem: { type: 3, count: 15 }
        },
        starThresholds: [3500, 5000, 6500]
    },
    {
        id: 17,
        name: "Cascade King",
        description: "Create massive chain reactions!",
        moves: 20,
        goals: {
            score: 5000
        },
        starThresholds: [5000, 7000, 9000]
    },
    {
        id: 18,
        name: "Triple Threat",
        description: "Collect three gem types at once!",
        moves: 22,
        goals: {
            collectGem: { type: 1, count: 12 },
            collectGem2: { type: 3, count: 12 },
            collectGem3: { type: 5, count: 12 }
        },
        starThresholds: [3000, 5000, 7000]
    },
    {
        id: 19,
        name: "Speed Demon",
        description: "Quick moves, quick thinking!",
        moves: 10,
        goals: {
            score: 2000
        },
        starThresholds: [2000, 3000, 4000]
    },
    {
        id: 20,
        name: "Grand Finale",
        description: "The ultimate gem garden challenge!",
        moves: 25,
        goals: {
            score: 8000,
            collectAny: 80
        },
        starThresholds: [8000, 10000, 12000]
    }
];

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LEVELS;
}
