/**
 * Next.js Middleware
 * 
 * Ce fichier exporte le middleware proxy pour l'authentification,
 * le rate limiting et la sécurité.
 */

import proxy, { config } from './proxy';

export default proxy;
export { config };
