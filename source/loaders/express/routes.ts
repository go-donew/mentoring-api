// @/loaders/express/routes.ts
// Registers the API endpoints

import { Application, Request, Response, NextFunction } from 'express'

import authEndpoint from '../../routes/auth.js'
import usersEndpoint from '../../routes/users.js'
import groupsEndpoint from '../../routes/groups.js'
import ServerError from '../../utils/errors.js'

/**
 * Registers API endpoint handlers with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
const load = async (app: Application): Promise<void> => {
	// Register the API endpoints
	// `/ping` and `/pong` are test routes
	app.all(/p[i|o]ng/, (_: Request, response: Response) =>
		response
			.status(200)
			.send(
				'Thanks for using the DoNew Today API! Check out the docs by going to /docs in your browser.'
			)
	)

	app.use('/auth', authEndpoint)
	app.use('/users', usersEndpoint)
	app.use('/groups', groupsEndpoint)

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
				// We threw this error, so pass it on
				response.sendError(caughtError)
			} else if ((caughtError as any).status === 400) {
				// The request validator threw an error, return it as an `improper-payload`
				// error
				response.sendError(
					new ServerError(
						'improper-payload',
						`An error occurred while validating your request: ${caughtError.message}.`
					)
				)
			} else if (
				(caughtError as any).status === 404 &&
				(caughtError as any).path &&
				!(caughtError instanceof ServerError)
			) {
				// The request validator threw an error for an unknown route, so return it
				// as a `route-not-found` error
				response.sendError(new ServerError('route-not-found'))
			} else {
				// We crashed :/
				console.trace('Unexpected error:', caughtError)
				response.sendError('server-crash')
			}
		}
	)
}

export default load
