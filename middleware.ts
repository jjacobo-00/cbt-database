/**
 * Next.js Middleware Entry Point
 *
 * This file is the required entry point for Next.js middleware.
 * Route protection logic lives in proxy.ts and is re-exported here
 * to keep auth logic in one canonical place.
 */
export { proxy as middleware, config } from "@/proxy"
