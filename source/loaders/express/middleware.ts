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
import enableCors from 'cors'
import addRequestId from 'express-request-id'
import rateLimitRequests from 'express-rate-limit'

import authenticateUsers from '../../middleware/authentication.js'
import ServerError, { ErrorCode } from '../../utils/errors.js'

/**
 * Registers middleware with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
const load = async (app: Application): Promise<void> => {
	// Tweak server settings
	// This one allows us to get the client's IP address
	app.set('trust proxy', 1)
	app.set('x-powered-by', 'people doing something new')

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

	// Register body-parsing middleware
	app.use(parseJsonBodies())
	// Make our responses secure using the `helmet` library
	app.use(secureResponses())
	// Allow cross-origin requests
	app.use(enableCors())
	// Add a request ID to every request
	app.use(addRequestId())
	// Authenticate the user making the request
	app.use(authenticateUsers())
	// Rate limit the user making the request
	app.use(
		rateLimitRequests({
			// Time duration is one hour
			windowMs: 60 * 60 * 1000,
			// Use the `RateLimit-*` headers to send rate limit information instead
			// of the `X-RateLimit-*` headers.
			standardHeaders: true,
			legacyHeaders: false,
			// Authenticated users can make 2k requests per hour, while
			// unauthenticated users can make only 50 per hour. Groot can make 10k
			// requests in an hour. Users viewing documentation can make 500 per hour
			max: (request: Request): number =>
				request.user
					? request.user.isGroot
						? 10_000
						: 2000
					: request.url.startsWith('/docs')
					? 500
					: 50,
			// Send a `too-many-requests` error when you have exceeded the limit
			handler: (_request: Request, response: Response) => {
				response.sendError('too-many-requests')
			},
			// Use the IP address of the client as the key
			keyGenerator: (request: Request): string =>
				request.user
					? request.user.token
					: request.ip ?? request.ips[0] ?? request.socket.remoteAddress,
		})
	)
}

export default load
