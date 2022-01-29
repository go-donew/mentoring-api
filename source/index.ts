// @/index.ts
// Exports the server so it can be accessed by Firebase Functions.

import { https } from 'firebase-functions'
import createServer from 'express'

import { load } from '@/loaders'

const registerHandlers = https.onRequest

// Create an Express `Application`
const server = createServer()
// Load the middleware and endpoints as well as initialize all services
await load(server)

// This type of export is required for Firebase Functions to detect the
// function and deploy it
export const app = registerHandlers(server)
