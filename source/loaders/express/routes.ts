// @/loaders/express/routes.ts
// Loader to register API endpoints with the server.

import type { Application, Request, Response, NextFunction } from 'express'

import { endpoint as auth } from '@/routes/auth'
import { endpoint as users } from '@/routes/users'
import { endpoint as groups } from '@/routes/groups'
import { endpoint as attributes } from '@/routes/attributes'
import { endpoint as conversations } from '@/routes/conversations'
import { ServerError } from '@/errors'

/**
 * Registers API endpoint handlers with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
export const load = async (app: Application): Promise<void> => {
	// Register the API endpoints
	// `/ping` and `/pong` are test routes
	app.all(/p[i|o]ng/, (_: Request, response: Response) =>
		response
			.status(200)
			.send(
				'Thanks for using the DoNew Mentoring API! Check out the docs by going to /docs in your browser.'
			)
	)

	app.use('/auth', auth)
	app.use('/users', users)
	app.use('/groups', groups)
	app.use('/attributes', attributes)
	app.use('/conversations', conversations)

	// If a client calls a random route that has no registered request handler,
	// return a 404 `route-not-found` error.
	app.all('*', (_: Request, response: Response): void => {
		response.sendError('route-not-found')
	})
	// Handle any other errors that are thrown
	app.use(
		(caughtError: Error, _request: Request, response: Response, _next: NextFunction) => {
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
