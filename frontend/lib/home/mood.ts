export type Mood = 'idle' | 'sad' | 'transitioning';

export const ACCENT_COLOR = '#F43F5E'; // vibrant glowing rose magenta — primary brand accent

export const CLOUD_DURATION: Record<Mood, number> = {
    idle: 30,
    sad: 70,
    transitioning: 14,
};

export const CLOUD_OPACITY: Record<Mood, number> = {
    idle: 0.95,
    sad: 0.5,
    transitioning: 0.95,
};

export const SKY_GRADIENT: Record<Mood, { from: string; to: string }> = {
    idle:          { from: '#C084FC', to: '#F472B6' }, // rich luminous purple-lilac → vibrant rose blossom
    sad:           { from: '#475569', to: '#94A3B8' }, // deep stormy lavender-slate
    transitioning: { from: '#EC4899', to: '#F59E0B' }, // electric sunset magenta → radiant golden amber
};