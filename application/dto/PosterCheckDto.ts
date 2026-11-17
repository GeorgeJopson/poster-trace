/**
 * What the register page needs to know about a poster it has read: whether
 * Poster Trace recognises it and, if so, whether it's registered. It says
 * nothing about the registration itself.
 */
export type PosterCheckDto = "unknown" | "registered" | "unregistered";
