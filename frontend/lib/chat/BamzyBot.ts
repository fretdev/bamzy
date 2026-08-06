/**
 * Intelligent Space Companion AI Engine for @BamzyBot
 * Answers general knowledge, math, science, tech, space, advice, riddles & trivia!
 */

// Math solver helper for queries like "what is 15 + 25" or "calc 10 * 5"
function solveMathExpression(query: string): string | null {
    const clean = query.replace(/what is|calculate|evaluate|solve|compute|equals|\?/gi, '').trim();

    // Check percentage queries e.g. 15% of 200
    const pctMatch = clean.match(/^(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)$/i);
    if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        const total = parseFloat(pctMatch[2]);
        const result = (pct / 100) * total;
        return `${pct}% of ${total} is **${result}**! 🧮✨`;
    }

    // Check basic arithmetic (numbers + operators)
    if (/^[0-9\.\s\+\-\*\/\(\)\^]+$/.test(clean) && /[0-9]/.test(clean)) {
        try {
            // Safe evaluation of mathematical expression
            const sanitized = clean.replace(/\^/g, '**');
            const fn = new Function(`return (${sanitized})`);
            const result = fn();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return `The answer to ${clean} is **${result}**! 🧮✨`;
            }
        } catch {
            return null;
        }
    }
    return null;
}

// Category Knowledge Base
const KNOWLEDGE_BASE: Array<{ keywords: string[]; response: (username: string) => string }> = [
    // Math & Numbers
    {
        keywords: ['math', 'calculate', 'number', 'multiply', 'divide', 'add', 'subtract', 'percentage'],
        response: () => `I love numbers! You can ask me math questions directly like "what is 25 * 4?" or "15% of 80" and I'll solve it for you! 🧮✨`,
    },

    // Space & Cosmos
    {
        keywords: ['planet', 'space', 'galaxy', 'star', 'sun', 'moon', 'black hole', 'astronaut', 'orbit', 'mars', 'jupiter', 'saturn'],
        response: (user) => `Space is my favorite home, @${user}! 🌌 Did you know? There are more stars in the universe than grains of sand on all the beaches on Earth! Millions and billions of glowing suns out here! 🪐✨`,
    },

    // Coding & Tech
    {
        keywords: ['code', 'coding', 'programming', 'javascript', 'java', 'react', 'next.js', 'python', 'html', 'css', 'spring boot', 'developer'],
        response: () => `Coding is magic! 💻 Bamzy itself is built with React 19, Next.js, and Spring Boot 3 on Java 21! What programming language or tech stack are you working with? 🚀✨`,
    },

    // Music & Arts
    {
        keywords: ['music', 'piano', 'keyboard', 'song', 'sing', 'guitar', 'instrument', 'melody', 'rhythm'],
        response: (user) => `Music is the soul of the cosmos, @${user}! 🎹 Did you know my creator is amazing at playing the keyboard? Music brings hearts together faster than light! 🎵💕`,
    },

    // Bamzy & Creator Lore
    {
        keywords: ['ayobami', 'fretdev', 'creator', 'who made you', 'who built you', 'author'],
        response: () => `My creator is Fretdev (@Ayobami)! He built Bamzy with so much passion, precision, and love to create warm, dreamy real-time connections! 🎹🌸✨`,
    },

    // Time & Date
    {
        keywords: ['time', 'date', 'day', 'today', 'clock', 'year', 'month'],
        response: () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `Today is **${dateStr}** and the current local time is **${timeStr}**! ⏰✨`;
        },
    },

    // Advice & Mood Booster
    {
        keywords: ['sad', 'tired', 'stressed', 'anxious', 'depressed', 'lonely', 'help me', 'feel bad'],
        response: (user) => `Take a deep, gentle breath @${user}. 🌸 Remember that you are resilient, deeply valued, and doing your best. Clouds pass, but your inner star keeps shining. I'm right here sending you a big cosmic hug! 🤗💫`,
    },

    // Happiness & Love
    {
        keywords: ['happy', 'love', 'sweet', 'cute', 'awesome', 'amazing', 'beautiful', 'wonderful', 'great'],
        response: (user) => `Aww, thank you @${user}! You bring so much light and positive energy to Bamzy! Keep spreading that magic everywhere! 💕✨`,
    },

    // Jokes & Humor
    {
        keywords: ['joke', 'funny', 'laugh', 'riddle', 'humor', 'tell me something funny'],
        response: () => {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄⚛️",
                "How do space cowboys organize a party? They planet! 🪐🎉",
                "Why did the computer go to the doctor? Because it had a virus! 💻🩺",
                "What is an astronaut's favorite key on the keyboard? The Spacebar! 🚀⌨️",
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        },
    },

    // Science & Animals
    {
        keywords: ['animal', 'dog', 'cat', 'science', 'physics', 'chemistry', 'biology', 'ocean', 'nature', 'earth'],
        response: () => `Science fact of the day: 🐬 Dolphins give each other names and call out to their friends across the sea! Isn't nature incredible? 🌊✨`,
    },
];

// Conversational Starters / Greetings
const GREETINGS = [
    "Hello human friend! Floating in space and ready to answer any question you have! ✨",
    "Hi there! What are we exploring today? Ask me about space, math, science, tech, or life! 🚀",
    "Hey friend! Bamzy Bot at your service! What's on your mind? 🌸",
];

// Open-ended Fallbacks
const SMART_FALLBACKS = [
    "That's a fascinating thought! Tell me more about what you're curious about! 🌌✨",
    "I'm constantly learning about the universe! You can ask me math, science, space facts, coding, or just chat! 🚀",
    "Every question is a step closer to discovering something new! Ask me anything else on your mind! 💡✨",
];

export function getBamzyBotReply(userMessage: string, username: string): string {
    const raw = userMessage.trim();
    const lower = raw.toLowerCase();

    // 1. Check for Math Calculation
    const mathResult = solveMathExpression(raw);
    if (mathResult) {
        return mathResult;
    }

    // 2. Check Greetings
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower === 'yo' || lower === 'sup') {
        const randomIndex = Math.floor(Math.random() * GREETINGS.length);
        return `Hi @${username}! ✨ ${GREETINGS[randomIndex]}`;
    }

    // 3. Identity Queries
    if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('your name')) {
        return `I'm **Bamzy Bot**! 🤖✨ Your intelligent space companion. I can solve math problems, answer science & space questions, talk about coding, give life advice, tell jokes, or just hang out with you! 💕`;
    }

    // 4. Match Knowledge Base Keywords
    for (const item of KNOWLEDGE_BASE) {
        if (item.keywords.some((kw) => lower.includes(kw))) {
            return item.response(username);
        }
    }

    // 5. Smart Contextual Response for Questions
    if (lower.endsWith('?') || lower.startsWith('why') || lower.startsWith('how') || lower.startsWith('what')) {
        return `That's a great question, @${username}! While my space database is growing every day, I know that curiosity is what makes us human! Feel free to ask me math, space facts, coding, or time queries anytime! 🪐✨`;
    }

    // 6. General Fallback
    const fallbackIndex = Math.floor(Math.random() * SMART_FALLBACKS.length);
    return SMART_FALLBACKS[fallbackIndex];
}
