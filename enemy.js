class Enemy {
    constructor(x, y, type, wave) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.wave = wave;

        // For boss movement during phases
        this.isDashing = false;
        this.isReturning = false;
        
        // Visual effects
        this.flashTime = 0;
        this.flashDuration = 200;
        
        // Base stats
        this.baseStats = {
            normal: {
                size: 15,
                speed: 2,
                health: 30,
                damage: 10,
                color: '#ff5555',
                points: 10
            },
            speedster: {
                size: 10,
                speed: 4,
                health: 15,
                damage: 5,
                color: '#55aaff',
                points: 15
            },
            tank: {
                size: 25,
                speed: 1,
                health: 80,
                damage: 15,
                color: '#aa55ff',
                points: 20
            },
            shooter: {
                size: 18,
                speed: 1.5,
                health: 40,
                damage: 8,
                color: '#ffaa55',
                points: 25,
                fireRate: 2000,
                bulletSpeed: 5,
                range: 300
            },
            bomber: {
                size: 20,
                speed: 1.8,
                health: 50,
                damage: 20,
                color: '#ff55aa',
                points: 30,
                explosionRadius: 100,
                explosionDamage: 30
            },
            laserShooter: {
                size: 22,
                speed: 1.2,
                health: 60,
                damage: 12,
                color: '#55ffaa',
                points: 35,
                laserWidth: 8,
                laserDuration: 1000,
                laserCooldown: 3000,
                laserDamage: 20,
                shootRange: 300,
                chargeTime: 1000
            },
            boss1: {
                size: 40,
                speed: 1,
                health: 500,
                damage: 20,
                color: '#ff0000',
                points: 200,
                phases: 3,
                phaseHealths: [200, 150, 150]
            },
            boss2: {
                size: 45,
                speed: 1.2,
                health: 800,
                damage: 25,
                color: '#ff5500',
                points: 300,
                phases: 4,
                phaseHealths: [250, 200, 200, 150]
            },
            boss3: {
                size: 50,
                speed: 1.4,
                health: 1200,
                damage: 30,
                color: '#ffaa00',
                points: 400,
                phases: 5,
                phaseHealths: [300, 250, 250, 200, 200]
            },
            boss4: {
                size: 55,
                speed: 1.6,
                health: 1600,
                damage: 35,
                color: '#ffff00',
                points: 500,
                phases: 4,
                phaseHealths: [500, 400, 400, 300]
            },
            boss5: {
                size: 60,
                speed: 1.8,
                health: 2000,
                damage: 40,
                color: '#ffffff',
                points: 1000,
                phases: 6,
                phaseHealths: [400, 350, 350, 300, 300, 300]
            }
        };
        
        // Apply wave scaling
        const scaling = 1 + (0.0005 * wave) + (0.001 * Math.floor(wave / 10));
        
        // Set stats based on type and scaling
        const stats = this.baseStats[type];
        this.size = stats.size;
        this.speed = stats.speed * scaling;
        this.maxHealth = stats.health * scaling;
        this.health = this.maxHealth;
        this.damage = stats.damage * scaling;
        this.color = stats.color;
        this.points = stats.points;
        
        // Special properties for specific types
        this.isBoss = type.includes('boss');
        this.lastShot = 0;
        this.laserActive = false;
        this.laserLastUsed = 0;
        this.currentPhase = 1;
        this.invincible = false;
        this.invincibilityDuration = 3000; // 3 seconds
        this.invincibilityStart = 0;

        // Create enemy image
        this.image = new Image();
        this.image.src = this.getDesignForType();
    
        if (type === 'shooter' || type === 'laserShooter') {
            this.fireRate = stats.fireRate;
            this.bulletSpeed = stats.bulletSpeed;
            this.range = stats.range;
        }
        
        if (type === 'laserShooter') {
            this.laserWidth = stats.laserWidth;
            this.laserDuration = stats.laserDuration;
            this.laserCooldown = stats.laserCooldown;
            this.laserDamage = stats.laserDamage * scaling;
            this.shootRange = stats.shootRange;
            this.chargeTime = stats.chargeTime;
            this.isCharging = false;
            this.chargingStartTime = 0;
            this.firingLaser = false;
            this.laserStartTime = 0;
            this.laserTarget = { x: 0, y: 0 };
            this.lastLaserTime = 0;
            this.fixedLaserDirection = { x: 0, y: 0 }; // Store fixed direction when firing
        }
        
        if (type === 'bomber') {
            this.explosionRadius = stats.explosionRadius;
            this.explosionDamage = stats.explosionDamage * scaling;
        }
        
        if (this.isBoss) {
            this.phases = [];
            this.currentPhaseIndex = 0;
            this.phaseInitialized = false;
            this.lastPhaseChange = 0;
            this.phaseChangeDelay = 1000; // 1 second minimum between phase changes
        }

        // Initialize boss phases if this is a boss
        if (this.type.startsWith('boss')) {
            this.initBossPhases();
        }
    }

    getDesignForType() {
        switch(this.type) {
            case 'normal':
                return DESIGNS.normalMob;
            case 'speedster':
                return DESIGNS.speedsterMob;
            case 'tank':
                return DESIGNS.tankMob;
            case 'shooter':
                return DESIGNS.shooterMob;
            case 'bomber':
                return DESIGNS.bomberMob;
            case 'laserShooter':
                return DESIGNS.laserShooterMob;
            case 'boss1':
                return DESIGNS.boss1;
            case 'boss2':
                return DESIGNS.boss2;
            case 'boss3':
                return DESIGNS.boss3;
            case 'boss4':
                return DESIGNS.boss4;
            case 'boss5':
                return DESIGNS.boss5;
            default:
                return DESIGNS.normalMob;
        }
    }

    initBossPhases() {
        const stats = this.baseStats[this.type];
        const phaseHealths = stats.phaseHealths;
        
        switch(this.type) {
            case 'boss1':
                const phase1 = new BossPhase(this, 1, phaseHealths[0]);
                phase1.attackPatterns = [
                    { type: 'bullet_circle', count: 8, speed: 80, damage: this.damage },
                    { type: 'laser_pillar', count: 3, damage: this.damage * 1.5, followWithDash: true }
                ];
                
                const phase2 = new BossPhase(this, 2, phaseHealths[1]);
                phase2.attackPatterns = [
                    { type: 'bullet_circle', count: 12, speed: 85, damage: this.damage * 1.2 },
                    { type: 'laser_pillar', count: 4, damage: this.damage * 1.6, followWithDash: true, dashSpeed: 450 }
                ];
                
                const phase3 = new BossPhase(this, 3, phaseHealths[2]);
                phase3.attackPatterns = [
                    { type: 'laser_pillar', count: 5, damage: this.damage * 1.8, followWithDash: true, dashSpeed: 500 },
                    { type: 'bullet_circle', count: 16, speed: 90, damage: this.damage * 1.4 }
                ];
                
                this.phases = [phase1, phase2, phase3];
                this.currentPhase = phase1;
                this.currentPhase.activate();
                break;

            case 'boss2':
                const b2phase1 = new BossPhase(this, 1, phaseHealths[0]);
                b2phase1.attackPatterns = [
                    { type: 'bullet_circle', count: 10, speed: 75, damage: this.damage },
                    { type: 'ground_pound', radius: 180, damage: this.damage * 1.2 },
                    { type: 'dash_attack', speed: 400, damage: this.damage * 1.5 }
                ];
                
                const b2phase2 = new BossPhase(this, 2, phaseHealths[1]);
                b2phase2.attackPatterns = [
                    { type: 'bullet_barrage', count: 5, waves: 4, delay: 200, speed: 80, damage: this.damage * 1.1 },
                    { type: 'dash_attack', speed: 450, damage: this.damage * 1.8 },
                    { type: 'bullet_circle', count: 12, speed: 85, damage: this.damage * 1.2 }
                ];
                
                const b2phase3 = new BossPhase(this, 3, phaseHealths[2]);
                b2phase3.attackPatterns = [
                    { type: 'bullet_circle', count: 14, speed: 90, damage: this.damage * 1.3 },
                    { type: 'dash_attack', speed: 500, damage: this.damage * 2 },
                    { type: 'ground_pound', radius: 200, damage: this.damage * 1.6 }
                ];
                
                const b2phase4 = new BossPhase(this, 4, phaseHealths[3]);
                b2phase4.attackPatterns = [
                    { type: 'bullet_circle', count: 16, speed: 95, damage: this.damage * 1.4 },
                    { type: 'bullet_barrage', count: 8, waves: 5, delay: 150, speed: 90, damage: this.damage * 1.3 },
                    { type: 'dash_attack', speed: 550, damage: this.damage * 2.2 },
                    { type: 'ground_pound', radius: 220, damage: this.damage * 1.8 }
                ];
                
                this.phases = [b2phase1, b2phase2, b2phase3, b2phase4];
                this.currentPhase = b2phase1;
                this.currentPhase.activate();
                break;

            case 'boss3':
                const b3phase1 = new BossPhase(this, 1, phaseHealths[0]);
                b3phase1.attackPatterns = [
                    { type: 'bullet_circle', count: 12, speed: 80, damage: this.damage * 1.2 },
                    { type: 'dash_attack', speed: 400, damage: this.damage * 1.5 },
                    { type: 'ground_pound', radius: 170, damage: this.damage * 1.4 }
                ];
                
                const b3phase2 = new BossPhase(this, 2, phaseHealths[1]);
                b3phase2.attackPatterns = [
                    { type: 'bullet_barrage', count: 6, waves: 5, delay: 180, speed: 85, damage: this.damage * 1.2 },
                    { type: 'dash_attack', speed: 450, damage: this.damage * 1.8 },
                    { type: 'bullet_circle', count: 14, speed: 90, damage: this.damage * 1.3 }
                ];
                
                const b3phase3 = new BossPhase(this, 3, phaseHealths[2]);
                b3phase3.attackPatterns = [
                    { type: 'bullet_circle', count: 16, speed: 95, damage: this.damage * 1.4 },
                    { type: 'dash_attack', speed: 500, damage: this.damage * 2 },
                    { type: 'ground_pound', radius: 200, damage: this.damage * 1.6 }
                ];
                
                const b3phase4 = new BossPhase(this, 4, phaseHealths[3]);
                b3phase4.attackPatterns = [
                    { type: 'bullet_barrage', count: 8, waves: 6, delay: 150, speed: 90, damage: this.damage * 1.3 },
                    { type: 'bullet_circle', count: 18, speed: 100, damage: this.damage * 1.5 },
                    { type: 'dash_attack', speed: 550, damage: this.damage * 2.2 }
                ];

                const b3phase5 = new BossPhase(this, 5, phaseHealths[4]);
                b3phase5.attackPatterns = [
                    { type: 'bullet_circle', count: 20, speed: 105, damage: this.damage * 1.6 },
                    { type: 'dash_attack', speed: 600, damage: this.damage * 2.4 },
                    { type: 'ground_pound', radius: 250, damage: this.damage * 2 }
                ];
                
                this.phases = [b3phase1, b3phase2, b3phase3, b3phase4, b3phase5];
                this.currentPhase = b3phase1;
                this.currentPhase.activate();
                break;

            case 'boss4':
                const b4phase1 = new BossPhase(this, 1, phaseHealths[0]);
                b4phase1.attackPatterns = [
                    { type: 'bullet_circle', count: 14, speed: 85, damage: this.damage * 1.2 },
                    { type: 'dash_attack', speed: 450, damage: this.damage * 1.8 },
                    { type: 'ground_pound', radius: 180, damage: this.damage * 1.5 }
                ];
                
                const b4phase2 = new BossPhase(this, 2, phaseHealths[1]);
                b4phase2.attackPatterns = [
                    { type: 'bullet_barrage', count: 7, waves: 5, delay: 170, speed: 90, damage: this.damage * 1.3 },
                    { type: 'dash_attack', speed: 500, damage: this.damage * 2 },
                    { type: 'bullet_circle', count: 16, speed: 95, damage: this.damage * 1.4 }
                ];
                
                const b4phase3 = new BossPhase(this, 3, phaseHealths[2]);
                b4phase3.attackPatterns = [
                    { type: 'bullet_circle', count: 18, speed: 100, damage: this.damage * 1.5 },
                    { type: 'dash_attack', speed: 550, damage: this.damage * 2.2 },
                    { type: 'ground_pound', radius: 220, damage: this.damage * 1.8 }
                ];
                
                const b4phase4 = new BossPhase(this, 4, phaseHealths[3]);
                b4phase4.attackPatterns = [
                    { type: 'bullet_barrage', count: 9, waves: 6, delay: 150, speed: 95, damage: this.damage * 1.4 },
                    { type: 'bullet_circle', count: 20, speed: 105, damage: this.damage * 1.6 },
                    { type: 'dash_attack', speed: 600, damage: this.damage * 2.4 },
                    { type: 'ground_pound', radius: 250, damage: this.damage * 2 }
                ];
                
                this.phases = [b4phase1, b4phase2, b4phase3, b4phase4];
                this.currentPhase = b4phase1;
                this.currentPhase.activate();
                break;

            case 'boss5':
                const b5phase1 = new BossPhase(this, 1, phaseHealths[0]);
                b5phase1.attackPatterns = [
                    { type: 'bullet_circle', count: 16, speed: 90, damage: this.damage * 1.3 },
                    { type: 'dash_attack', speed: 500, damage: this.damage * 2 },
                    { type: 'ground_pound', radius: 200, damage: this.damage * 1.6 }
                ];
                
                const b5phase2 = new BossPhase(this, 2, phaseHealths[1]);
                b5phase2.attackPatterns = [
                    { type: 'bullet_barrage', count: 8, waves: 5, delay: 160, speed: 95, damage: this.damage * 1.4 },
                    { type: 'dash_attack', speed: 550, damage: this.damage * 2.2 },
                    { type: 'bullet_circle', count: 18, speed: 100, damage: this.damage * 1.5 }
                ];
                
                const b5phase3 = new BossPhase(this, 3, phaseHealths[2]);
                b5phase3.attackPatterns = [
                    { type: 'bullet_circle', count: 20, speed: 105, damage: this.damage * 1.6 },
                    { type: 'dash_attack', speed: 600, damage: this.damage * 2.4 },
                    { type: 'ground_pound', radius: 220, damage: this.damage * 1.8 }
                ];
                
                const b5phase4 = new BossPhase(this, 4, phaseHealths[3]);
                b5phase4.attackPatterns = [
                    { type: 'bullet_barrage', count: 10, waves: 6, delay: 150, speed: 100, damage: this.damage * 1.5 },
                    { type: 'bullet_circle', count: 22, speed: 110, damage: this.damage * 1.7 },
                    { type: 'dash_attack', speed: 650, damage: this.damage * 2.6 }
                ];

                const b5phase5 = new BossPhase(this, 5, phaseHealths[4]);
                b5phase5.attackPatterns = [
                    { type: 'bullet_circle', count: 24, speed: 115, damage: this.damage * 1.8 },
                    { type: 'dash_attack', speed: 700, damage: this.damage * 2.8 },
                    { type: 'ground_pound', radius: 250, damage: this.damage * 2 }
                ];

                const b5phase6 = new BossPhase(this, 6, phaseHealths[5]);
                b5phase6.attackPatterns = [
                    { type: 'bullet_barrage', count: 12, waves: 7, delay: 140, speed: 105, damage: this.damage * 1.6 },
                    { type: 'bullet_circle', count: 26, speed: 120, damage: this.damage * 2 },
                    { type: 'dash_attack', speed: 750, damage: this.damage * 3 },
                    { type: 'ground_pound', radius: 300, damage: this.damage * 2.2 }
                ];
                
                this.phases = [b5phase1, b5phase2, b5phase3, b5phase4, b5phase5, b5phase6];
                this.currentPhase = b5phase1;
                this.currentPhase.activate();
                break;
        }
    }

    updatePhase() {
        if (!this.phases || !this.phases.length) return;
        
        // First-time initialization of phases

        const currentTime = performance.now();
        if (currentTime - this.lastPhaseChange < this.phaseChangeDelay) {
            return; // Prevent too rapid phase changes
        }
        
        // Calculate current health percentage
        const healthPercentage = this.health / this.maxHealth;
        
        // Check if we need to transition to a new phase
        for (let i = this.phases.length - 1; i >= 0; i--) {
            const phase = this.phases[i];
            
            // If health is at or below this phase's threshold and it's not the current phase
            if (healthPercentage <= (1 - phase.healthThreshold) && this.currentPhase !== phase) {
                // Deactivate current phase if it exists
                if (this.currentPhase && typeof this.currentPhase.deactivate === 'function') {
                    this.currentPhase.deactivate();
                }
                
                // Make boss briefly invincible during phase transition
                this.invincible = true;
                this.invincibilityStart = currentTime;
                
                // Activate new phase
                this.currentPhase = phase;
                this.lastPhaseChange = currentTime;
                
                if (typeof this.currentPhase.activate === 'function') {
                    this.currentPhase.activate();
                }
                
                // Flash effect when changing phases
                this.flashTime = currentTime;
                
                break;
            }
        }
    }

    createDamageEffect() {
        if (!window.game) return;
        
        // Different colors for different enemy types
        let particleColor;
        switch(this.type) {
            case 'normal':
                particleColor = '#ff5555';
                break;
            case 'speedster':
                particleColor = '#55aaff';
                break;
            case 'tank':
                particleColor = '#aa55ff';
                break;
            default:
                particleColor = '#ff5555';
        }

        // Create damage particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color: particleColor,
                life: 1,
                startTime: performance.now(),
                duration: 300 + Math.random() * 200,
                
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    if (elapsed > this.duration) return true;
                    
                    this.life = 1 - (elapsed / this.duration);
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    return false;
                },
                
                draw: function(ctx) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = `${this.color}${Math.floor(this.life * 255).toString(16).padStart(2, '0')}`;
                    ctx.fill();
                    ctx.restore();
                }
            };
            
            window.game.visualEffects.push(particle);
        }
    }

    update(player, currentTime, bullets) {
        // Calculate distance to player first
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check for close-range knockback for shooter types first
        if ((this.type === 'shooter' || this.type === 'laserShooter') && !this.isDashing && !this.isReturning) {
            const tooCloseDistance = this.size * 3;
            if (distance < tooCloseDistance) {
                // Calculate knockback
                const knockbackForce = 15;
                const knockbackDirection = {
                    x: dx / distance,
                    y: dy / distance
                };
                
                // Apply knockback to player
                player.x += knockbackDirection.x * knockbackForce;
                player.y += knockbackDirection.y * knockbackForce;
                
                // Keep player within bounds
                if (window.game) {
                    player.x = Math.max(player.size, Math.min(window.game.canvas.width - player.size, player.x));
                    player.y = Math.max(player.size, Math.min(window.game.canvas.height - player.size, player.y));
                }

                // Deal extra damage
                player.takeDamage(2);

                // Create repulsion particle effect
                this.createRepulsionEffect(knockbackDirection);
            }
        }

        // Boss specific handling
        if (this.isBoss && !this.isDashing && !this.isReturning) {
            // Update boss phases
            if (this.currentPhase) {
                if (typeof this.currentPhase.update === 'function') {
                    this.currentPhase.update(currentTime);
                }
                this.updatePhase();
            }

            // Random movement while maintaining distance
            const optimalDistance = 200; // Desired distance from player

            // Generate random movement angle
            if (!this.randomAngle || currentTime - this.lastDirectionChange > 2000) {
                this.randomAngle = Math.random() * Math.PI * 2;
                this.lastDirectionChange = currentTime;
            }

            // Move in random direction while maintaining distance
            if (distance < optimalDistance - 50) {
                // Move away from player
                this.x -= (dx / distance) * this.speed;
                this.y -= (dy / distance) * this.speed;
            } else if (distance > optimalDistance + 50) {
                // Move towards player
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            } else {
                // Move in random direction
                this.x += Math.cos(this.randomAngle) * this.speed;
                this.y += Math.sin(this.randomAngle) * this.speed;
            }

            // Keep boss within canvas bounds
            const margin = 50;
            if (window.game) {
                this.x = Math.max(margin, Math.min(window.game.canvas.width - margin, this.x));
                this.y = Math.max(margin, Math.min(window.game.canvas.height - margin, this.y));
            }

            // Check for collision with player
            if (distance <= player.size + this.size) {
                // Calculate knockback for player
                const knockbackDistance = 150;
                const knockbackDirection = {
                    x: dx / distance,
                    y: dy / distance
                };
                
                // Apply knockback to player position
                player.x += knockbackDirection.x * knockbackDistance;
                player.y += knockbackDirection.y * knockbackDistance;
                
                // Deal damage to player
                player.takeDamage(this.damage);
            }

            return false;
        }

        if (this.type === 'laserShooter') {
            const timeSinceLastLaser = currentTime - this.lastLaserTime;
            
            // If in range and not on cooldown, start charging
            if (distance <= this.shootRange && 
                timeSinceLastLaser >= this.laserCooldown && 
                !this.isCharging && 
                !this.firingLaser) {
                
                this.isCharging = true;
                this.chargingStartTime = currentTime;
                this.laserTarget = { x: player.x, y: player.y };
            }
            
            // Charging behavior
            if (this.isCharging) {
                const chargeElapsed = currentTime - this.chargingStartTime;
                
                if (chargeElapsed >= this.chargeTime) {
                    // Store the direction when transitioning from charging to firing
                    const dx = this.laserTarget.x - this.x;
                    const dy = this.laserTarget.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.fixedLaserDirection = {
                        x: dx / dist,
                        y: dy / dist
                    };
                    // Charge complete, fire laser
                    this.isCharging = false;
                    this.firingLaser = true;
                    this.laserStartTime = currentTime;
                    this.lastLaserTime = currentTime;
                    this.laserActive = true;
                }
                
                // Maintain optimal distance while charging
                const desiredDistance = this.shootRange * 0.8;
                if (distance < desiredDistance - 10) {
                    this.x -= (dx / distance) * this.speed;
                    this.y -= (dy / distance) * this.speed;
                } else if (distance > desiredDistance + 10) {
                    this.x += (dx / distance) * this.speed;
                    this.y += (dy / distance) * this.speed;
                }
                return false;
            }
            
            // Firing behavior
            if (this.firingLaser) {
                const firingElapsed = currentTime - this.laserStartTime;
                
                if (firingElapsed >= this.laserDuration) {
                    this.firingLaser = false;
                    this.laserActive = false;
                }
                
                // Don't move while firing and use fixed direction
                if (this.laserActive) {
                    this.direction = this.fixedLaserDirection;
                    
                    // Check if player is in laser beam using fixed direction
                    const playerAngle = Math.atan2(dy, dx);
                    const laserAngle = Math.atan2(this.fixedLaserDirection.y, this.fixedLaserDirection.x);
                    const angleDiff = Math.abs(playerAngle - laserAngle);
                    
                    if (angleDiff < 0.2 || angleDiff > Math.PI * 2 - 0.2) {
                        player.takeDamage(this.laserDamage * (1/60));
                    }
                }
                return false;
            }
            
            // Movement during cooldown
            if (!this.isCharging && !this.firingLaser) {
                const desiredDistance = this.shootRange * 0.8;
                if (distance < desiredDistance - 10) {
                    this.x -= (dx / distance) * this.speed;
                    this.y -= (dy / distance) * this.speed;
                } else if (distance > desiredDistance + 10) {
                    this.x += (dx / distance) * this.speed;
                    this.y += (dy / distance) * this.speed;
                }
            }
            
            return false;
        }

        // Regular movement for other enemy types
        if ((this.type !== 'shooter' && this.type !== 'laserShooter') || distance > this.range) {
            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
        
        // Handle boss movement
        if (this.isDashing) {
            const elapsed = performance.now() - this.dashStartTime;
            const progress = Math.min(elapsed / this.dashDuration, 1);
            
            this.x = this.originalPosition.x + this.dashDirection.x * this.dashDistance * progress;
            this.y = this.originalPosition.y + this.dashDirection.y * this.dashDistance * progress;
            return false;
        }
        
        if (this.isReturning) {
            const elapsed = performance.now() - this.returnStartTime;
            const progress = Math.min(elapsed / this.returnDuration, 1);
            
            this.x = this.returnStartPosition.x + (this.originalPosition.x - this.returnStartPosition.x) * progress;
            this.y = this.returnStartPosition.y + (this.originalPosition.y - this.returnStartPosition.y) * progress;
            return false;
        }

        // Regular shooter behavior
        if (this.type === 'shooter' && distance <= this.range) {
            this.direction = {
                x: dx / distance,
                y: dy / distance
            };

            if (currentTime - this.lastShot > this.fireRate) {
                bullets.push(new Bullet(
                    this.x,
                    this.y,
                    this.direction,
                    this.damage,
                    0,
                    true
                ));
                
                this.lastShot = currentTime;
            }
        }

        // Handle invincibility
        if (this.invincible && currentTime - this.invincibilityStart > this.invincibilityDuration) {
            this.invincible = false;
        }

        // Check for collision with player and create damage effect
        if (distance <= player.size + this.size) {
            // Create explosion effect for all enemy types on collision
            this.createCollisionExplosion();
            
            // Create damage effect for basic enemy types
            if (this.type === 'normal' || this.type === 'speedster' || this.type === 'tank') {
                this.createDamageEffect();
            }
            
            // Calculate knockback for player
            const knockbackDistance = 150;
            const knockbackDirection = {
                x: dx / distance,
                y: dy / distance
            };
            
            // Apply knockback to player position
            player.x += knockbackDirection.x * knockbackDistance;
            player.y += knockbackDirection.y * knockbackDistance;
            
            // Deal damage to player
            player.takeDamage(this.damage);

            // Trigger death animation and explosion for non-boss enemies
            if (!this.isBoss) {
                this.health = 0;
                return true;
            }
        }
        
        return distance <= player.size + this.size;
    }

    createCollisionExplosion() {
        if (!window.game) return;

        // Create expanding ring effect
        const ring = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.size * 4,
            startTime: performance.now(),
            duration: 400,
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
                ctx.strokeStyle = `rgba(255, 200, 50, ${1 - progress})`;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }
        };

        window.game.visualEffects.push(ring);

        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 3 + Math.random() * 2;
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                color: this.color,
                life: 1,
                startTime: performance.now(),
                duration: 500 + Math.random() * 300,
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    if (elapsed > this.duration) return true;
                    this.life = 1 - (elapsed / this.duration);
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    return false;
                },
                draw: function(ctx) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = `${this.color}${Math.floor(this.life * 255).toString(16).padStart(2, '0')}`;
                    ctx.fill();
                    ctx.restore();
                }
            };
            window.game.visualEffects.push(particle);
        }
    }

    createRepulsionEffect(direction) {
        if (!window.game) return;

        // Create particles in a cone shape
        for (let i = 0; i < 12; i++) {
            const spread = Math.PI / 4; // 45-degree spread
            const baseAngle = Math.atan2(direction.y, direction.x);
            const angle = baseAngle - spread/2 + (spread * Math.random());
            const speed = 2 + Math.random() * 2;
            
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                color: this.type === 'laserShooter' ? '#55ffaa' : '#ffaa55',
                life: 1,
                startTime: performance.now(),
                duration: 500 + Math.random() * 300,
                
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    if (elapsed > this.duration) return true;
                    
                    this.life = 1 - (elapsed / this.duration);
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    return false;
                },
                
                draw: function(ctx) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = `${this.color}${Math.floor(this.life * 255).toString(16).padStart(2, '0')}`;
                    ctx.fill();
                    ctx.restore();
                }
            };
            
            window.game.visualEffects.push(particle);
        }
    }

    draw(ctx) {
        // Draw phase warnings if this is a boss
        if (this.type.startsWith('boss') && this.currentPhase) {
            this.currentPhase.draw(ctx);
        }
        
        // Save context state
        ctx.save();
        
        // Translate to enemy position
        ctx.translate(this.x, this.y);
        
        // Draw charging indicator for laserShooter
        if (this.type === 'laserShooter' && this.isCharging) {
            const chargeProgress = (performance.now() - this.chargingStartTime) / this.chargeTime;
            
            // Draw charging circle
            ctx.beginPath();
            ctx.arc(0, 0, this.size * (1 + chargeProgress * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(85, 255, 170, ${chargeProgress * 0.7})`;
            ctx.fill();
            
            // Draw aiming line
            if (this.laserTarget) {
                const dx = this.laserTarget.x - this.x;
                const dy = this.laserTarget.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const direction = {
                        x: dx / distance,
                        y: dy / distance
                    };
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(direction.x * 1000, direction.y * 1000);
                    ctx.strokeStyle = `rgba(85, 255, 170, ${chargeProgress * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
        
        // Draw cooldown indicator for laser shooter
        if (this.type === 'laserShooter' && !this.isCharging && !this.firingLaser) {
            const timeSinceLastLaser = performance.now() - this.lastLaserTime;
            if (timeSinceLastLaser < this.laserCooldown) {
                const cooldownProgress = timeSinceLastLaser / this.laserCooldown;
                
                // Draw cooldown circle
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(85, 255, 170, 0.3)`;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw cooldown progress
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, this.size * 1.2, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * cooldownProgress));
                ctx.lineTo(0, 0);
                ctx.fillStyle = `rgba(85, 255, 170, 0.2)`;
                ctx.fill();
            }
        }
        
        // Apply flash effect when changing phases
        if (performance.now() - this.flashTime < this.flashDuration) {
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin((performance.now() - this.flashTime) / this.flashDuration * Math.PI * 5);
            ctx.globalCompositeOperation = 'lighter';
        }
    
        // Draw enemy image
        const drawSize = this.size * 2;
        ctx.drawImage(this.image, -drawSize/2, -drawSize/2, drawSize, drawSize);
        
        // Restore context state
        ctx.restore();
       
        // Draw health bar
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 4;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - this.size - 8;
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
        
        // Draw laser beam
        if (this.type === 'laserShooter' && this.laserActive) {
            const laserLength = 1000;
            
            // Use the fixed direction for drawing the laser beam
            const direction = this.fixedLaserDirection;
            
            // Create gradient for laser beam
            const gradient = ctx.createLinearGradient(
                this.x, this.y,
                this.x + direction.x * laserLength,
                this.y + direction.y * laserLength
            );
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 100, 100, 0.2)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.laserWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + direction.x * laserLength,
                this.y + direction.y * laserLength
            );
            ctx.stroke();
            
            // Draw laser source glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.laserWidth/2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.fill();
        }
    }
    
    getPlayerDirection() {
        if (!window.game || !window.game.player) {
            return { x: 0, y: 1 };
        }
        
        const dx = window.game.player.x - this.x;
        const dy = window.game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            return {
                x: dx / distance,
                y: dy / distance
            };
        }
        
        return { x: 0, y: 1 };
    }
    
    takeDamage(amount) {
        if (this.godMode || this.invincible) return false;

        if (this.isBoss && this.currentPhase) {
            const phaseDestroyed = this.currentPhase.takeDamage(amount);
            
            if (phaseDestroyed) {
                // Create phase destruction effect
                this.createPhaseDestructionEffect();
                
                // Move to next phase
                this.currentPhaseIndex++;
                
                // If this was the last phase, boss is defeated
                if (this.currentPhaseIndex >= this.phases.length) {
                    this.createFinalExplosion();
                    this.health = 0;
                    return true;
                }
                
                // Activate next phase
                this.currentPhase = this.phases[this.currentPhaseIndex];
                this.currentPhase.activate();
            }
            
            return false;
        } else {
            this.health -= amount;
            if (this.health < 0) this.health = 0;
            return this.health <= 0;
        }
    }

    createPhaseDestructionEffect() {
        if (!window.game) return;

        // Create expanding ring effect
        const ring = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: 150,
            startTime: performance.now(),
            duration: 800,
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
                ctx.strokeStyle = `rgba(255, 150, 50, ${1 - progress})`;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }
        };

        window.game.visualEffects.push(ring);
    }

    createFinalExplosion() {
        if (!window.game) return;

        // Create multiple expanding rings
        for (let i = 0; i < 3; i++) {
            const delay = i * 200;
            setTimeout(() => {
                const ring = {
                    x: this.x,
                    y: this.y,
                    radius: 0,
                    maxRadius: 300,
                    startTime: performance.now(),
                    duration: 1000,
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
                        ctx.strokeStyle = `rgba(255, 100, 0, ${1 - progress})`;
                        ctx.lineWidth = 5;
                        ctx.stroke();
                        ctx.restore();
                    }
                };
                window.game.visualEffects.push(ring);
            }, delay);
        }

        // Create particle explosion
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                life: 1,
                startTime: performance.now(),
                duration: 1000 + Math.random() * 500,
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    if (elapsed > this.duration) return true;
                    
                    this.life = 1 - (elapsed / this.duration);
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.1; // Add gravity
                    return false;
                },
                draw: function(ctx) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${this.life})`;
                    ctx.fill();
                    ctx.restore();
                }
            };
            window.game.visualEffects.push(particle);
        }
    }
    
    explode() {
        // Create explosion for all enemy types
        const baseRadius = this.type === 'bomber' ? this.explosionRadius : this.size * 2;
        const baseDamage = this.type === 'bomber' ? this.explosionDamage : this.damage;
        
        // Create a more elaborate explosion effect
        if (window.game) {
            // Create expanding ring
            const ring = {
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: baseRadius,
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
            window.game.visualEffects.push(ring);

            // Create explosion particles
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const speed = 3 + Math.random() * 2;
                const particle = {
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 2,
                    color: this.color,
                    life: 1,
                    startTime: performance.now(),
                    duration: 500 + Math.random() * 300,
                    update: function(currentTime) {
                        const elapsed = currentTime - this.startTime;
                        if (elapsed > this.duration) return true;
                        this.life = 1 - (elapsed / this.duration);
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.95;
                        this.vy *= 0.95;
                        return false;
                    },
                    draw: function(ctx) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = `${this.color}${Math.floor(this.life * 255).toString(16).padStart(2, '0')}`;
                        ctx.fill();
                        ctx.restore();
                    }
                };
                window.game.visualEffects.push(particle);
            }
        }

        return {
            x: this.x,
            y: this.y,
            radius: baseRadius,
            damage: baseDamage
        };
    }
}
