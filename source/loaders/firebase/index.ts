// @/loaders/firebase/index.ts
// Initializes the Firebase Admin SDK

import Process from 'node:process'

import { Application } from 'express'
import { initializeApp, applicationDefault } from 'firebase-admin/app'

/**
 * Initializes the Firebase Admin SDK.
 */
const load = async (_app: Application): Promise<void> => {
	// Initialize the Firebase Admin SDK
	if (Process.env.NODE_ENV === 'production') {
		// If in production, connect to the real Firebase project
		initializeApp({
			credential: applicationDefault(),
		})
	} else {
		// Else just connect to the emulators
		initializeApp()
	}
}

export default load
