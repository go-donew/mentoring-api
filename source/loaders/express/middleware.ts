// @/loaders/express/middleware.ts
// Registers middleware with the express application

import {
	Application,
	Request,
	Response,
	NextFunction,
	json as parseJsonBodies,
} from 'express'
import secureResponses from 'helmet'
import addRequestId from 'express-request-id'

import ServerError, { ErrorCode } from '../../utils/errors.js'

/**
 * Registers middleware with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
const load = async (app: Application): Promise<void> => {
	// Tweak server settings
	// This one allows us to get the client's IP address
	app.enable('trust proxy')
	app.set('x-powered-by', 'people doing something new')

	// Register body-parsing middleware
	app.use(parseJsonBodies())
	// Make our responses secure using the `helmet` library
	app.use(secureResponses())
	// Add a request ID to every request
	app.use(addRequestId())

	// Add a custom method to the request object
	app.use((_request: Request, response: Response, next: NextFunction) => {
		response.sendError = (error: ErrorCode | ServerError) => {
			const serverError =
				typeof error === 'string' ? new ServerError(error) : error
			response.status(serverError.status).send({
				error: serverError,
			})
		}

		next()
	})
}

export default load
