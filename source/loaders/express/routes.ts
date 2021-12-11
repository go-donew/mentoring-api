// @/loaders/express/routes.ts
// Registers the API endpoints

import { Application, Request, Response, NextFunction } from 'express'

import authEndpoint from '../../routes/auth.js'
import ServerError from '../../utils/errors.js'

/**
 * Registers API endpoint handlers with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
const load = async (app: Application): Promise<void> => {
	// Register the API endpoints
	app.all('/ping', (_: Request, response: Response) => response.send('Pong!'))
	app.use('/auth', authEndpoint)

	// If a client calls a random route that has no registered request handler,
	// return a 404 `route-not-found` error.
	app.all('*', (_: Request, response: Response): void => {
		response.sendError('route-not-found')
	})
	// Handle any other errors that are thrown
	app.use(
		(
			caughtError: Error,
			_request: Request,
			response: Response,
			_next: NextFunction
		) => {
			if (caughtError instanceof ServerError) {
				response.sendError(caughtError)
			} else if ((caughtError as any).status === 400) {
				response.sendError(
					new ServerError(
						'improper-payload',
						`An error occurred while validating your request: ${caughtError.message}.`
					)
				)
			} else if (
				(caughtError as any).status === 404 &&
				(caughtError as any).path
			) {
				response.sendError(new ServerError('route-not-found'))
			} else {
				console.trace('Unexpected error:', caughtError)
				response.sendError('server-crash')
			}
		}
	)
}

export default load
