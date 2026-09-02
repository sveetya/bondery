export const MAGIC_LINK_EXPIRES_IN_SECONDS = 900;
export const MAGIC_LINK_SEND_WINDOW_SECONDS = 15 * 60;
export const MAGIC_LINK_SEND_MAX_PER_WINDOW = 8;
export const MAGIC_LINK_REDIS_PREFIX = "bondery:magic-link:" as const;
export const MAGIC_LINK_BA_RATE_LIMIT = { max: 10, window: 60 } as const;
