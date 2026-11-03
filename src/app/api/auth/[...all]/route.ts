import { auth } from "@infrastructure/auth/betterAuth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
