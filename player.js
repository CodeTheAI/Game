class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = '#00ffaa';
        this.glowColor = 'rgba(0, 255, 170, 0.5)';
        this.lastDamageTime = 0;
        this.damageFlashDuration = 300;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 10;
        this.fireRate = 250; // milliseconds between shots
        this.lastShot = 0;
        this.direction = { x: 0, y: 1 }; // Default pointing down
        this.godMode = false; // Default not in god mode;
        
        // Special laser attack
        this.laserActive = false;
        this.laserDuration = 2500; // 2.5 seconds
        this.laserCooldown = 15000; // 15 seconds
        this.laserLastUsed = 0;
        this.laserWidth = 20;
        this.laserColor = 'rgba(0, 255, 170, 0.7)';
        this.laserCharges = 3; // Maximum 3 shots
        this.maxLaserCharges = 3;
        this.lastLaserActivation = -15000; // Start with cooldown complete
        
        // Upgrades
        this.upgrades = {
            health: 0,
            speed: 0,
            damage: 0,
            fireRate: 0,
            ricochet: 0,
            multiFire: 0,
            autoFire: 0,
            shield: 0
        };

         // Create player image
         this.image = new Image();
         this.image.src = DESIGNS.player;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Add player glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15;
        
        // Draw player body with gradient
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#008855');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction indicator with glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + this.direction.x * (this.size + 10),
            this.y + this.direction.y * (this.size + 10)
        );
        ctx.stroke();

        // Draw damage flash effect
        if (performance.now() - this.lastDamageTime < this.damageFlashDuration) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw health bar with enhanced visuals
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 6;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - this.size - 12;
        
        // Health bar background with glow
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar fill with gradient
        const healthGradient = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth, healthBarY);
        if (this.health < 20) {
            healthGradient.addColorStop(0, '#ff0000');
            healthGradient.addColorStop(1, '#ff4444');
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        } else {
            healthGradient.addColorStop(0, '#00ff00');
            healthGradient.addColorStop(1, '#00aa00');
            ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        }
        
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
        ctx.fillStyle = healthGradient;
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

        // Draw shield if active
        if (this.upgrades.shield > 0) {
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw laser if active
        if (this.laserActive) {
            const laserLength = 2000; // Long enough to reach edge of screen
            ctx.strokeStyle = this.laserColor;
            ctx.lineWidth = this.laserWidth;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + this.direction.x * laserLength,
                this.y + this.direction.y * laserLength
            );
            ctx.stroke();
            
            // Laser glow effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = this.laserWidth / 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + this.direction.x * laserLength,
                this.y + this.direction.y * laserLength
            );
            ctx.stroke();
        }

        ctx.restore();
    }
    
    update(keys, mousePos, canvasWidth, canvasHeight, currentTime) {
        // Update direction based on mouse position
        if (mousePos) {
            const dx = mousePos.x - this.x;
            const dy = mousePos.y - this.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                this.direction = {
                    x: dx / length,
                    y: dy / length
                };
            }
        }
        
        // Movement
        let moveX = 0;
        let moveY = 0;
        
        if (keys.w || keys.ArrowUp) moveY -= 1;
        if (keys.s || keys.ArrowDown) moveY += 1;
        if (keys.a || keys.ArrowLeft) moveX -= 1;
        if (keys.d || keys.ArrowRight) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // Apply speed
        const actualSpeed = this.speed * (1 + this.upgrades.speed * 0.1);
        this.x += moveX * actualSpeed;
        this.y += moveY * actualSpeed;
        
        // Keep player within bounds
        this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
        
        // Update laser status
        if (this.laserActive && currentTime - this.laserLastUsed > this.laserDuration) {
            this.laserActive = false;
        }
    }
    
    shoot(currentTime, bullets) {
        const actualFireRate = this.fireRate * (1 - this.upgrades.fireRate * 0.05);
        
        if (currentTime - this.lastShot > actualFireRate) {
            const actualDamage = this.damage * (1 + this.upgrades.damage * 0.1);
            
            // Create bullet
            if (this.upgrades.multiFire > 0) {
                // Multi-fire upgrade: shoot multiple bullets in a spread
                const spreadCount = 1 + this.upgrades.multiFire;
                const spreadAngle = Math.PI / 8; // 22.5 degrees
                
                for (let i = 0; i < spreadCount; i++) {
                    const angle = (i - (spreadCount - 1) / 2) * spreadAngle;
                    const rotatedDirection = {
                        x: this.direction.x * Math.cos(angle) - this.direction.y * Math.sin(angle),
                        y: this.direction.x * Math.sin(angle) + this.direction.y * Math.cos(angle)
                    };
                    
                    bullets.push(new Bullet(
                        this.x,
                        this.y,
                        rotatedDirection,
                        actualDamage,
                        this.upgrades.ricochet,
                        false
                    ));
                }
            } else {
                // Standard single bullet
                bullets.push(new Bullet(
                    this.x,
                    this.y,
                    this.direction,
                    actualDamage,
                    this.upgrades.ricochet,
                    false
                ));
            }
            
            this.lastShot = currentTime;
            return true;
        }
        
        return false;
    }
    
    activateLaser(currentTime) {
        const elapsed = currentTime - this.lastLaserActivation;
        if (this.laserCharges > 0 && (elapsed >= this.laserCooldown || this.lastLaserActivation < 0)) {
            this.laserActive = true;
            this.laserLastUsed = currentTime;
            this.lastLaserActivation = currentTime;
            this.laserCharges--;
            return true;
        }
        return false;
    }

    isLaserAvailable(currentTime) {
        const elapsed = currentTime - this.lastLaserActivation;
        return this.laserCharges > 0 && (elapsed >= this.laserCooldown || this.lastLaserActivation < 0);
    }
    
    takeDamage(amount) {
        if (this.godMode) return false; // Skip damage in god mode
        
        // Apply shield damage reduction if available
        if (this.upgrades.shield > 0) {
            amount *= (1 - this.upgrades.shield * 0.1);
        }
        
        this.health -= amount;
        if (this.health < 0) this.health = 0;

        this.lastDamageTime = performance.now();
        
        return this.health <= 0;
    }
    
    getLaserCooldownPercent(currentTime) {
        const elapsed = currentTime - this.lastLaserActivation;
        
        // If laser was just fired or still in cooldown
        if (this.lastLaserActivation > 0 && elapsed < this.laserCooldown) {
            return elapsed / this.laserCooldown;
        }
        
        return 1;
    }
    
    applyUpgrade(type) {
        if (this.upgrades[type] < 10) {
            this.upgrades[type]++;
            
            // Apply immediate effects
            if (type === 'health') {
                this.maxHealth += 10;
                this.health = this.maxHealth;
            }
            
            return true;
        }
        return false;
    }
}
