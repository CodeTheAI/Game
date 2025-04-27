// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Initialize stats
    const gameStats = new GameStats();
    
    // Add reset stats button functionality with enhanced confirmation
    document.getElementById('reset-stats').addEventListener('click', () => {
        const stats = gameStats.stats;
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
            gameStats.resetStats();
            gameStats.displayStats();
        }
    });
});
