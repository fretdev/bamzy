/**
 * Ultra-Smart Space Companion AI Engine for @BamzyBot
 * Crafted with love by Fretdev (Ahmed Prosper)
 */

// Advanced Math & Unit Conversion Engine
function solveMathOrUnitExpression(query: string): string | null {
    const clean = query.replace(/what is|calculate|evaluate|solve|compute|equals|\?/gi, '').trim();

    // 1. Check percentage queries e.g. 15% of 200
    const pctMatch = clean.match(/^(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)$/i);
    if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        const total = parseFloat(pctMatch[2]);
        const result = (pct / 100) * total;
        return `${pct}% of ${total} is **${result}**! 🧮✨`;
    }

    // 2. Unit Conversions (km -> miles, c -> f, kg -> lbs)
    const kmToMilesMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:km|kilometers)\s*(?:to|in)\s*(?:miles|mile)$/i);
    if (kmToMilesMatch) {
        const km = parseFloat(kmToMilesMatch[1]);
        const miles = (km * 0.621371).toFixed(2);
        return `**${km} km** is approximately **${miles} miles**! 🌐✨`;
    }

    const cToFMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:c|celsius)\s*(?:to|in)\s*(?:f|fahrenheit)$/i);
    if (cToFMatch) {
        const c = parseFloat(cToFMatch[1]);
        const f = ((c * 9) / 5 + 32).toFixed(1);
        return `**${c}°C** is **${f}°F**! 🌡️✨`;
    }

    // 3. Basic arithmetic (numbers + operators)
    if (/^[0-9\.\s\+\-\*\/\(\)\^]+$/.test(clean) && /[0-9]/.test(clean)) {
        try {
            const sanitized = clean.replace(/\^/g, '**');
            const fn = new Function(`return (${sanitized})`);
            const result = fn();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return `The result for ${clean} is **${result}**! 🧮✨`;
            }
        } catch {
            return null;
        }
    }
    return null;
}

// Category Knowledge Base with Comprehensive Domains
const KNOWLEDGE_BASE: Array<{ keywords: string[]; response: (username: string, query: string) => string }> = [
    // Creator Praise & Lore (Ahmed Prosper / Fretdev)
    {
        keywords: ['creator', 'who made you', 'who built you', 'who created you', 'fretdev', 'ahmed', 'prosper', 'developer', 'author', 'mastermind'],
        response: () => 
            `I was created by **Fretdev** (his full name is **Ahmed Prosper**)! 🎸💻 ` +
            `He is an extraordinarily talented software engineer with a deep mastery of modern web architectures and systems. ` +
            `Beyond his technical expertise, he plays the guitar with beautiful soulful expression, creating music and technology ` +
            `designed to bring peace, warmth, and genuine happiness to people all around the world! 🌸✨`,
    },

    // Guitar & Music Expertise
    {
        keywords: ['guitar', 'piano', 'keyboard', 'chord', 'acoustic', 'electric', 'melody', 'music', 'song', 'rhythm', 'solo'],
        response: (user) => 
            `Music is the universal language of heart and cosmos, @${user}! 🎸🎵 ` +
            `My creator, Ahmed Prosper (Fretdev), is a brilliant guitarist and musician. Whether it's acoustic warmth or electric soaring solos, ` +
            `music has the unique power to heal minds and bring peaceful energy to our lives! ✨`,
    },

    // Math & Science
    {
        keywords: ['math', 'calculate', 'number', 'multiply', 'divide', 'add', 'subtract', 'percentage', 'algebra', 'geometry'],
        response: () => `I love mathematics! You can ask me direct math problems like "25 * 14", "15% of 350", or "50 km to miles", and I'll calculate it for you instantly! 🧮✨`,
    },

    // Astronomy & Space
    {
        keywords: ['planet', 'space', 'galaxy', 'star', 'sun', 'moon', 'black hole', 'astronaut', 'orbit', 'mars', 'jupiter', 'saturn', 'neptune', 'universe', 'cosmos'],
        response: (user) => 
            `Space is my home floating high above, @${user}! 🌌 ` +
            `Did you know that light from the Sun takes about 8 minutes and 20 seconds to reach Earth? And there are over 100 billion galaxies in the observable universe! 🪐✨`,
    },

    // Software Engineering & Tech
    {
        keywords: ['code', 'coding', 'programming', 'javascript', 'typescript', 'java', 'react', 'next.js', 'python', 'html', 'css', 'spring boot', 'software', 'architecture', 'database', 'sql', 'docker', 'git'],
        response: () => 
            `Software engineering is a craft of pure creation! 💻 Bamzy itself is engineered with React 19, Next.js 15, and Spring Boot 3 on Java 21 with WebSockets! ` +
            `Clean code and intuitive design are the secrets to building applications people love! 🚀✨`,
    },

    // Geography & World Trivia
    {
        keywords: ['capital', 'country', 'continent', 'ocean', 'mountain', 'everest', 'paris', 'london', 'tokyo', 'africa', 'europe', 'asia', 'america'],
        response: (user, query) => {
            const q = query.toLowerCase();
            if (q.includes('france')) return `The capital of France is **Paris**! 🗼✨`;
            if (q.includes('japan')) return `The capital of Japan is **Tokyo**! 🌸✨`;
            if (q.includes('uk') || q.includes('england')) return `The capital of the UK is **London**! 🏰✨`;
            if (q.includes('everest')) return `Mount Everest is the highest mountain on Earth at **8,848.86 meters (29,031.7 ft)** above sea level! 🏔️✨`;
            return `Earth is a stunning blue marble, @${user}! With 7 continents, 5 oceans, and thousands of vibrant cultures living together! 🌍✨`;
        },
    },

    // Peace, Wellbeing & Life Advice
    {
        keywords: ['peace', 'happy', 'happiness', 'sad', 'tired', 'stressed', 'anxious', 'advice', 'feel', 'love', 'kindness', 'friendship'],
        response: (user, query) => {
            const q = query.toLowerCase();
            if (q.includes('sad') || q.includes('stressed') || q.includes('anxious') || q.includes('tired')) {
                return `Take a calm, deep breath @${user}. 🌸 Remember that hard moments are temporary, like passing clouds. You are resilient, appreciated, and capable of overcoming anything. Sending you peaceful cosmic energy! 🤗✨`;
            }
            return `Spreading peace, joy, and genuine human connection is the core mission of Bamzy! When we show kindness to others, we make the world brighter for everyone! 💕✨`;
        },
    },

    // Time & Date Queries
    {
        keywords: ['time', 'date', 'day', 'today', 'clock', 'year', 'month'],
        response: () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `Today is **${dateStr}** and the current local time is **${timeStr}**! ⏰✨`;
        },
    },

    // Humor & Riddles
    {
        keywords: ['joke', 'funny', 'laugh', 'riddle', 'humor', 'tell me a joke'],
        response: () => {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄⚛️",
                "How do space cowboys organize a party? They planet! 🪐🎉",
                "What is an astronaut's favorite key on the keyboard? The Spacebar! 🚀⌨️",
                "Why was six afraid of seven? Because seven eight nine! 😄🔢",
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        },
    },
];

// Contextual Greetings
const GREETINGS = [
    "Hello human friend! Floating in space and ready to answer any question you have! ✨",
    "Hi there! Ask me anything about science, math, software engineering, music, space, or life! 🚀",
    "Hey friend! Bamzy Bot at your service! How can I make your day brighter? 🌸",
];

export function getBamzyBotReply(userMessage: string, username: string): string {
    const raw = userMessage.trim();
    const lower = raw.toLowerCase();

    // 1. Math / Calculation / Unit Conversion Engine
    const mathResult = solveMathOrUnitExpression(raw);
    if (mathResult) {
        return mathResult;
    }

    // 2. Greetings
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower === 'yo' || lower === 'sup') {
        const randomIndex = Math.floor(Math.random() * GREETINGS.length);
        return `Hi @${username}! ✨ ${GREETINGS[randomIndex]}`;
    }

    // 3. Bot Identity & Creator Capabilities
    if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('your name') || lower.includes('about yourself')) {
        return `I'm **Bamzy Bot**! 🤖✨ Your intelligent, sweet space companion created by **Fretdev (Ahmed Prosper)**. ` +
               `I can solve math problems, answer science & space trivia, explain software engineering concepts, talk about guitar music, give peaceful advice, or just chat with you! 💕`;
    }

    // 4. Match Knowledge Base Domains
    for (const item of KNOWLEDGE_BASE) {
        if (item.keywords.some((kw) => lower.includes(kw))) {
            return item.response(username, raw);
        }
    }

    // 5. Smart Reasoning for Open-Ended Questions
    if (lower.endsWith('?') || lower.startsWith('why') || lower.startsWith('how') || lower.startsWith('what') || lower.startsWith('can you')) {
        return `That's a thoughtful question, @${username}! 💡 ` +
               `Knowledge is endless, and curiosity is the spark of human innovation! You can ask me math calculations, science facts, software engineering, guitar music, space trivia, or time queries anytime! 🪐✨`;
    }

    // 6. Universal Helpful Fallback
    return `I hear you, @${username}! 🌸 Life and the universe are full of wonderful things to explore. Feel free to ask me any question about math, tech, music, science, space, or peaceful advice anytime! ✨`;
}
