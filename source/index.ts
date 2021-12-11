// @/index.ts
// Exports the server, so it can be accessed by Firebase Functions

import { https as HttpsFunctions } from 'firebase-functions'

import server from './app.js'

// This type of export is required for Firebase Functions to detect the
// function and deploy it
export const app = HttpsFunctions.onRequest(server)
