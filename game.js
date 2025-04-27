class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UI(this);
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isUpgrading = false;
        this.score = 0;
        this.wave = 1;
        this.enemiesRemaining = 1;
        this.waveTimer = 180; // 3 minutes per wave
        this.waveStartTime = 0;
        this.lastUpdateTime = 0;
        this.totalPlayTime = 0;
        this.pauseStartTime = 0;
        this.totalPauseTime = 0;
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];

        // Boss phase support
        this.bossLasers = [];
        this.enemyBullets = [];
        this.visualEffects = [];

        // Make game instance globally accessible for enemy behaviors
        window.game = this;
        
        // Debug mode
        this.debugMode = false;
        
        // Wave settings
        this.maxWave = 100;
        this.enemyTypes = ['normal', 'speedster', 'tank'];
        this.maxEnemies = 10; // Initial max enemies on screen
        this.spawnDelay = 2000; // Initial spawn delay in ms
        this.minSpawnDelay = 500; // Minimum spawn delay
        this.lastSpawnTime = 0;
        this.enemiesRemaining = 0;
        
        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseDown = false;
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Resize canvas to fit window
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Screen flash effect
        this.screenFlashAlpha = 0;
    }
    
    initEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Special key handling
            if (e.key === ' ' && this.isRunning && !this.isPaused) {
                this.playerShoot();
            }
            
            if (e.key === 'f' && this.isRunning && !this.isPaused) {
                this.playerActivateLaser();
            }
            
            if (e.key === 'Escape' && this.isRunning) {
                this.togglePause();
            }

            // God mode toggle with G key
            if (e.key === 'g' && this.player) {
                this.player.godMode = !this.player.godMode;
                const indicator = document.getElementById('god-mode-indicator');
                if (this.player.godMode) {
                    this.player.health = this.player.maxHealth;
                    indicator.classList.remove('hidden');
                } else {
                    indicator.classList.add('hidden');
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.mouseDown = true;
                if (this.isRunning && !this.isPaused) {
                    this.playerShoot();
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });
        
        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }


    
    start() {
        // Reset game state
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.isUpgrading = false;
        this.score = 0;
        this.wave = 1;
        this.waveTimer = 180; // 3 minutes per wave
        this.totalPlayTime = 0;
        this.totalPauseTime = 0;
        

        // Create player
        const playerX = this.canvas.width / 2;
        const playerY = this.canvas.height / 2;
        this.player = new Player(playerX, playerY, 15);
        
        // Reset entities
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        
        // Reset wave settings
         this.updateWaveSettings();
        this.enemiesRemaining = 10; // Start with 10 enemies in wave 1

        // Explicitly hide pause overlay
        const pauseOverlay = document.getElementById('pause-overlay');
        pauseOverlay.classList.add('hidden');
        const pauseButton = document.getElementById('pause-button').querySelector('i');
        pauseButton.className = 'fas fa-pause';

        
        
        // Start game loop
        this.waveStartTime = performance.now();
        this.lastUpdateTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    restart() {
        this.ui.showScreen('game');
        this.start();
        
    }
    
    togglePause() {
        if (!this.isRunning || this.isGameOver || this.isUpgrading) return;
        
        this.isPaused = !this.isPaused;
        this.ui.togglePauseOverlay(this.isPaused);
        
        if (this.isPaused) {
            // Store the time when pause started
            this.pauseStartTime = performance.now();
        } else {
            // Add the pause duration to total pause time
            this.totalPauseTime += performance.now() - this.pauseStartTime;
            // Resume game loop
            this.lastUpdateTime = performance.now();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    resume() {
        this.isPaused = false;
        this.ui.togglePauseOverlay(false);
        // Add the pause duration to total pause time
        this.totalPauseTime += performance.now() - this.pauseStartTime;
        this.lastUpdateTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameLoop() {
        if (!this.isRunning || this.isPaused || this.isGameOver || this.isUpgrading) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;
        
        // Determine if we're in a boss fight
        const isBossFight = this.enemies.some(enemy => enemy.type.startsWith('boss'));
        
        // Update wave timer only if not in a boss fight and not in god mode
        let timeRemaining;
        if (isBossFight) {
            timeRemaining = Infinity; // No timer during boss fights
        } else if (this.player && this.player.godMode) {
            timeRemaining = this.waveTimer; // Frozen timer in god mode
        } else {
            const elapsedTime = (currentTime - this.waveStartTime - this.totalPauseTime) / 1000;
            timeRemaining = Math.max(0, this.waveTimer - elapsedTime);
            
            // Complete wave if timer runs out
            if (timeRemaining <= 0) {
                this.completeWave();
                return;
            }
        }
        
        // Update game state
        this.update(currentTime, deltaTime);
        this.render();
        
        // Update UI
        this.ui.updateHUD(
            this.score,
            this.wave,
            this.enemiesRemaining,
            Math.ceil(this.player.health),
            this.player.maxHealth,
            isBossFight ? this.enemies.find(e => e.type.startsWith('boss')) : null
        );
        this.ui.updateTimer(timeRemaining, isBossFight);
        
        // Check for wave completion by killing all enemies
        if (this.enemiesRemaining <= 0) {
            this.completeWave();
            return;
        }
        
        // Update laser cooldown UI
        const laserCooldownPercent = this.player.getLaserCooldownPercent(currentTime);
        this.ui.updateLaserCooldown(laserCooldownPercent);
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    createExplosionEffect(x, y, radius) {
        // Create expanding ring
        const ring = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            startTime: performance.now(),
            duration: 500,
            update: function(currentTime) {
                const elapsed = currentTime - this.startTime;
                if (elapsed > this.duration) return true;
                this.radius = this.maxRadius * (elapsed / this.duration);
                return false;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                const progress = (performance.now() - this.startTime) / this.duration;
                const alpha = 1 - progress;
                
                // Create gradient for explosion ring
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.8})`);
                gradient.addColorStop(0.6, `rgba(255, 100, 50, ${alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(255, 50, 50, ${alpha * 0.3})`);
                
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            }
        };
        this.visualEffects.push(ring);

        // Create explosion particles
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const size = 2 + Math.random() * 3;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                life: 1,
                startTime: performance.now(),
                duration: 800 + Math.random() * 400,
                
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    if (elapsed > this.duration) return true;
                    
                    this.life = 1 - (elapsed / this.duration);
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.98;
                    this.vy *= 0.98;
                    return false;
                },
                
                draw: function(ctx) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 50, ${this.life})`;
                    ctx.fill();
                    ctx.restore();
                }
            };
            this.visualEffects.push(particle);
        }
    }

    update(currentTime, deltaTime) {
        // Update total play time
        this.totalPlayTime += deltaTime;
        
        // Update player
        this.player.update(this.keys, this.mousePos, this.canvas.width, this.canvas.height, currentTime);
        
        // Auto-fire if upgrade is active
        if (this.player.upgrades.autoFire > 0 && this.enemies.length > 0) {
            this.playerShoot();
        }
        
        // Spawn enemies
        this.spawnEnemies(currentTime);
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const collided = enemy.update(this.player, currentTime, this.bullets);
            
            // Check for collision with player
            if (collided) {
                if (enemy.isBoss) {
                    // Calculate knockback direction
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const knockbackDistance = 150; // Increased from 100 to 150 for more noticeable effect
                    
                    // Apply knockback to player position with fixed speed
                    const knockbackSpeed = 20;
                    const knockbackTime = knockbackDistance / knockbackSpeed;
                    const startTime = currentTime;
                    
                    // Store original position
                    const originalX = this.player.x;
                    const originalY = this.player.y;
                    
                    // Apply knockback immediately
                    this.player.x += (dx / distance) * knockbackDistance;
                    this.player.y += (dy / distance) * knockbackDistance;
                    
                    // Keep player within bounds after knockback
                    this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
                    this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));
                    
                    // Apply damage
                    const gameOver = this.player.takeDamage(enemy.damage);
                    if (gameOver) {
                        this.gameOver();
                        return;
                    }
                } else {
                    // Regular enemies still get destroyed on collision
                    this.score += enemy.points;
                    const explosion = enemy.explode();
                    if (explosion) {
                        this.explosions.push(explosion);
                    }
                    this.enemies.splice(i, 1);
                    if (!this.player.godMode) {
                        this.enemiesRemaining--;
                    }
                    
                    const gameOver = this.player.takeDamage(enemy.damage);
                    if (gameOver) {
                        this.gameOver();
                        return;
                    }
                }
            }
            
            // Check for laser damage
            if (this.player.laserActive) {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const playerAngle = Math.atan2(this.player.direction.y, this.player.direction.x);
                const angleDiff = Math.abs(angle - playerAngle);
                
                // If enemy is in the laser beam (within a small angle)
                if (angleDiff < 0.2 || angleDiff > Math.PI * 2 - 0.2) {
                    const laserDamage = this.player.damage * 10 * deltaTime;
                    const killed = enemy.takeDamage(laserDamage);
                    
                    if (killed) {
                        this.score += enemy.points;
                        
                        // Check for explosion (bomber type)
                        const explosion = enemy.explode();
                        if (explosion) {
                            this.explosions.push(explosion);
                        }
                        
                        this.enemies.splice(i, 1);
                        if (!this.player.godMode) {
                            this.enemiesRemaining--;
                        }
                    }
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const shouldRemove = bullet.update(this.canvas.width, this.canvas.height);
            
            if (shouldRemove) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check for collisions with enemies
            if (!bullet.isEnemy) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    
                    if (bullet.checkCollision(enemy)) {
                        const killed = enemy.takeDamage(bullet.damage);
                        
                        if (killed) {
                            this.score += enemy.points;
                            
                            // Check for explosion (bomber type)
                            const explosion = enemy.explode();
                            if (explosion) {
                                this.explosions.push(explosion);
                            }
                            
                            this.enemies.splice(j, 1);
                            if (!this.player.godMode) {
                                this.enemiesRemaining--;
                            }
                        }
                        
                        // Remove bullet unless it has ricochets left
                        if (bullet.ricochets <= 0) {
                            this.bullets.splice(i, 1);
                            break;
                        }
                    }
                }
            } else {
                // Enemy bullet hitting player
                if (bullet.checkCollision(this.player)) {
                    const gameOver = this.player.takeDamage(bullet.damage);
                    this.bullets.splice(i, 1);
                    
                    if (gameOver) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
        
        // Process explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            
            // Create visual effect when explosion is added
            this.createExplosionEffect(explosion.x, explosion.y, explosion.radius);
            
            // Check if player is in explosion radius
            const dx = this.player.x - explosion.x;
            const dy = this.player.y - explosion.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < explosion.radius + this.player.size) {
                const gameOver = this.player.takeDamage(explosion.damage);
                if (gameOver) {
                    this.gameOver();
                    return;
                }
            }
            
            // Check if enemies are in explosion radius
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = enemy.x - explosion.x;
                const dy = enemy.y - explosion.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < explosion.radius + enemy.size) {
                    const killed = enemy.takeDamage(explosion.damage);
                    
                    if (killed) {
                        this.score += enemy.points;
                        this.enemies.splice(j, 1);
                        if (!this.player.godMode) {
                            this.enemiesRemaining--;
                        }
                    }
                }
            }
            
            // Remove explosion after processing
            this.explosions.splice(i, 1);
        }

        // Update boss lasers
        for (let i = this.bossLasers.length - 1; i >= 0; i--) {
            const laser = this.bossLasers[i];
            const shouldRemove = laser.update(performance.now());
            
            if (shouldRemove) {
                this.bossLasers.splice(i, 1);
            } else {
                // Check collision with player
                if (laser.checkCollision(this.player)) {
                    this.player.takeDamage(laser.damage);
                }
            }
        }
        
        // Update enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            const shouldRemove = bullet.update(this.canvas.width, this.canvas.height);
            
            if (shouldRemove) {
                this.enemyBullets.splice(i, 1);
            } else {
                // Check collision with player
                if (bullet.checkCollision(this.player)) {
                    this.player.takeDamage(bullet.damage);
                    this.enemyBullets.splice(i, 1);
                }
            }
        }
        
        // Update visual effects
        for (let i = this.visualEffects.length - 1; i >= 0; i--) {
            const effect = this.visualEffects[i];
            const shouldRemove = effect.update(performance.now());
            
            if (shouldRemove) {
                this.visualEffects.splice(i, 1);
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw boss lasers behind everything else
        for (const laser of this.bossLasers) {
            laser.draw(this.ctx);
        }
        
        // Draw enemy bullets
        for (const bullet of this.enemyBullets) {
            bullet.draw(this.ctx);
        }
        
        // Draw player bullets
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }
        
        // Draw explosions
        for (const explosion of this.explosions) {
            this.drawExplosion(explosion);
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            // Don't draw enemies during their invincibility flash every other frame
            if (!enemy.invincible || Math.floor(performance.now() / 50) % 2 === 0) {
                enemy.draw(this.ctx);
            }
        }
        
        // Draw player
        if (!this.player.invincible || Math.floor(performance.now() / 50) % 2 === 0) {
            this.player.draw(this.ctx);
        }
        
        // Draw visual effects on top of everything
        for (const effect of this.visualEffects) {
            effect.draw(this.ctx);
        }

        // Draw screen flash
        if (this.screenFlashAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.screenFlashAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - 0.05);
        }
    }
    
    drawGrid() {
        const gridSize = 50;
        const gridColor = 'rgba(50, 50, 50, 0.5)';
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawExplosion(explosion) {
        const gradient = this.ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, explosion.radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    spawnEnemies(currentTime) {
        // Check if it's a boss wave
        const isBossWave = this.wave >= 20 && this.wave % 20 === 0;
        
        // Don't spawn regular enemies during boss fights
        if (isBossWave && this.enemies.length > 0) {
            return;
        }

        if (this.enemies.length >= this.maxEnemies || this.enemiesRemaining <= this.enemies.length) {
            return;
        }
        
        if (currentTime - this.lastSpawnTime > this.spawnDelay) {
            // Determine spawn position (outside the screen but not too far)
            const margin = 100;
            let x, y;
            
            const side = Math.floor(Math.random() * 4);
            switch (side) {
                case 0: // Top
                    x = Math.random() * this.canvas.width;
                    y = -margin;
                    break;
                case 1: // Right
                    x = this.canvas.width + margin;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // Bottom
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + margin;
                    break;
                case 3: // Left
                    x = -margin;
                    y = Math.random() * this.canvas.height;
                    break;
            }

            // Determine enemy type
            let enemyType;
            
            // Check if it's a boss wave (every 20th wave starting from wave 20)
            if (this.wave >= 20 && this.wave % 20 === 0 && this.enemies.length === 0) {
                // Clear all existing enemies when spawning a boss
                this.enemies = [];
                this.enemyBullets = [];
                this.bullets = [];
                this.explosions = [];
                
                // Boss wave - spawn a boss based on wave number
                const bossLevel = Math.min(5, Math.ceil((this.wave - 20) / 20) + 1);
                enemyType = `boss${bossLevel}`;
                
                // Center the boss spawn position
                x = this.canvas.width / 2;
                y = this.canvas.height / 2;
            } else {
                // Regular enemy - choose randomly from available types
                const availableTypes = this.getAvailableEnemyTypes();
                enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            }
            
            // Create and add enemy
            const enemy = new Enemy(x, y, enemyType, this.wave);
            this.enemies.push(enemy);
            
            // Update spawn time
            this.lastSpawnTime = currentTime;
        }
    }
    
    getAvailableEnemyTypes() {
        // Unlock enemy types based on wave number
        if (this.wave >= 81) {
            return ['normal', 'speedster', 'tank', 'shooter', 'bomber', 'laserShooter'];
        } else if (this.wave >= 61) {
            return ['normal', 'speedster', 'tank', 'shooter', 'bomber'];
        } else if (this.wave >= 41) {
            return ['normal', 'speedster', 'tank', 'shooter'];
        } else if (this.wave >= 21) {
            return ['normal', 'speedster', 'tank'];
        } else {
            return ['normal', 'speedster'];
        }
    }
    
    playerShoot() {
        if (!this.player || !this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        if (currentTime - this.player.lastShotTime < this.player.fireRate) {
            return;
        }
        
        // Calculate direction to mouse
        const dx = this.mousePos.x - this.player.x;
        const dy = this.mousePos.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const direction = {
            x: dx / distance,
            y: dy / distance
        };
        
        // Create bullets based on multi-fire upgrade
        const bulletCount = 1 + this.player.upgrades.multiFire;
        const spreadAngle = Math.PI / 8; // 22.5 degrees
        
        for (let i = 0; i < bulletCount; i++) {
            let bulletDirection = { ...direction };
            
            // Apply spread for multi-fire
            if (bulletCount > 1) {
                const angle = spreadAngle * (i / (bulletCount - 1) - 0.5);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                bulletDirection = {
                    x: direction.x * cos - direction.y * sin,
                    y: direction.x * sin + direction.y * cos
                };
            }
            
            // Create bullet with consistent speed
            const bullet = new Bullet(
                this.player.x,
                this.player.y,
                bulletDirection,
                this.player.damage,
                this.player.upgrades.ricochet,
                false,
                8 // Use consistent bullet speed
            );
            
            this.bullets.push(bullet);
        }
        
        // Update last shot time
        this.player.lastShotTime = currentTime;
    }
    
    playerActivateLaser() {
        if (!this.player || !this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        this.player.activateLaser(currentTime);
    }
    
    completeWave() {
        this.wave++;
        
        if (this.wave > this.maxWave) {
            // Player has completed all waves - game over with victory
            this.gameOver(true);
            return;
        }
        
        // Clear all entities first
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.bossLasers = [];
        this.enemyBullets = [];
        this.visualEffects = [];
        
        // Update wave settings
        this.updateWaveSettings();

        // Reset laser state completely
        this.player.laserCharges = this.player.maxLaserCharges;
        this.player.laserActive = false;
        this.player.lastLaserActivation = -15000;
        this.player.laserLastUsed = -15000;

        // Set new wave's enemy count
        this.enemiesRemaining = Math.ceil(20 * (1 + (this.wave - 1) * 0.1));
        
        // Heal player slightly between waves
        this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * 0.2);
        
        // 20% chance for upgrades, except for boss waves which always give upgrades
        const isBossWave = this.wave >= 20 && this.wave % 20 === 0;
        if (isBossWave || Math.random() < 0.2) {
            // Show upgrade screen
            this.isUpgrading = true;
            this.ui.showUpgradeOptions(this.player);
        } else {
            // Show wave cleared screen
            this.ui.showWaveCleared(this.wave, this.score);
            // Auto-continue after 2 seconds
            setTimeout(() => {
                this.ui.showScreen('game');
                this.waveStartTime = performance.now();
                this.lastUpdateTime = performance.now();
                requestAnimationFrame(() => this.gameLoop());
            }, 2000);
        }
    }

    resumeAfterUpgrade() {
        this.isUpgrading = false;
        this.isPaused = false;
        
        // Hide upgrade screen and show game screen
        this.ui.showScreen('game');
        
        // Reset wave timers
        this.waveStartTime = performance.now();
        this.lastUpdateTime = performance.now();
        
        // Resume game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateWaveSettings() {
        // Check if it's a boss wave (every 20th wave starting from wave 20)
        const isBossWave = this.wave >= 20 && this.wave % 20 === 0;
        
        if (isBossWave) {
            // Boss wave settings
            this.maxEnemies = 1; // Only the boss
            this.spawnDelay = 0; // Immediate spawn
            this.enemiesRemaining = 1;
            this.waveTimer = Infinity; // No timer for boss fights
        } else {
            // Regular wave settings
            this.maxEnemies = Math.min(20, 10 + Math.floor(this.wave / 2));
            this.spawnDelay = Math.max(this.minSpawnDelay, 2000 - (this.wave * 100));
            this.enemiesRemaining = Math.ceil(20 * (1 + (this.wave - 1) * 0.1));
            this.waveTimer = 180; // 3 minutes for normal waves
        }
    }
    
    gameOver(victory = false) {
        this.isRunning = false;
        this.isGameOver = true;

        // Create death particles
        const numParticles = 50;
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const particle = {
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                life: 1,
                color: this.player.color,
                startTime: performance.now(),
                duration: 1500 + Math.random() * 500,
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    if (elapsed > this.duration) return true;
                    this.life = 1 - (elapsed / this.duration);
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.2; // Add gravity
                    return false;
                },
                draw: function(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    ctx.restore();
                }
            };
            this.visualEffects.push(particle);
        }

        // Add screen flash
        this.screenFlashAlpha = 1;
        
        // Add delay before showing game over screen
        setTimeout(() => {
            // Update game stats using UI's GameStats instance
            this.ui.gameStats.updateStats({
                score: this.score,
                wave: this.wave,
                survivalTime: this.totalPlayTime,
                victory: victory
            });
            
            // Show game over screen
            this.ui.showGameOver(
                this.score,
                this.wave,
                this.totalPlayTime,
                this.ui.gameStats.getLongestSurvival(),
                this.ui.gameStats.getFarthestWave()
            );
        }, 2000); // 2 second delay
    }

    gameStats() {
        this.ui.gameStats.displayStats();
    }
}
