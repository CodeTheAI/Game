const DESIGNS = {
    normalMob: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="enemyGlow"><feGaussianBlur stdDeviation="2" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="%23ff3333" filter="url(%23enemyGlow)"/>
        <path d="M30 40 L45 55 L30 70" stroke="%23fff" stroke-width="5" fill="none"/>
        <path d="M70 40 L55 55 L70 70" stroke="%23fff" stroke-width="5" fill="none"/>
        <path d="M40 75 Q50 65 60 75" stroke="%23fff" stroke-width="3" fill="none"/>
    </svg>`,
    
    speedsterMob: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="speedGlow"><feGaussianBlur stdDeviation="1.5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <polygon points="50,10 90,90 10,90" fill="%2300aaff" filter="url(%23speedGlow)"/>
        <circle cx="50" cy="50" r="15" fill="%23fff"/>
        <path d="M30 70 L70 70" stroke="%23fff" stroke-width="3" fill="none"/>
        <path d="M40 60 L60 60" stroke="%23fff" stroke-width="2" fill="none"/>
    </svg>`,
    
    tankMob: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="tankGlow"><feGaussianBlur stdDeviation="3" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="%237700ff" filter="url(%23tankGlow)"/>
        <circle cx="50" cy="50" r="25" fill="none" stroke="%23fff" stroke-width="5"/>
        <rect x="35" y="35" width="30" height="30" fill="%23fff"/>
        <path d="M30 80 L70 80" stroke="%23fff" stroke-width="4" fill="none"/>
    </svg>`,

    boss1: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="demonGlow">
                <feGaussianBlur stdDeviation="4" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <radialGradient id="demonGrad">
                <stop offset="0%" stop-color="%23ff0000"/>
                <stop offset="100%" stop-color="%23990000"/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(%23demonGrad)" filter="url(%23demonGlow)"/>
        <path d="M20 40 Q50 0 80 40" stroke="%23fff" stroke-width="5" fill="none"/>
        <path d="M30 70 Q50 90 70 70" stroke="%23fff" stroke-width="5" fill="none"/>
        <circle cx="35" cy="45" r="10" fill="%23ff0000" stroke="%23fff" stroke-width="2"/>
        <circle cx="65" cy="45" r="10" fill="%23ff0000" stroke="%23fff" stroke-width="2"/>
        <circle cx="35" cy="45" r="5" fill="%23000"/>
        <circle cx="65" cy="45" r="5" fill="%23000"/>
    </svg>`,

    boss2: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="infernalGlow">
                <feGaussianBlur stdDeviation="3" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="%23ff6600"/>
                <stop offset="100%" stop-color="%23ff0000"/>
            </linearGradient>
        </defs>
        <polygon points="50,10 90,50 50,90 10,50" fill="url(%23fireGrad)" filter="url(%23infernalGlow)"/>
        <circle cx="50" cy="50" r="25" fill="none" stroke="%23fff" stroke-width="5"/>
        <path d="M35 45 L45 55 L35 65" stroke="%23fff" stroke-width="5" fill="none"/>
        <path d="M65 45 L55 55 L65 65" stroke="%23fff" stroke-width="5" fill="none"/>
        <circle cx="50" cy="50" r="10" fill="%23ff0000"/>
    </svg>`,

    boss3: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="voidGlow">
                <feGaussianBlur stdDeviation="6" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <radialGradient id="voidGrad">
                <stop offset="0%" stop-color="%23ffffff"/>
                <stop offset="100%" stop-color="%23000000"/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(%23voidGrad)" filter="url(%23voidGlow)"/>
        <circle cx="35" cy="45" r="15" fill="%23000" stroke="%23fff" stroke-width="2"/>
        <circle cx="65" cy="45" r="15" fill="%23000" stroke="%23fff" stroke-width="2"/>
        <circle cx="35" cy="45" r="7" fill="%23ff0000"/>
        <circle cx="65" cy="45" r="7" fill="%23ff0000"/>
        <path d="M25,65 Q50,90 75,65" fill="none" stroke="%23fff" stroke-width="5"/>
    </svg>`,

    boss4: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="chaosGlow">
                <feGaussianBlur stdDeviation="5" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <linearGradient id="chaosGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="%23ffcc00"/>
                <stop offset="100%" stop-color="%23ff6600"/>
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(%23chaosGrad)" filter="url(%23chaosGlow)"/>
        <path d="M20,40 C35,20 65,20 80,40" fill="none" stroke="%23fff" stroke-width="5"/>
        <circle cx="35" cy="45" r="12" fill="%23fff"/>
        <circle cx="65" cy="45" r="12" fill="%23fff"/>
        <circle cx="35" cy="45" r="6" fill="%23ff0000"/>
        <circle cx="65" cy="45" r="6" fill="%23ff0000"/>
        <path d="M30,70 Q50,90 70,70" fill="none" stroke="%23fff" stroke-width="5"/>
    </svg>`,

    boss5: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ultimateGlow">
                <feGaussianBlur stdDeviation="8" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <radialGradient id="ultimateGrad">
                <stop offset="0%" stop-color="%23ffffff"/>
                <stop offset="50%" stop-color="%23444444"/>
                <stop offset="100%" stop-color="%23000000"/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(%23ultimateGrad)" filter="url(%23ultimateGlow)"/>
        <path d="M20,35 Q50,10 80,35" fill="none" stroke="%23fff" stroke-width="5"/>
        <circle cx="35" cy="45" r="15" fill="%23000" stroke="%23fff" stroke-width="2"/>
        <circle cx="65" cy="45" r="15" fill="%23000" stroke="%23fff" stroke-width="2"/>
        <circle cx="35" cy="45" r="7" fill="%23ff0000"/>
        <circle cx="65" cy="45" r="7" fill="%23ff0000"/>
        <path d="M25,65 Q50,100 75,65" fill="none" stroke="%23fff" stroke-width="5"/>
        <path d="M15,30 L85,30" stroke="%23fff" stroke-width="3" stroke-dasharray="5,5"/>
    </svg>`
};