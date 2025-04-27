class Bullet {
    constructor(x, y, direction, damage, ricochets, isEnemy = false, speed = 8) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
        this.size = isEnemy ? 4 : 3;
        this.damage = damage;
        this.ricochets = ricochets;
        this.isEnemy = isEnemy;
        this.color = isEnemy ? '#ff5555' : '#ffffff';
        this.trail = [];
        this.maxTrailLength = 5;
    }
    
    draw(ctx) {
        // Draw bullet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw trail
        if (this.trail.length > 0) {
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const alpha = 0.7 * (1 - i / this.trail.length);
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * (1 - i / this.trail.length), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    update(canvasWidth, canvasHeight) {
        // Add current position to trail
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        
        // Move bullet
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
        
        // Check for wall collisions and handle ricochets
        let bounced = false;
        
        if (this.x - this.size <= 0) {
            this.x = this.size;
            this.direction.x *= -1;
            bounced = true;
        } else if (this.x + this.size >= canvasWidth) {
            this.x = canvasWidth - this.size;
            this.direction.x *= -1;
            bounced = true;
        }
        
        if (this.y - this.size <= 0) {
            this.y = this.size;
            this.direction.y *= -1;
            bounced = true;
        } else if (this.y + this.size >= canvasHeight) {
            this.y = canvasHeight - this.size;
            this.direction.y *= -1;
            bounced = true;
        }
        
        // Reduce ricochet count if bounced
        if (bounced && this.ricochets > 0) {
            this.ricochets--;
        }
        
        // Return true if bullet should be removed
        return (
            (bounced && this.ricochets <= 0) ||
            this.x < -this.size ||
            this.x > canvasWidth + this.size ||
            this.y < -this.size ||
            this.y > canvasHeight + this.size
        );
    }
    
    checkCollision(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.size + entity.size;
    }
}
