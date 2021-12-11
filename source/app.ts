// @/app.ts
// Defines and exports the ExpressJS server

import createServer from 'express'

import load from './loaders/index.js'

// Create an express `Application`
const app = createServer()
// Load the middleware and endpoints as well as initialize all services
await load(app)

export default app
