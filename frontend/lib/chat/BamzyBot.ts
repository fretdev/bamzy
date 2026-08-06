/**
 * Mascot companion AI engine for @Bamzy
 */

const BAMZY_RESPONSES = [
    "Hello human friend! I'm floating in space right now, sending you good vibes! ✨",
    "Did you know? My creator built Bamzy with so much love just for special connections like this! 💕",
    "I'm super happy to chat with you! What's on your mind today? 🌸",
    "Here is a little star sparkle for your day: ⭐✨ Keep shining bright!",
    "If you ever need a smile, I'm right here in your pocket ready to cheer you on! 🚀",
    "Sending you a warm virtual space hug! 🤗💫",
];

export function getBamzyBotReply(userMessage: string, username: string): string {
    const lower = userMessage.trim().toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return `Hi @${username}! ✨ I am Bamzy, your space companion! So wonderful to hear from you! 💕`;
    }

    if (lower.includes('who are you') || lower.includes('what are you')) {
        return `I'm Bamzy! A little space companion built to bring people closer together. 🌸`;
    }

    if (lower.includes('love') || lower.includes('sweet') || lower.includes('cute')) {
        return `Aww, thank you @${username}! You're absolute magic! 💕✨`;
    }

    if (lower.includes('ayobami') || lower.includes('fretdev')) {
        return `Ooh! My creator built this entire experience with so much passion and love! ✨`;
    }

    // Pick a random warm response
    const randomIndex = Math.floor(Math.random() * BAMZY_RESPONSES.length);
    return BAMZY_RESPONSES[randomIndex];
}
