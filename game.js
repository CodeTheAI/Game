
// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const SPAWN_INTERVAL_INITIAL = 2000; // 2 seconds
const SPAWN_INTERVAL_MINIMUM = 500;  // Fastest possible spawn rate (0.5 seconds)
const SPAWN_RATE_DECREASE_PER_WAVE = 150; // How much faster spawns get each wave
const SPAWN_ACCELERATION_TIME = 10000; // Time in ms over which spawn rate accelerates within a wave
const BASE_ENEMIES_PER_WAVE = 10; // Base number of enemies in wave 1

// Mob types and their properties
const MOB_TYPES = {
    NORMAL: {
        health: 100,
        speed: 2,
        damage: 10,
        color: '#e74c3c',
        size: 30,
        points: 10
    },
    SPEEDSTER: {
        health: 50,
        speed: 4,
        damage: 15,
        color: '#3498db',
        size: 20,
        points: 20
    },
    TANK: {
        health: 200,
        speed: 1,
        damage: 25,
        color: '#9b59b6',
        size: 40,
        points: 30
    }
};

// Game state
let gameStartTimestamp = 0;
let currentGameTime = 0;
let playerStats = {
    highestScore: 0,
    highestWave: 0,
    longestSurvival: 0, // in seconds
    timesPlayed: 0
};
let canvas, ctx;
let player;
let bullets = [];
let mobs = [];
let score = 0;
let wave = 1;
let gameStartTime;
let lastSpawnTime = 0;
let spawnInterval = SPAWN_INTERVAL_INITIAL;
let gameRun
let gameRunning = false;
let gamePaused = false;
let keys = {
    up: false,
    down: false,
    left: false,
    right: false
};
let lastDirection = { x: 1, y: 0 }; // Default direction (right)

// Wave management
let enemiesRemaining = 0;
let totalEnemiesInWave = 0;
let enemiesSpawned = 0;
let waveStartTime = 0;
let waveInProgress = false;
let waveCompleted = false;

// SVG assets as data URLs - Triangles pointing in each direction
const SVG_ASSETS = {
    playerRight: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="40,25 10,5 10,45" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerUp: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="25,10 5,40 45,40" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerDown: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="25,40 45,10 5,10" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerLeft: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="10,25 40,45 40,5" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerUpRight: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="40,15 5,30 20,45" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerUpLeft: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="10,15 45,30 30,45" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerDownRight: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="40,35 20,5 5,20" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    playerDownLeft: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="10,35 30,5 45,20" fill="%232ecc71" stroke="%23fff" stroke-width="2"/></svg>',
    
    // Enhanced mob designs
    normalMob: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="%23e74c3c" stroke="%23fff" stroke-width="2"/><circle cx="25" cy="25" r="10" fill="%23c0392b" stroke="%23fff" stroke-width="1"/><circle cx="18" cy="18" r="3" fill="%23fff"/></svg>',
    speedsterMob: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="25,5 5,30 25,45 45,30" fill="%233498db" stroke="%23fff" stroke-width="2"/><polygon points="25,15 15,30 25,35 35,30" fill="%232980b9" stroke="%23fff" stroke-width="1"/><circle cx="20" cy="20" r="3" fill="%23fff"/><circle cx="30" cy="20" r="3" fill="%23fff"/></svg>',
    tankMob: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect x="10" y="10" width="30" height="30" fill="%239b59b6" stroke="%23fff" stroke-width="2"/><rect x="15" y="15" width="20" height="20" fill="%238e44ad" stroke="%23fff" stroke-width="1"/><circle cx="20" cy="20" r="3" fill="%23fff"/><circle cx="30" cy="20" r="3" fill="%23fff"/><rect x="20" y="30" width="10" height="5" fill="%23fff"/></svg>'
};

// Image objects
const images = {};


// Load player statistics from localStorage
function loadPlayerStats() {
    try {
        const savedStats = localStorage.getItem('neonSiegeStats');
        if (savedStats) {
            playerStats = JSON.parse(savedStats);
            console.log("Loaded player stats:", playerStats);
        } else {
            console.log("No saved stats found, using defaults");
        }
    } catch (error) {
        console.error("Error loading player stats:", error);
        // If there's an error, we'll use the default stats
    }
    
    // Update the display with whatever stats we have
    updateStatisticsDisplay();
}

// Save player statistics to localStorage
function savePlayerStats() {
    try {
        localStorage.setItem('neonSiegeStats', JSON.stringify(playerStats));
        console.log("Saved player stats:", playerStats);
    } catch (error) {
        console.error("Error saving player stats:", error);
    }
}
// Update the statistics display with current values
function updateStatisticsDisplay() {
    document.getElementById('highest-score').textContent = playerStats.highestScore;
    document.getElementById('highest-wave').textContent = playerStats.highestWave;
    document.getElementById('longest-survival').textContent = formatTime(playerStats.longestSurvival);
    document.getElementById('times-played').textContent = playerStats.timesPlayed;
}

// Format seconds into MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Show statistics screen
function showStatistics() {
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('statistics-screen').classList.remove('hidden');
}

// Hide statistics screen
function hideStatistics() {
    document.getElementById('statistics-screen').classList.add('hidden');
    document.getElementById('landing-screen').classList.remove('hidden');
}

// Initialize the game
function init() {
    // Load saved statistics
       loadPlayerStats();

    // Set up landing screen
    document.getElementById('play-btn').addEventListener('click', startGame);
    document.getElementById('quit-btn').addEventListener('click', quitGame);
    document.getElementById('quit-from-gameover-btn').addEventListener('click', quitGame);
    document.getElementById('next-wave-btn').addEventListener('click', startNextWave);
    document.getElementById('stats-btn').addEventListener('click', showStatistics);
    document.getElementById('back-from-stats-btn').addEventListener('click', hideStatistics);
 
    // Load images
    for (const [key, url] of Object.entries(SVG_ASSETS)) {
        images[key] = new Image();
        images[key].src = url;
    }
}

// Calculate total enemies for a wave
function calculateEnemiesForWave(waveNumber) {
    return BASE_ENEMIES_PER_WAVE + (waveNumber - 1) * 5;
}

// Load player statistics from localStorage
function loadPlayerStats() {
    const savedStats = localStorage.getItem('neonSiegeStats');
    if (savedStats) {
        playerStats = JSON.parse(savedStats);
    }
    updateStatisticsDisplay();
}

// Save player statistics to localStorage
function savePlayerStats() {
    localStorage.setItem('neonSiegeStats', JSON.stringify(playerStats));
}

// Update the statistics display with current values
function updateStatisticsDisplay() {
    document.getElementById('highest-score').textContent = playerStats.highestScore;
    document.getElementById('highest-wave').textContent = playerStats.highestWave;
    document.getElementById('longest-survival').textContent = formatTime(playerStats.longestSurvival);
    document.getElementById('times-played').textContent = playerStats.timesPlayed;
}

// Format seconds into MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Show statistics screen
function showStatistics() {
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('statistics-screen').classList.remove('hidden');
}

// Hide statistics screen
function hideStatistics() {
    document.getElementById('statistics-screen').classList.add('hidden');
    document.getElementById('landing-screen').classList.remove('hidden');
}


// Start the game
function startGame() {
    // Hide landing screen, show game elements
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('game-canvas').classList.remove('hidden');
    document.getElementById('ui-overlay').classList.remove('hidden');
    
    // Set up canvas
    canvas = document.getElementById('game-canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');

    // Create player
    player = {
        x: CANVAS_WIDTH / 2 - 20,
        y: CANVAS_HEIGHT / 2 - 20,
        width: 40,
        height: 40,
        speed: PLAYER_SPEED,
        health: 100,
        maxHealth: 100,
        direction: 'none' // Default direction
    };

    // Reset game state
    bullets = [];
    mobs = [];
    score = 0;
    wave = 1;
    
    // Set up event listeners
    setupEventListeners();
    setupKeyboardControls();

    // Start the game
    gameRunning = true;
    gamePaused = false;
    gameStartTime = Date.now();
    lastSpawnTime = 0;
    spawnInterval = SPAWN_INTERVAL_INITIAL;
    
    // Increment times played counter
    playerStats.timesPlayed++;
    savePlayerStats();
    
    // Record game start time
    gameStartTimestamp = Date.now();
    currentGameTime = 0;

    // Initialize wave
    startWave(wave);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start a new wave
function startWave(waveNumber) {
    // Calculate enemies for this wave
    totalEnemiesInWave = calculateEnemiesForWave(waveNumber);
    enemiesRemaining = totalEnemiesInWave;
    enemiesSpawned = 0;
    waveInProgress = true;
    waveCompleted = false;

    // Record when this wave started (for spawn rate calculations)
    waveStartTime = Date.now();
    
    // Reset spawn interval to initial value at the start of each wave
    spawnInterval = SPAWN_INTERVAL_INITIAL;
    
    // Update UI
    document.getElementById('score-display').textContent = `Score: ${score}`;
    document.getElementById('wave-display').textContent = `Wave: ${wave}`;
    document.getElementById('enemies-display').textContent = `Enemies: ${enemiesRemaining}/${totalEnemiesInWave}`;
}

// Start the next wave
function startNextWave() {
    wave++;
    startWave(wave);
    
    // Hide wave complete screen
    document.getElementById('wave-complete-screen').classList.add('hidden');
    
    // Resume game
    gameRunning = true;
    gamePaused = false;
    requestAnimationFrame(gameLoop);
}

// Show wave complete screen
function showWaveComplete() {
    waveCompleted = true;
    
    // Show wave complete screen
    const waveCompleteScreen = document.getElementById('wave-complete-screen');
    waveCompleteScreen.classList.remove('hidden');
    
    // Update wave info
    document.querySelector('.wave-number').textContent = `Wave ${wave} Cleared`;
    document.querySelector('.wave-score').textContent = `Score: ${score}`;
}

// Quit game and return to landing screen
function quitGame() {
    // Hide game elements, show landing screen
    document.getElementById('landing-screen').classList.remove('hidden');
    document.getElementById('game-canvas').classList.add('hidden');
    document.getElementById('ui-overlay').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('wave-complete-screen').classList.add('hidden');
    
    // Stop the game
    gameRunning = false;
}

// Set up event listeners
function setupEventListeners() {
    // Pause button
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    
    // Unpause button
    document.getElementById('unpause-btn').addEventListener('click', togglePause);

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', resetGame);
}

// Set up keyboard controls
function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
                keys.down = true;
                break;
            case 'ArrowLeft':
            case 'a':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                keys.right = true;
                break;
            case ' ':
                // Shoot on spacebar
                if (!gamePaused && gameRunning) {
                    shootBullet();
                }
                break;
            case 'p':
                togglePause();
                break;
            case 'Escape':
                if (gamePaused) {
                    quitGame();
                } else {
                    togglePause();
                }
                break;
        }
        
        updatePlayerDirection();
    });
    
    window.addEventListener('keyup', (e) => {
        if (!gameRunning) return;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
                keys.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                keys.right = false;
                break;
        }
        
        updatePlayerDirection();
    });
}

// Update player direction based on key presses
function updatePlayerDirection() {
    // Determine direction based on key combinations
    if (keys.up && !keys.down) {
        if (keys.right && !keys.left) {
            player.direction = 'upRight';
            lastDirection = { x: 0.7071, y: -0.7071 }; // Normalized diagonal vector
        } else if (keys.left && !keys.right) {
            player.direction = 'upLeft';
            lastDirection = { x: -0.7071, y: -0.7071 };
        } else {
            player.direction = 'up';
            lastDirection = { x: 0, y: -1 };
        }
    } else if (keys.down && !keys.up) {
        if (keys.right && !keys.left) {
            player.direction = 'downRight';
            lastDirection = { x: 0.7071, y: 0.7071 };
        } else if (keys.left && !keys.right) {
            player.direction = 'downLeft';
            lastDirection = { x: -0.7071, y: 0.7071 };
        } else {
            player.direction = 'down';
            lastDirection = { x: 0, y: 1 };
        }
    } else if (keys.left && !keys.right) {
        player.direction = 'left';
        lastDirection = { x: -1, y: 0 };
    } else if (keys.right && !keys.left) {
        player.direction = 'right';
        lastDirection = { x: 1, y: 0 };
    }
}

// Function to shoot bullet in the direction player is facing
function shootBullet() {
    // Create bullet with visual effects
    bullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 5,
        dirX: lastDirection.x,
        dirY: lastDirection.y,
        speed: BULLET_SPEED,
        damage: 50,
        color: '#ffeb3b',
        glow: 10
    });
    
    // Add bullet firing sound effect (if we had audio)
    // playSound('bulletSound');
}

// Toggle pause state
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    document.getElementById('pause-screen').classList.toggle('hidden', !gamePaused);
    
    // Change pause button icon
    const pauseBtn = document.getElementById('pause-btn');
    if (gamePaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        requestAnimationFrame(gameLoop);
    }
}

// Reset the game
function resetGame() {
    // Reset player position to center of screen
    player = {
        x: CANVAS_WIDTH / 2 - 20,
        y: CANVAS_HEIGHT / 2 - 20,
        width: 40,
        height: 40,
        speed: PLAYER_SPEED,
        health: 100,
        maxHealth: 100,
        direction: 'right' // Default direction
    };
    
    // Reset all key states to prevent movement bug
    keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    bullets = [];
    mobs = [];
    score = 0;
    wave = 1;
    gameStartTime = Date.now();
    lastSpawnTime = 0;
    spawnInterval = SPAWN_INTERVAL_INITIAL;
    gameRunning = true;
    gamePaused = false;

    // Increment times played counter
    playerStats.timesPlayed++;
    savePlayerStats();
    
    // Reset game start time
    gameStartTimestamp = Date.now();
    currentGameTime = 0;
    
    // Start first wave
    startWave(wave);
    
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('wave-complete-screen').classList.add('hidden');
    
    // Reset pause button icon
    document.getElementById('pause-btn').innerHTML = '<i class="fas fa-pause"></i>';
    // Log reset for debugging
    console.log("Game reset: Player position reset to center");
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(timestamp) {
    if (gamePaused || !gameRunning || waveCompleted) return;

    // Update current game time
    currentGameTime = (Date.now() - gameStartTimestamp) / 1000; // in seconds
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Draw background grid (retro effect)
        drawGrid();
    
        // Handle keyboard movement
        handlePlayerMovement();
        
        // Update game elements
        updateSpawnRate();
        spawnMobs();
        updateBullets();
        updateMobs();
        checkCollisions();
        
        // Draw game elements
        drawPlayer();
        drawBullets();
        drawMobs();
        
        // Update UI
        document.getElementById('score-display').textContent = `Score: ${score}`;
        document.getElementById('wave-display').textContent = `Wave: ${wave}`;
        document.getElementById('enemies-display').textContent = `Enemies: ${enemiesRemaining}/${totalEnemiesInWave}`;
        
        // Check if wave is complete
        if (enemiesRemaining === 0 && enemiesSpawned === totalEnemiesInWave && mobs.length === 0) {
            showWaveComplete();
            return;
        }
        
        // Check game over condition
        if (player.health <= 0) {
            gameOver();
        } else {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Draw background grid
    function drawGrid() {
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
    }
    
    // Handle player movement
    function handlePlayerMovement() {
        let moved = false;
        let dx = 0;
        let dy = 0;
        
        if (keys.up) {
            dy -= player.speed;
            moved = true;
        }
        if (keys.down) {
            dy += player.speed;
            moved = true;
        }
        if (keys.left) {
            dx -= player.speed;
            moved = true;
        }
        if (keys.right) {
            dx += player.speed;
            moved = true;
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const factor = 0.7071; // 1/sqrt(2)
            dx *= factor;
            dy *= factor;
        }
        
        player.x += dx;
        player.y += dy;
        
        // Keep player within canvas bounds
        player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - player.width));
        player.y = Math.max(0, Math.min(player.y, CANVAS_HEIGHT - player.height));
    }
    
    function updateSpawnRate() {
        // Base spawn interval for this wave (gets faster each wave)
        const baseIntervalForWave = Math.max(
            SPAWN_INTERVAL_MINIMUM,
            SPAWN_INTERVAL_INITIAL - ((wave - 1) * SPAWN_RATE_DECREASE_PER_WAVE)
        );
        
        // Calculate how far into the current wave we are
        const waveElapsedTime = Date.now() - waveStartTime;
        
        // Gradually decrease spawn interval within the wave, but only up to a point
        if (waveElapsedTime < SPAWN_ACCELERATION_TIME) {
            // Linear acceleration of spawn rate within the wave
            const accelerationFactor = waveElapsedTime / SPAWN_ACCELERATION_TIME;
            const accelerationAmount = (SPAWN_INTERVAL_INITIAL - baseIntervalForWave) * accelerationFactor;
            
            spawnInterval = SPAWN_INTERVAL_INITIAL - accelerationAmount;
        } else {
            // After acceleration period, use the base interval for this wave
            spawnInterval = baseIntervalForWave;
        }
        
        // Ensure we don't go below the minimum spawn interval
        spawnInterval = Math.max(SPAWN_INTERVAL_MINIMUM, spawnInterval);
        
        // Limit spawn rate based on number of active enemies to prevent overwhelming the player
        const activeEnemies = mobs.length;
        if (activeEnemies > 10) {
            // Slow down spawns when there are many enemies
            spawnInterval = Math.max(spawnInterval, SPAWN_INTERVAL_MINIMUM * 2);
        }
        
        // Debug log (optional)
        // console.log(`Wave ${wave}: Spawn interval = ${spawnInterval}ms, Active enemies: ${activeEnemies}`);
    }
    
    // Spawn mobs
    function spawnMobs() {
        const currentTime = Date.now();
        
        // Only spawn if we haven't reached the wave limit
        if (enemiesSpawned < totalEnemiesInWave && currentTime - lastSpawnTime > spawnInterval) {
            lastSpawnTime = currentTime;
            enemiesSpawned++;
            
            // Determine spawn position (outside the canvas)
            let spawnX, spawnY;
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            
            switch (side) {
                case 0: // top
                    spawnX = Math.random() * CANVAS_WIDTH;
                    spawnY = -50;
                    break;
                case 1: // right
                    spawnX = CANVAS_WIDTH + 50;
                    spawnY = Math.random() * CANVAS_HEIGHT;
                    break;
                case 2: // bottom
                    spawnX = Math.random() * CANVAS_WIDTH;
                    spawnY = CANVAS_HEIGHT + 50;
                    break;
                case 3: // left
                    spawnX = -50;
                    spawnY = Math.random() * CANVAS_HEIGHT;
                    break;
            }
            
            // Determine mob type based on wave and randomness
            const mobTypeRoll = Math.random();
            let mobType;
            
            // Higher waves have more difficult enemies
            if (wave >= 15) {
                if (mobTypeRoll < 0.2) {
                    mobType = 'NORMAL';
                } else if (mobTypeRoll < 0.5) {
                    mobType = 'SPEEDSTER';
                } else {
                    mobType = 'TANK';
                }
            } else if (wave >= 10) {
                if (mobTypeRoll < 0.3) {
                    mobType = 'NORMAL';
                } else if (mobTypeRoll < 0.6) {
                    mobType = 'SPEEDSTER';
                } else {
                    mobType = 'TANK';
                }
            } else if (wave >= 5) {
                if (mobTypeRoll < 0.4) {
                    mobType = 'NORMAL';
                } else if (mobTypeRoll < 0.8) {
                    mobType = 'SPEEDSTER';
                } else {
                    mobType = 'TANK';
                }
            } else {
                if (mobTypeRoll < 0.6) {
                    mobType = 'NORMAL';
                } else if (mobTypeRoll < 0.9) {
                    mobType = 'SPEEDSTER';
                } else {
                    mobType = 'TANK';
                }
            }
            
            const mobProps = MOB_TYPES[mobType];
            
            // Create mob with visual enhancements
            mobs.push({
                x: spawnX,
                y: spawnY,
                width: mobProps.size,
                height: mobProps.size,
                speed: mobProps.speed * (1 + (wave * 0.1)), // Speed increases with wave
                health: mobProps.health * (1 + (wave * 0.2)), // Health increases with wave
                maxHealth: mobProps.health * (1 + (wave * 0.2)),
                damage: mobProps.damage,
                points: mobProps.points,
                type: mobType,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.1, // Random rotation for visual effect
                pulsePhase: Math.random() * Math.PI * 2 // Random starting phase for pulsing effect
            });
        }
    }
    
    // Update bullets
    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            // Move bullet
            bullet.x += bullet.dirX * bullet.speed;
            bullet.y += bullet.dirY * bullet.speed;
            
            // Bullet trail effect (would be implemented with particles if we had a particle system)
            
            // Remove bullets that are off-screen
            if (
                bullet.x < -bullet.radius ||
                bullet.x > CANVAS_WIDTH + bullet.radius ||
                bullet.y < -bullet.radius ||
                bullet.y > CANVAS_HEIGHT + bullet.radius
            ) {
                bullets.splice(i, 1);
            }
        }
    }
    
    // Update mobs
    function updateMobs() {
        for (const mob of mobs) {
            // Calculate direction to player
            const dirX = (player.x + player.width / 2) - (mob.x + mob.width / 2);
            const dirY = (player.y + player.height / 2) - (mob.y + mob.height / 2);
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            const normalizedDirX = dirX / length;
            const normalizedDirY = dirY / length;
            
            // Move mob towards player
            mob.x += normalizedDirX * mob.speed;
            mob.y += normalizedDirY * mob.speed;
            
            // Update visual effects
            mob.rotation += mob.rotationSpeed;
            mob.pulsePhase += 0.05;
        }
    }
    
    // Check for collisions
    function checkCollisions() {
        // Check bullet-mob collisions
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            for (let j = mobs.length - 1; j >= 0; j--) {
                const mob = mobs[j];
                
                // Simple collision detection (circle-rectangle)
                const closestX = Math.max(mob.x, Math.min(bullet.x, mob.x + mob.width));
                const closestY = Math.max(mob.y, Math.min(bullet.y, mob.y + mob.height));
                
                const distanceX = bullet.x - closestX;
                const distanceY = bullet.y - closestY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                
                if (distance < bullet.radius) {
                    // Bullet hit mob
                    mob.health -= bullet.damage;
                    
                    // Remove bullet
                    bullets.splice(i, 1);
                    
                    // Check if mob is dead
                    if (mob.health <= 0) {
                        score += mob.points;
                        mobs.splice(j, 1);
                        enemiesRemaining--;
                        
                        // Visual effect for mob death (would be implemented with particles)
                    }
                    
                    break;
                }
            }
        }
        
        // Check player-mob collisions
        for (let i = mobs.length - 1; i >= 0; i--) {
            const mob = mobs[i];
            
            // Simple collision detection (rectangle-rectangle)
            if (
                player.x < mob.x + mob.width &&
                player.x + player.width > mob.x &&
                player.y < mob.y + mob.height &&
                player.y + player.height > mob.y
            ) {
                // Player hit by mob
                player.health -= mob.damage;
                
                // Push player away from mob
                const dirX = player.x - mob.x;
                const dirY = player.y - mob.y;
                const length = Math.sqrt(dirX * dirX + dirY * dirY);
                
                player.x += (dirX / length) * 20;
                player.y += (dirY / length) * 20;
                
                // Keep player within canvas bounds
                player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - player.width));
                player.y = Math.max(0, Math.min(player.y, CANVAS_HEIGHT - player.height));
                
                // Remove mob
                mobs.splice(i, 1);
                enemiesRemaining--;
                
                // Screen shake effect (would be implemented with camera)
            }
        }
    }
    
    // Draw player
    function drawPlayer() {
        // Draw player based on direction
        let playerImage;
        switch (player.direction) {
            case 'up':
                playerImage = images.playerUp;
                break;
            case 'down':
                playerImage = images.playerDown;
                break;
            case 'left':
                playerImage = images.playerLeft;
                break;
            case 'right':
                playerImage = images.playerRight;
                break;
            case 'upRight':
                playerImage = images.playerUpRight;
                break;
            case 'upLeft':
                playerImage = images.playerUpLeft;
                break;
            case 'downRight':
                playerImage = images.playerDownRight;
                break;
            case 'downLeft':
                playerImage = images.playerDownLeft;
                break;
            default:
                playerImage = images.playerRight;
                break;
        }
        
        // Draw player glow effect
        ctx.save();
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 15;
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        ctx.restore();
        
        // Draw player health bar
        const healthBarWidth = player.width;
        const healthBarHeight = 5;
        const healthPercentage = player.health / player.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x, player.y - 10, healthBarWidth, healthBarHeight);
        
        // Change color based on health
        if (healthPercentage > 0.5) {
            ctx.fillStyle = '#2ecc71';
        } else if (healthPercentage > 0.25) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = '#e74c3c';
        }
        
        ctx.fillRect(player.x, player.y - 10, healthBarWidth * healthPercentage, healthBarHeight);
    }
    
    // Draw bullets
    function drawBullets() {
        for (const bullet of bullets) {
            // Draw bullet glow
            ctx.save();
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = bullet.glow;
            
            // Draw bullet
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Draw mobs
    function drawMobs() {
        for (const mob of mobs) {
            // Get mob image based on type
            let mobImage;
            switch (mob.type) {
                case 'NORMAL':
                    mobImage = images.normalMob;
                    break;
                case 'SPEEDSTER':
                    mobImage = images.speedsterMob;
                    break;
                case 'TANK':
                    mobImage = images.tankMob;
                    break;
            }
            
            // Apply visual effects (rotation, pulsing)
            ctx.save();
            
            // Center of mob for rotation
            const centerX = mob.x + mob.width / 2;
            const centerY = mob.y + mob.height / 2;
            
            // Translate to center, rotate, translate back
            ctx.translate(centerX, centerY);
            
            // Only rotate speedster mobs
            if (mob.type === 'SPEEDSTER') {
                ctx.rotate(mob.rotation);
            }
            
            // Pulse effect for normal mobs
            if (mob.type === 'NORMAL') {
                const pulseScale = 1 + Math.sin(mob.pulsePhase) * 0.1;
                ctx.scale(pulseScale, pulseScale);
            }
            
            // Draw with glow effect
            ctx.shadowColor = MOB_TYPES[mob.type].color;
            ctx.shadowBlur = 10;
            
            // Draw mob (centered)
            ctx.drawImage(mobImage, -mob.width / 2, -mob.height / 2, mob.width, mob.height);
        
            ctx.restore();
            
            // Draw health bar
            const healthBarWidth = mob.width;
            const healthBarHeight = 5;
            const healthPercentage = mob.health / mob.maxHealth;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(mob.x, mob.y - 10, healthBarWidth, healthBarHeight);
            
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(mob.x, mob.y - 10, healthBarWidth * healthPercentage, healthBarHeight);
        }
    }
    
    // Game over
    function gameOver() {
        gameRunning = false;
        
        // Update statistics with explicit comparisons
        if (score > playerStats.highestScore) {
            console.log(`New high score! ${score} > ${playerStats.highestScore}`);
            playerStats.highestScore = score;
        }
        
        if (wave > playerStats.highestWave) {
            console.log(`New highest wave! ${wave} > ${playerStats.highestWave}`);
            playerStats.highestWave = wave;
        }
        
        if (currentGameTime > playerStats.longestSurvival) {
            console.log(`New longest survival! ${formatTime(currentGameTime)} > ${formatTime(playerStats.longestSurvival)}`);
            playerStats.longestSurvival = currentGameTime;
        }
        
    // Save updated statistics
    savePlayerStats();

        // Show game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('hidden');
        
        // Update final score
        document.querySelector('.final-score').textContent = `Score: ${score}`;

        // Add statistics to game over screen
        const statsHTML = `
        <div class="game-stats">
            <div>Survival Time: ${formatTime(currentGameTime)}</div>
            <div>Wave Reached: ${wave}</div>
        </div>
    `;
        // Check if stats element already exists
        let statsElement = gameOverScreen.querySelector('.game-stats');
        if (statsElement) {
            statsElement.innerHTML = statsHTML;
        } else {
            // Insert stats after final score
            document.querySelector('.final-score').insertAdjacentHTML('afterend', statsHTML);
        }
    }
    
    // Start the game initialization when the page loads
    window.addEventListener('load', init);
    
    
