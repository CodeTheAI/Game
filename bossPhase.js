class BossPhase {
    constructor(boss, phaseNumber, maxHealth) {
        this.boss = boss;
        this.phaseNumber = phaseNumber;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.active = false;
        this.attackPatterns = [];
        this.currentPattern = null;
        this.patternIndex = 0;
        this.lastPatternTime = 0;
        this.patternDelay = 2500; // Reduced delay between patterns
        this.warningIndicators = [];
        this.transitioning = false;
        this.transitionEndTime = 0;
        this.transitionDuration = 1000;
        this.nextPatternScheduled = false;
    }

    activate() {
        this.transitioning = true;
        this.transitionEndTime = performance.now() + this.transitionDuration;
        this.active = true;
        this.patternIndex = 0;
        this.lastPatternTime = performance.now() - this.patternDelay; // Start first attack immediately
        this.clearWarnings();
        this.nextPatternScheduled = false;
        
        // Play phase transition effect
        this.playTransitionEffect();
    }

    deactivate() {
        this.active = false;
        this.clearWarnings();
    }

    update(currentTime) {
        if (!this.active || !this.boss || this.boss.health <= 0) return;

        // Handle phase transition
        if (this.transitioning) {
            if (currentTime >= this.transitionEndTime) {
                this.transitioning = false;
                // Execute first pattern immediately after transition
                this.executeNextPattern(currentTime);
            }
            return;
        }
        
        // Check if it's time for the next pattern
        if (currentTime - this.lastPatternTime > this.patternDelay && !this.nextPatternScheduled) {
            this.executeNextPattern(currentTime);
            this.lastPatternTime = currentTime;
            this.nextPatternScheduled = true;

            // Reset the flag after patternDelay to allow next pattern
            setTimeout(() => {
                this.nextPatternScheduled = false;
            }, 1500); // Warning duration
        }
        
        // Update any active warnings
        this.updateWarnings(currentTime);
    }

    executeNextPattern(currentTime) {
        if (this.transitioning) return;

        // Get the next attack pattern
        this.currentPattern = this.attackPatterns[this.patternIndex];
        this.patternIndex = (this.patternIndex + 1) % this.attackPatterns.length;
        
        // Create warning indicators for this pattern
        this.createWarnings(this.currentPattern, currentTime);
        
        // Schedule the actual attack
        setTimeout(() => {
            if (this.active && !this.transitioning && this.boss && this.boss.health > 0) {
                this.executePattern(this.currentPattern);
            }
        }, 1500); // 1.5 second warning before attack
    }

    createWarnings(pattern, currentTime) {
        this.clearWarnings();
        
        switch (pattern.type) {
            case 'bullet_circle':
                // Create circular warning around boss
                this.warningIndicators.push({
                    type: 'circle',
                    x: this.boss.x,
                    y: this.boss.y,
                    radius: pattern.radius,
                    color: 'rgba(255, 0, 0, 0.3)',
                    startTime: currentTime,
                    duration: 1500
                });
                break;
                
            case 'laser_sweep':
                // Create line warning for laser
                const angle = pattern.startAngle || 0;
                const length = 1000; // Long enough to reach screen edges
                
                const endX = this.boss.x + Math.cos(angle) * length;
                const endY = this.boss.y + Math.sin(angle) * length;
                
                this.warningIndicators.push({
                    type: 'line',
                    x1: this.boss.x,
                    y1: this.boss.y,
                    x2: endX,
                    y2: endY,
                    width: 20,
                    color: 'rgba(255, 0, 0, 0.3)',
                    startTime: currentTime,
                    duration: 1500,
                    angle: angle
                });
                break;
                
            case 'ground_pound':
                // Create area warning
                this.warningIndicators.push({
                    type: 'circle',
                    x: pattern.x,
                    y: pattern.y,
                    radius: pattern.radius,
                    color: 'rgba(255, 0, 0, 0.3)',
                    startTime: currentTime,
                    duration: 1500
                });
                break;
                
            case 'bullet_barrage':
                // Create multiple point warnings
                for (let i = 0; i < pattern.count; i++) {
                    const angle = (i / pattern.count) * Math.PI * 2;
                    const distance = pattern.distance || 200;
                    
                    const x = this.boss.x + Math.cos(angle) * distance;
                    const y = this.boss.y + Math.sin(angle) * distance;
                    
                    this.warningIndicators.push({
                        type: 'circle',
                        x: x,
                        y: y,
                        radius: 30,
                        color: 'rgba(255, 0, 0, 0.3)',
                        startTime: currentTime,
                        duration: 1500
                    });
                }
                break;
                
            case 'dash_attack':
                // Create line warning for dash path
                const dashAngle = Math.atan2(
                    pattern.targetY - this.boss.y,
                    pattern.targetX - this.boss.x
                );
                
                const dashEndX = this.boss.x + Math.cos(dashAngle) * pattern.distance;
                const dashEndY = this.boss.y + Math.sin(dashAngle) * pattern.distance;
                
                this.warningIndicators.push({
                    type: 'line',
                    x1: this.boss.x,
                    y1: this.boss.y,
                    x2: dashEndX,
                    y2: dashEndY,
                    width: 30,
                    color: 'rgba(255, 0, 0, 0.3)',
                    startTime: currentTime,
                    duration: 1500
                });
                break;
        }
    }
    
    updateWarnings(currentTime) {
        for (let i = this.warningIndicators.length - 1; i >= 0; i--) {
            const warning = this.warningIndicators[i];
            const elapsed = currentTime - warning.startTime;
            
            // Remove expired warnings
            if (elapsed > warning.duration) {
                this.warningIndicators.splice(i, 1);
                continue;
            }
            
            // Calculate fill progress
            const progress = elapsed / warning.duration;
            
            if (warning.type === 'circle') {
                // For ground pound circles, use solid fill that grows with progress
                warning.fillProgress = progress;
            } else if (warning.type === 'line' && this.currentPattern && this.currentPattern.type === 'laser_sweep') {
                // For laser sweep warnings, update the angle
                const sweepProgress = progress * 0.8;
                const totalAngle = this.currentPattern.endAngle - this.currentPattern.startAngle;
                const currentAngle = this.currentPattern.startAngle + (totalAngle * sweepProgress);
                
                const length = 1000;
                warning.x2 = this.boss.x + Math.cos(currentAngle) * length;
                warning.y2 = this.boss.y + Math.sin(currentAngle) * length;
            }
        }
    }
    
    clearWarnings() {
        this.warningIndicators = [];
    }
    
    executePattern(pattern) {
        if (!this.boss || this.boss.health <= 0) return;
        
        switch (pattern.type) {
            case 'bullet_circle':
                this.executeBulletCircle(pattern);
                break;
            case 'laser_pillar':
                this.executeLaserPillar(pattern);
                break;
            case 'laser_sweep':
                this.executeLaserSweep(pattern);
                break;
            case 'ground_pound':
                this.executeGroundPound(pattern);
                break;
            case 'bullet_barrage':
                this.executeBulletBarrage(pattern);
                break;
            case 'dash_attack':
                this.executeDashAttack(pattern);
                break;
        }
    }
    
    executeBulletCircle(pattern) {
        const count = pattern.count || 8;
        const baseLayers = 3;
        // Increase layers based on phase number
        const layers = this.phaseNumber >= 3 ? baseLayers + Math.min(this.phaseNumber - 2, 3) : baseLayers;
        const angleOffset = Math.PI / 6; 
        const baseSpeed = pattern.speed || 5;
        
        // Repeat pattern more times in later phases
        const repetitions = this.phaseNumber >= 4 ? Math.min(this.phaseNumber - 2, 3) : 1;
        const repetitionDelay = 1000; // 1 second between repetitions
        
        for (let rep = 0; rep < repetitions; rep++) {
            setTimeout(() => {
                // Execute one full bullet circle pattern
                for (let layer = 0; layer < layers; layer++) {
                    const layerSpeed = baseSpeed * (1 - layer * 0.15);
                    const layerAngleOffset = layer * angleOffset + (rep * Math.PI / repetitions); // Rotate each repetition
                    
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2 + layerAngleOffset;
                        const bullet = new Bullet(
                            this.boss.x,
                            this.boss.y,
                            {
                                x: Math.cos(angle),
                                y: Math.sin(angle)
                            },
                            pattern.damage || this.boss.damage,
                            0,
                            true,
                            layerSpeed
                        );
                        
                        bullet.maxTrailLength = 8;
                        bullet.radius = 0;
                        bullet.growthRate = 0.5;
                        bullet.maxRadius = 2000;
                        bullet.centerX = this.boss.x;
                        bullet.centerY = this.boss.y;
                        bullet.originalUpdate = bullet.update;
                        bullet.spiralAngle = angle;
                        bullet.angularVelocity = 0.02 * (1 + (rep * 0.2)); // Increase spiral speed with each repetition
                        
                        if (window.game) {
                            window.game.enemyBullets.push(bullet);
                        }
                    }
                }
            }, rep * repetitionDelay);
        }
    }

    executeLaserPillar(pattern) {
        const count = pattern.count || 3;
        const warningDuration = 2000;
        const spacing = window.game.canvas.width / (count + 1);
        const damage = pattern.damage || this.boss.damage * 1.5;
        const pillarWidth = 60;

        // Create warning areas
        const pillars = [];
        for (let i = 0; i < count; i++) {
            const x = spacing * (i + 1);
            pillars.push({
                x: x,
                width: pillarWidth,
                warning: {
                    type: 'line',
                    x1: x,
                    y1: 0,
                    x2: x,
                    y2: window.game.canvas.height,
                    width: pillarWidth,
                    color: 'rgba(255, 0, 0, 0.3)',
                    startTime: performance.now(),
                    duration: warningDuration,
                    blinkRate: 200 // Blink every 200ms
                }
            });
        }

        // Add warnings to the phase
        this.warningIndicators.push(...pillars.map(p => p.warning));

        // After warning duration, create the actual laser pillars
        setTimeout(() => {
            if (!this.boss || this.boss.health <= 0) return;

            // Clear warnings
            this.clearWarnings();

            // Create laser pillars
            for (const pillar of pillars) {
                const laser = {
                    x: pillar.x,
                    width: pillar.width,
                    damage: damage,
                    startTime: performance.now(),
                    duration: 1000,
                    update: function(currentTime) {
                        const elapsed = currentTime - this.startTime;
                        return elapsed > this.duration;
                    },
                    draw: function(ctx) {
                        ctx.save();
                        
                        // Create gradient for laser beam
                        const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
                        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.2)');
                        gradient.addColorStop(0.5, 'rgba(255, 50, 50, 0.8)');
                        gradient.addColorStop(1, 'rgba(255, 50, 50, 0.2)');
                        
                        // Draw main laser beam
                        ctx.fillStyle = gradient,
                        ctx.fill();
                        ctx.fillRect(this.x - this.width/2, 0, this.width, ctx.canvas.height);
                        
                        // Add glow effect
                        const glowGradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
                        glowGradient.addColorStop(0, 'rgba(255, 100, 100, 0)');
                        glowGradient.addColorStop(0.5, 'rgba(255, 100, 100, 0.3)');
                        glowGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
                        
                        ctx.fillStyle = glowGradient;
                        ctx.fillRect(this.x - this.width, 0, this.width * 2, ctx.canvas.height);
                        
                        ctx.restore();
                    },
                    checkCollision: function(player) {
                        return Math.abs(player.x - this.x) < (this.width/2 + player.size);
                    }
                };

                if (window.game) {
                    window.game.bossLasers.push(laser);
                }
            }

            // Execute dash attack after lasers are created
            if (pattern.followWithDash) {
                // Find the nearest pillar to the boss
                const nearestPillar = pillars.reduce((nearest, pillar) => {
                    const dist = Math.abs(pillar.x - this.boss.x);
                    return dist < Math.abs(nearest.x - this.boss.x) ? pillar : nearest;
                });

                setTimeout(() => {
                    if (!this.boss || this.boss.health <= 0) return;
                    
                    this.executeDashAttack({
                        targetX: nearestPillar.x,
                        targetY: this.boss.y,
                        speed: pattern.dashSpeed || 500,
                        damage: pattern.dashDamage || this.boss.damage * 2,
                        pauseBetweenDashes: 100 // 100ms pause between consecutive dashes
                    });
                }, 200); // Short delay before dash
            }
        }, warningDuration);
    }

    executeLaserSweep(pattern) {
        const startAngle = pattern.startAngle || 0;
        const endAngle = pattern.endAngle || (startAngle + Math.PI);
        const duration = pattern.duration || 2000;
        const damage = pattern.damage || this.boss.laserDamage || 20;
        const width = 40; // Increased from 20 to 40 for wider beam
        
        // Create a laser object that follows the boss
        const laser = {
            boss: this.boss,
            currentAngle: startAngle,
            startAngle: startAngle,
            endAngle: endAngle,
            startTime: performance.now(),
            duration: duration,
            width: width,
            length: 1000,
            damage: damage,
            update: function(currentTime) {
                if (!this.boss || this.boss.health <= 0) return true;
                
                // Update laser position to follow boss
                this.startX = this.boss.x;
                this.startY = this.boss.y;
                
                // Update laser angle
                const progress = (currentTime - this.startTime) / this.duration;
                if (progress >= 1) {
                    return true; // Remove laser
                }
                
                // Smooth sine-based sweeping motion
                const sweepProgress = Math.sin(progress * Math.PI / 2);
                this.currentAngle = this.startAngle + (this.endAngle - this.startAngle) * sweepProgress;
                return false;
            },
            draw: function(ctx) {
                const endX = this.startX + Math.cos(this.currentAngle) * this.length;
                const endY = this.startY + Math.sin(this.currentAngle) * this.length;
                
                // Create gradient for laser with increased opacity
                const gradient = ctx.createLinearGradient(
                    this.startX, this.startY,
                    endX, endY
                );
                
                gradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)'); // More opaque core
                gradient.addColorStop(1, 'rgba(255, 50, 50, 0.3)');
                
                // Draw main laser beam
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(endX, endY);
                ctx.lineWidth = this.width;
                ctx.strokeStyle = gradient;
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Add glow effect
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(endX, endY);
                ctx.lineWidth = this.width + 20; // Wider glow
                ctx.strokeStyle = 'rgba(255, 50, 50, 0.2)';
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.restore();
            },
            checkCollision: function(player) {
                // Calculate vector to player from laser start
                const dx = player.x - this.startX;
                const dy = player.y - this.startY;
                
                // Calculate dot product with normalized laser direction
                const laserDirX = Math.cos(this.currentAngle);
                const laserDirY = Math.sin(this.currentAngle);
                const dot = dx * laserDirX + dy * laserDirY;
                
                // Find closest point on laser line
                const closestX = this.startX + laserDirX * dot;
                const closestY = this.startY + laserDirY * dot;
                
                // Check if this point is within the laser's length
                const laserLength = Math.sqrt(
                    Math.pow(closestX - this.startX, 2) + 
                    Math.pow(closestY - this.startY, 2)
                );
                
                if (laserLength > this.length) return false;
                
                // Calculate distance from player to closest point
                const distToPlayer = Math.sqrt(
                    Math.pow(player.x - closestX, 2) + 
                    Math.pow(player.y - closestY, 2)
                );
                
                // Check if player is within the wider hitbox
                return distToPlayer < (this.width / 2 + player.size);
            }
        };
        
        // Add laser to game
        if (window.game) {
            window.game.bossLasers.push(laser);
        }
    }
    
    executeGroundPound(pattern) {
        // Create multiple smaller explosions around the player's position
        const targetX = pattern.x || window.game.player.x;
        const targetY = pattern.y || window.game.player.y;
        const baseRadius = (pattern.radius || 150) * 0.6; // Make each explosion smaller
        const instanceCount = 3; // Number of ground pounds
        const spreadRadius = pattern.radius || 150; // Area to spread the explosions in

        for (let i = 0; i < instanceCount; i++) {
            // Calculate position with some random spread around the target
            const angle = (i / instanceCount) * Math.PI * 2;
            const spreadDistance = Math.random() * spreadRadius * 0.5;
            const explosionX = targetX + Math.cos(angle) * spreadDistance;
            const explosionY = targetY + Math.sin(angle) * spreadDistance;

            const explosion = {
                x: explosionX,
                y: explosionY,
                radius: 0,
                maxRadius: baseRadius,
                damage: pattern.damage || this.boss.damage,
                startTime: performance.now() + i * 200, // Stagger the explosions
                duration: 500,
                lingerDuration: 1500,
                hasDealtDamage: false,
                cracks: [],
                particles: [],
                update: function(currentTime) {
                    const elapsed = currentTime - this.startTime;
                    
                    if (elapsed < 0) return false; // Wait for staggered start
                    
                    if (elapsed <= this.duration) {
                        this.radius = this.maxRadius * (elapsed / this.duration);
                        
                        // Create particles during explosion
                        if (Math.random() < 0.3) {
                            const particleCount = 2 + Math.random() * 3;
                            for (let j = 0; j < particleCount; j++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = 1 + Math.random() * 3;
                                this.particles.push({
                                    x: this.x + Math.cos(angle) * this.radius,
                                    y: this.y + Math.sin(angle) * this.radius,
                                    vx: Math.cos(angle) * speed,
                                    vy: Math.sin(angle) * speed - 2, // Initial upward velocity
                                    size: 2 + Math.random() * 3,
                                    life: 1,
                                    gravity: 0.1
                                });
                            }
                        }
                    }

                    // Update particles
                    for (let i = this.particles.length - 1; i >= 0; i--) {
                        const particle = this.particles[i];
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.vy += particle.gravity;
                        particle.life -= 0.02;
                        if (particle.life <= 0) {
                            this.particles.splice(i, 1);
                        }
                    }

                    // Generate cracks when explosion reaches full size
                    if (elapsed >= this.duration && !this.cracks.length) {
                        const crackCount = 6 + Math.random() * 3;
                        for (let i = 0; i < crackCount; i++) {
                            const angle = (i / crackCount) * Math.PI * 2 + Math.random() * 0.5;
                            const length = this.radius * (0.5 + Math.random() * 0.5);
                            const segments = [];
                            let currentX = this.x;
                            let currentY = this.y;
                            let remainingLength = length;
                            
                            while (remainingLength > 0) {
                                const segmentLength = Math.min(remainingLength, 20 + Math.random() * 20);
                                const deviation = (Math.random() - 0.5) * Math.PI / 6;
                                const segmentAngle = angle + deviation;
                                
                                const endX = currentX + Math.cos(segmentAngle) * segmentLength;
                                const endY = currentY + Math.sin(segmentAngle) * segmentLength;
                                
                                segments.push({
                                    x1: currentX,
                                    y1: currentY,
                                    x2: endX,
                                    y2: endY
                                });
                                
                                currentX = endX;
                                currentY = endY;
                                remainingLength -= segmentLength;
                            }
                            
                            this.cracks.push(segments);
                        }
                    }

                    // Remove after lingering
                    return elapsed > this.duration + this.lingerDuration;
                },
                draw: function(ctx) {
                    ctx.save();
                    
                    const elapsed = performance.now() - this.startTime;
                    if (elapsed < 0) {
                        ctx.restore();
                        return;
                    }

                    const progress = Math.min(elapsed / this.duration, 1);
                    const fadeAlpha = elapsed > this.duration ? 
                        1 - ((elapsed - this.duration) / this.lingerDuration) : 1;
                    
                    // Draw particles
                    for (const particle of this.particles) {
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 100, 0, ${particle.life * fadeAlpha})`;
                        ctx.fill();
                    }

                    // Draw explosion circle only during initial expansion
                    if (elapsed <= this.duration) {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 100, 0, ${0.5 * fadeAlpha})`;
                        ctx.fill();
                    }
                    
                    // Draw cracks
                    if (this.cracks.length > 0) {
                        ctx.strokeStyle = `rgba(255, 100, 0, ${fadeAlpha})`;
                        ctx.lineWidth = 2;
                        
                        for (const segments of this.cracks) {
                            for (const segment of segments) {
                                ctx.beginPath();
                                ctx.moveTo(segment.x1, segment.y1);
                                ctx.lineTo(segment.x2, segment.y2);
                                ctx.stroke();
                            }
                        }
                    }
                    
                    ctx.restore();
                },
                checkCollision: function(player) {
                    if (this.hasDealtDamage) return false;
                    
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.radius + player.size) {
                        this.hasDealtDamage = true;
                        return true;
                    }
                    
                    return false;
                }
            };
            
            // Add explosion to game
            if (window.game) {
                window.game.explosions.push(explosion);
            }
        }
    }
    
    executeBulletBarrage(pattern) {
        const baseCount = pattern.count || 3;
        const baseWaves = pattern.waves || 3;
        
        // Increase count and waves based on phase
        const count = this.phaseNumber >= 3 ? baseCount + Math.min(this.phaseNumber - 2, 3) : baseCount;
        const waves = this.phaseNumber >= 3 ? baseWaves + Math.min(this.phaseNumber - 2, 4) : baseWaves;
        
        const delay = pattern.delay || 150;
        const baseSpeed = pattern.speed || 6;
        const spreadAngle = Math.PI / 8;
        
        // Increase pattern repetitions in later phases
        const repetitions = this.phaseNumber >= 4 ? Math.min(this.phaseNumber - 2, 3) : 1;
        const repetitionDelay = waves * delay + 1000; // Wait for previous barrage to finish
        
        for (let rep = 0; rep < repetitions; rep++) {
            setTimeout(() => {
                // Execute one full bullet barrage pattern
                for (let wave = 0; wave < waves; wave++) {
                    setTimeout(() => {
                        const waveBaseAngle = (wave / waves) * Math.PI * 2 + (rep * Math.PI / repetitions); // Rotate each repetition
                        
                        for (let i = 0; i < count; i++) {
                            const subCount = 3 + Math.min(this.phaseNumber - 1, 2); // More bullets per direction in later phases
                            const angleStep = spreadAngle / (subCount - 1);
                            
                            for (let j = 0; j < subCount; j++) {
                                const baseAngle = waveBaseAngle + (i / count) * Math.PI * 2;
                                const finalAngle = baseAngle - spreadAngle/2 + j * angleStep;
                                
                                const bullet = new Bullet(
                                    this.boss.x,
                                    this.boss.y,
                                    {
                                        x: Math.cos(finalAngle),
                                        y: Math.sin(finalAngle)
                                    },
                                    pattern.damage || this.boss.damage,
                                    0,
                                    true,
                                    baseSpeed + (j % 2) * 2 + (rep * 0.5) // Increase speed slightly with each repetition
                                );
                                
                                // Add enhanced curving behavior for later phases
                                bullet.originalAngle = finalAngle;
                                bullet.turnRate = (Math.random() - 0.5) * (0.02 + this.phaseNumber * 0.005); // More curve in later phases
                                bullet.currentAngle = finalAngle;
                                
                                if (window.game) {
                                    window.game.enemyBullets.push(bullet);
                                }
                            }
                        }
                    }, wave * delay);
                }
            }, rep * repetitionDelay);
        }
    }
    
    executeDashAttack(pattern) {
        const targetX = pattern.targetX || window.game.player.x;
        const targetY = pattern.targetY || window.game.player.y;
        const speed = pattern.speed || 400;
        const damage = pattern.damage || this.boss.damage * 2 || 30;
        
        // Calculate direction to target
        const dx = targetX - this.boss.x;
        const dy = targetY - this.boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const direction = {
            x: dx / distance,
            y: dy / distance
        };
        
        // Store original position and set dash properties
        const originalX = this.boss.x;
        const originalY = this.boss.y;
        const dashDistance = pattern.distance || distance;
        const dashDuration = dashDistance / speed * 1000;
        
        this.boss.isDashing = true;
        this.boss.dashStartTime = performance.now();
        this.boss.dashDuration = dashDuration;
        this.boss.dashDirection = direction;
        this.boss.dashDistance = dashDistance;
        this.boss.dashDamage = damage;
        this.boss.originalPosition = { x: originalX, y: originalY };
        
        // Return to original position after dash
        setTimeout(() => {
            if (this.boss && this.boss.health > 0) {
                this.boss.isDashing = false;
                
                // Optional: Add a return dash animation
                if (pattern.returnToStart) {
                    const returnDuration = 500; // ms
                    this.boss.isReturning = true;
                    this.boss.returnStartTime = performance.now();
                    this.boss.returnDuration = returnDuration;
                    this.boss.returnStartPosition = { x: this.boss.x, y: this.boss.y };
                    
                    setTimeout(() => {
                        if (this.boss) {
                            this.boss.isReturning = false;
                        }
                    }, returnDuration);
                }
            }
        }, dashDuration);
    }
    
    playTransitionEffect() {
        // Create a visual effect for phase transition
        if (!window.game) return;
        
        // Flash the screen
        const flash = {
            startTime: performance.now(),
            duration: 500,
            update: function(currentTime) {
                const elapsed = currentTime - this.startTime;
                return elapsed > this.duration;
            },
            draw: function(ctx) {
                const elapsed = performance.now() - this.startTime;
                const progress = elapsed / this.duration;
                const alpha = 0.7 * (1 - progress);
                
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        };
        
        window.game.visualEffects.push(flash);
        
        // Create expanding ring around boss
        const ring = {
            x: this.boss.x,
            y: this.boss.y,
            radius: 0,
            maxRadius: 200,
            startTime: performance.now(),
            duration: 1000,
            update: function(currentTime) {
                const elapsed = currentTime - this.startTime;
                if (elapsed > this.duration) return true;
                
                this.radius = this.maxRadius * (elapsed / this.duration);
                return false;
            },
            draw: function(ctx) {
                const elapsed = performance.now() - this.startTime;
                const progress = elapsed / this.duration;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 200, 50, ${alpha})`;
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.restore();
            }
        };
        
        window.game.visualEffects.push(ring);
    }
    
    draw(ctx) {
        // Draw warning indicators
        for (const warning of this.warningIndicators) {
            ctx.save();
            
            if (warning.type === 'circle') {
                // Draw the warning circle
                ctx.beginPath();
                ctx.arc(warning.x, warning.y, warning.radius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw the fill effect
                if (warning.fillProgress !== undefined) {
                    ctx.beginPath();
                    ctx.arc(warning.x, warning.y, warning.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 0, 0, ${warning.fillProgress * 0.3})`;
                    ctx.fill();
                }
            } else if (warning.type === 'line') {
                // Draw line warning
                ctx.beginPath();
                ctx.moveTo(warning.x1, warning.y1);
                ctx.lineTo(warning.x2, warning.y2);
                ctx.strokeStyle = warning.color;
                ctx.lineWidth = warning.width;
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Add glowing effect
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = warning.width + 4;
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return true; // Phase destroyed
        }
        return false;
    }

    getHealthPercentage() {
        return this.health / this.maxHealth;
    }
}


