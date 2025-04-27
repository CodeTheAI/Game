class GameStats {
    constructor() {
        this.loadStats();
    }
    
    loadStats() {
        const savedStats = localStorage.getItem('mobShooterStats');
        
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        } else {
            // Initialize default stats
            this.stats = {
                gamesPlayed: 0,
                totalScore: 0,
                highScore: 0,
                totalEnemiesKilled: 0,
                totalWavesCompleted: 0,
                farthestWave: 0,
                totalPlayTime: 0,
                longestSurvival: 0,
                victories: 0
            };
        }
    }
    
    saveStats() {
        localStorage.setItem('mobShooterStats', JSON.stringify(this.stats));
    }
    
    updateStats(gameData) {
        // Update stats with current game data
        this.stats.gamesPlayed++;
        this.stats.totalScore += gameData.score;
        this.stats.highScore = Math.max(this.stats.highScore, gameData.score);
        this.stats.totalWavesCompleted += gameData.wave - 1;
        this.stats.farthestWave = Math.max(this.stats.farthestWave, gameData.wave);
        this.stats.totalPlayTime += gameData.survivalTime;
        this.stats.longestSurvival = Math.max(this.stats.longestSurvival, gameData.survivalTime);
        
        if (gameData.victory) {
            this.stats.victories++;
        }
        
        // Save updated stats
        this.saveStats();
    }
    
    getHighScore() {
        return this.stats.highScore;
    }
    
    getFarthestWave() {
        return this.stats.farthestWave;
    }
    
    getLongestSurvival() {
        return this.stats.longestSurvival;
    }
    
    resetStats() {
        this.stats = {
            gamesPlayed: 0,
            totalScore: 0,
            highScore: 0,
            totalEnemiesKilled: 0,
            totalWavesCompleted: 0,
            farthestWave: 0,
            totalPlayTime: 0,
            longestSurvival: 0,
            victories: 0
        };
        
        this.saveStats();
    }
    
    displayStats() {
        // Update stats screen with current stats
        document.getElementById('stats-games-played').textContent = this.stats.gamesPlayed;
        document.getElementById('stats-high-score').textContent = this.stats.highScore;
        document.getElementById('stats-waves-completed').textContent = this.stats.totalWavesCompleted;
        document.getElementById('stats-farthest-wave').textContent = this.stats.farthestWave;
        
        // Format play time
        const totalHours = Math.floor(this.stats.totalPlayTime / 3600);
        const totalMinutes = Math.floor((this.stats.totalPlayTime % 3600) / 60);
        const totalSeconds = Math.floor(this.stats.totalPlayTime % 60);
        document.getElementById('stats-total-time').textContent = 
            `${totalHours}h ${totalMinutes}m ${totalSeconds}s`;
        
        // Format longest survival
        const longestMinutes = Math.floor(this.stats.longestSurvival / 60);
        const longestSeconds = Math.floor(this.stats.longestSurvival % 60);
        document.getElementById('stats-longest-survival').textContent = 
            `${longestMinutes}m ${longestSeconds}s`;
        
        document.getElementById('stats-victories').textContent = this.stats.victories;
    }
}
