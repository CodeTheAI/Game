class UpgradeManager {
    constructor() {
        this.upgrades = [
            {
                id: 'health',
                name: 'Health Boost',
                description: 'Increases max health by 10',
                maxLevel: 10,
                effect: (player) => {
                    player.maxHealth += 10;
                    player.health = player.maxHealth;
                }
            },
            {
                id: 'speed',
                name: 'Speed Boost',
                description: 'Increases movement speed by 10%',
                maxLevel: 10,
                effect: (player) => {
                    player.speed *= 1.1;
                }
            },
            {
                id: 'damage',
                name: 'Damage Boost',
                description: 'Increases bullet damage by 10%',
                maxLevel: 10,
                effect: (player) => {
                    player.damage *= 1.1;
                }
            },
            {
                id: 'fireRate',
                name: 'Rapid Fire',
                description: 'Decreases time between shots by 5%',
                maxLevel: 10,
                effect: (player) => {
                    player.fireRate *= 0.95;
                }
            },
            {
                id: 'ricochet',
                name: 'Ricochet',
                description: 'Bullets bounce off walls',
                maxLevel: 5,
                effect: (player) => {
                    player.upgrades.ricochet++;
                }
            },
            {
                id: 'multiFire',
                name: 'Multi-Fire',
                description: 'Shoot multiple bullets at once',
                maxLevel: 3,
                effect: (player) => {
                    player.upgrades.multiFire++;
                }
            },
            {
                id: 'autoFire',
                name: 'Auto-Fire',
                description: 'Automatically fire when enemies are in range',
                maxLevel: 1,
                effect: (player) => {
                    player.upgrades.autoFire = 1;
                }
            },
            {
                id: 'shield',
                name: 'Defense Shield',
                description: 'Reduces incoming damage by 10%',
                maxLevel: 5,
                effect: (player) => {
                    player.upgrades.shield++;
                }
            }
        ];
    }
    
    getRandomUpgrades(player, count = 3) {
        // Filter out maxed upgrades
        const availableUpgrades = this.upgrades.filter(upgrade => {
            if (upgrade.id === 'ricochet') {
                return player.upgrades.ricochet < upgrade.maxLevel;
            } else if (upgrade.id === 'multiFire') {
                return player.upgrades.multiFire < upgrade.maxLevel;
            } else if (upgrade.id === 'autoFire') {
                return player.upgrades.autoFire < upgrade.maxLevel;
            } else if (upgrade.id === 'shield') {
                return player.upgrades.shield < upgrade.maxLevel;
            } else {
                return player.upgrades[upgrade.id] < upgrade.maxLevel;
            }
        });
        
        // Shuffle and pick random upgrades
        const shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    applyUpgrade(player, upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (upgrade) {
            upgrade.effect(player);
            player.upgrades[upgradeId]++;
            return true;
        }
        return false;
    }
}
