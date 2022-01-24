// @/loaders/index.ts
// Load all the components of the server

import { Application } from 'express'

import loadFirebase from './firebase/index.js'
import loadMiddleware from './express/middleware.js'
import loadDocumentation from './express/docs.js'
import loadRoutes from './express/routes.js'

/**
 * Calls all the loaders in this directory one by one, and passes the epxress
 * application instance to them.
 *
 * @param {Application} app - The Express application instance.
 */
const load = async (app: Application): Promise<void> => {
	// Initialize the Firebase Admin SDK
	await loadFirebase(app)
	// Register middleware
	await loadMiddleware(app)
	// Generate the documentation
	await loadDocumentation(app)
	// Register API endpoints
	await loadRoutes(app)
}

export default load
