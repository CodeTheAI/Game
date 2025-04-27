class UI {
    constructor(game) {
        this.game = game;
        this.upgradeManager = new UpgradeManager();
        this.currentScreen = 'landing';
        this.gameStats = new GameStats();
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Landing screen buttons
        document.getElementById('start-game').addEventListener('click', () => {
            this.showScreen('game');
            this.game.start();
        });
        
        document.getElementById('stats-button').addEventListener('click', () => {
            this.showScreen('stats');
            this.gameStats.displayStats();
        });
        
        // Game screen buttons
        document.getElementById('pause-button').addEventListener('click', () => {
            this.game.togglePause();
        });

        document.getElementById('resume-button').addEventListener('click', () => {
            this.game.resume();
        });

        document.getElementById('quit-button-pause').addEventListener('click', () => {
            this.showScreen('landing');
        });

        document.getElementById('retry-button-pause').addEventListener('click', () => {
            this.showScreen('game');
            this.game.restart();
        });

        // Upgrade screen buttons
        // Removed continue button functionality
        
        // Game over screen buttons
        document.getElementById('retry-button').addEventListener('click', () => {
            this.showScreen('game');
            this.game.restart();
        });
        
        document.getElementById('quit-button').addEventListener('click', () => {
            this.showScreen('landing');
        });
        
        // Stats screen buttons
        document.getElementById('back-button').addEventListener('click', () => {
            this.showScreen('landing');
        });

        // Reset stats button with confirmation
        document.getElementById('reset-stats').addEventListener('click', () => {
            const stats = this.gameStats.stats;
            const confirmMessage = `Are you sure you want to reset all game statistics?\n\nThis will clear:\n` +
                `- Highest Score: ${stats.highScore}\n` +
                `- Games Played: ${stats.gamesPlayed}\n` +
                `- Farthest Wave: ${stats.farthestWave}\n` +
                `- Total Waves Completed: ${stats.totalWavesCompleted}\n` +
                `- Longest Survival: ${Math.floor(stats.longestSurvival / 60)}m ${Math.floor(stats.longestSurvival % 60)}s\n` +
                `- Total Play Time: ${Math.floor(stats.totalPlayTime / 3600)}h ${Math.floor((stats.totalPlayTime % 3600) / 60)}m\n` +
                `- Number of Victories: ${stats.victories}\n\n` +
                `This action cannot be undone.`;

            if (confirm(confirmMessage)) {
                this.gameStats.resetStats();
                this.gameStats.displayStats();
            }
        });
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.getElementById('landing-screen').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('upgrade-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('stats-screen').classList.add('hidden');
        document.getElementById('wave-cleared-screen').classList.add('hidden');
        
        // Show requested screen
        const screenElement = document.getElementById(`${screenName}-screen`);
        screenElement.classList.remove('hidden');
        screenElement.style.display = screenName === 'game' ? 'block' : 'flex';
        this.currentScreen = screenName;

        // Special handling for game screen
        if (screenName === 'game') {
            document.getElementById('pause-overlay').classList.add('hidden');
            const pauseButton = document.getElementById('pause-button').querySelector('i');
            if (pauseButton) {
                pauseButton.className = 'fas fa-pause';
            }
            document.getElementById('game-screen').style.display = 'block';
        }
    }
    
    updateHUD(score, wave, enemiesRemaining, health, maxHealth, boss = null) {
        // Store previous values for comparison
        const previousScore = document.getElementById('score').textContent;
        const previousWave = document.getElementById('wave').textContent;
        const previousEnemies = document.getElementById('enemies-remaining').textContent;
        const previousHealth = document.getElementById('health').textContent;

        // Update values
        document.getElementById('score').textContent = score;
        document.getElementById('wave').textContent = wave;
        document.getElementById('enemies-remaining').textContent = boss ? 'ERROR' : enemiesRemaining;
        document.getElementById('health').textContent = `${health}/${maxHealth}`;

        // Add pulse effect to changed values
        if (score !== parseInt(previousScore)) {
            document.getElementById('score').parentElement.classList.add('updated');
            setTimeout(() => document.getElementById('score').parentElement.classList.remove('updated'), 500);
        }
        if (wave !== parseInt(previousWave)) {
            document.getElementById('wave').parentElement.classList.add('updated');
            setTimeout(() => document.getElementById('wave').parentElement.classList.remove('updated'), 500);
        }
        if (enemiesRemaining !== parseInt(previousEnemies)) {
            document.getElementById('enemies-remaining').parentElement.classList.add('updated');
            setTimeout(() => document.getElementById('enemies-remaining').parentElement.classList.remove('updated'), 500);
        }

        // Handle health effects
        const healthElement = document.getElementById('health');
        if (health < 20) {
            healthElement.classList.add('critical');
        } else {
            healthElement.classList.remove('critical');
        }
        
        if (health < parseInt(previousHealth.split('/')[0])) {
            healthElement.classList.add('damaged');
            setTimeout(() => healthElement.classList.remove('damaged'), 300);
        }

        // Update boss health bar if exists
        const bossBar = document.getElementById('boss-health');
        if (boss && !this.game.isGameOver) {
            bossBar.classList.remove('hidden');
            
            if (boss.currentPhase) {
                const phaseHealth = boss.currentPhase.getHealthPercentage() * 100;
                bossBar.querySelector('.health-fill').style.width = `${phaseHealth}%`;
                
                const phaseText = `Phase ${boss.currentPhase.phaseNumber} / ${boss.phases.length}`;
                const phaseElement = bossBar.querySelector('.boss-phase');
                if (phaseElement.textContent !== phaseText) {
                    phaseElement.textContent = phaseText;
                    phaseElement.classList.add('phase-transition');
                    setTimeout(() => phaseElement.classList.remove('phase-transition'), 1500);
                }
            }
        } else {
            bossBar.classList.add('hidden');
        }
    }
    
    updateTimer(timeRemaining, isBossMode) {
        const timerContainer = document.getElementById('timer-container');
        const timer = document.getElementById('timer');
        const waveTimer = document.getElementById('wave-timer');
        
        if (isBossMode) {
            // Hide wave timer but keep boss fight indicator
            if (waveTimer) waveTimer.classList.add('hidden');
            if (timer) {
                timer.classList.remove('hidden');
                timer.textContent = '∞';
                timer.classList.add('boss-timer');
            }
        } else {
            // Show wave timer for normal waves
            if (waveTimer) waveTimer.classList.remove('hidden');
            if (timer) timer.classList.add('hidden');
            
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = Math.floor(timeRemaining % 60);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (waveTimer) {
                waveTimer.textContent = timeStr;
                
                // Add warning classes based on time remaining
                if (timeRemaining <= 30) {
                    waveTimer.classList.add('timer-warning');
                    if (timeRemaining <= 10) {
                        waveTimer.classList.add('timer-critical');
                    }
                } else {
                    waveTimer.classList.remove('timer-warning', 'timer-critical');
                }
            }
        }
    }
    
    togglePauseOverlay(isPaused) {
        const pauseOverlay = document.getElementById('pause-overlay');
        const pauseButton = document.getElementById('pause-button').querySelector('i');
        
        if (isPaused) {
            pauseOverlay.classList.remove('hidden');
            pauseButton.className = 'fas fa-play';
        } else {
            pauseOverlay.classList.add('hidden');
            pauseButton.className = 'fas fa-pause';
        }
    }
    
    showUpgradeOptions(player) {
        const upgradeOptions = this.upgradeManager.getRandomUpgrades(player);
        const container = document.getElementById('upgrade-options');
        container.innerHTML = '';
        
        upgradeOptions.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-title">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.description}</div>
                <div class="upgrade-level">Level: ${player.upgrades[upgrade.id] || 0}/${upgrade.maxLevel}</div>
            `;
            
            card.addEventListener('click', () => {
                this.upgradeManager.applyUpgrade(player, upgrade.id);
                this.showScreen('game');
                this.game.resumeAfterUpgrade();
            });
            
            container.appendChild(card);
        });
        
        this.showScreen('upgrade');
    }
    
    updateLaserCooldown(percent) {
        const cooldownIndicator = document.getElementById('cooldown-indicator');
        const cooldownBar = cooldownIndicator.querySelector('.cooldown-bar');
        const cooldownText = cooldownIndicator.querySelector('.cooldown-text');
        
        if (percent < 1) {
            // Show recharging state with smooth animation
            cooldownIndicator.classList.remove('hidden');
            cooldownBar.style.transition = 'width 0.1s linear';
            cooldownBar.style.width = `${percent * 100}%`;
            cooldownText.textContent = 'LASER RECHARGING';
        } else if (this.game.player.laserCharges > 0) {
            // Show available charges
            cooldownIndicator.classList.remove('hidden');
            const chargeIcons = '🔷'.repeat(this.game.player.laserCharges) + '⬜'.repeat(this.game.player.maxLaserCharges - this.game.player.laserCharges);
            cooldownText.textContent = `LASER CHARGES: ${chargeIcons}`;
            cooldownBar.style.width = '100%';
        } else {
            cooldownIndicator.classList.add('hidden');
        }
    }
    
    showGameOver(score, wave, survivalTime, longestSurvival, farthestWave) {
        // Hide all other screens and UI elements
        document.getElementById('landing-screen').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('upgrade-screen').classList.add('hidden');
        document.getElementById('stats-screen').classList.add('hidden');
        document.getElementById('boss-health').classList.add('hidden'); // Hide boss healthbar

        // Show and update game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.style.display = 'flex';

        // Update stats with proper formatting
        document.getElementById('final-score').innerHTML = `<strong>Final Score:</strong> ${score}`;
        document.getElementById('final-wave').innerHTML = `<strong>Final Wave:</strong> ${wave}`;
        document.getElementById('survival-time').innerHTML = `<strong>Survival Time:</strong> ${this.formatTime(survivalTime)}`;
        document.getElementById('longest-survival').innerHTML = `<strong>Best Time:</strong> ${this.formatTime(longestSurvival)}`;
        document.getElementById('farthest-wave').innerHTML = `<strong>Highest Wave:</strong> ${farthestWave}`;
    }
    
    showWaveCleared(wave, score) {
        document.getElementById('cleared-wave').textContent = wave - 1;
        document.getElementById('wave-score').textContent = score;
        this.showScreen('wave-cleared');
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
