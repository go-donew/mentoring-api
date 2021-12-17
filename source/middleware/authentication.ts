// @/middleware/authentication.ts
// Middleware that authenticates users making requests

import { Request, Response, NextFunction, RequestHandler } from 'express'

import Auth from '../providers/auth.js'
import Users from '../providers/data/users.js'
import ServerError from '../utils/errors.js'

/**
 * Ensure that users accessing the API are authenticated, except for
 * authentication and documentation related routes.
 *
 * The function returns middleware to authenticate the user. The middleware:
 * - First checks the 'Authorization' header, then the 'X-Access-Token' header
 *   for an access token.
 * - If none of the headers contain an access token, return a
 *   `NotAuthenticatedError` (401).
 * - If an access token is found, decode and verify it.
 * - If the access token is invalid, return an `InvalidAccessTokenError` (401).
 * - Lastly, retrieve the user from the ID specified in the access token.
 *
 * @returns {RequestHandler} - The authentication middleware.
 * @throws {ServerError} - 'invalid-token'
 */
const authenticateUsers =
	(): RequestHandler =>
	async (
		request: Request,
		_response: Response,
		next: NextFunction
	): Promise<void> => {
		// Don't do anything for docs and auth related routes. Also disable auth
		// for the `/ping` route, but not `/pong` - useful for tests!
		if (
			request.url.startsWith('/ping') ||
			request.url.startsWith('/auth') ||
			request.url.startsWith('/docs')
		) {
			next()
			return
		}

		// Check for a Bearer token in the `Authorization` header
		let token = request.headers.authorization
		// If there is nothing in either header, throw an error
		if (typeof token !== 'string') {
			next(new ServerError('invalid-token'))
			return
		}

		// Remove the `bearer` prefix (if it exists) and extra whitespaces from the
		// access token
		token = token.replace(/bearer/i, '').trim()

		// Fetch the user's details from the database and store the user in the
		// request object, so the request handlers know who is making the request
		try {
			const tokenData = await Auth.verifyToken(token)
			const user = await Users.get(tokenData.sub)
			const claims = await Auth.retrieveClaims(user.id)

			request.user = {
				...user,
				isGroot: claims?.groot ?? false,
				token,
			}
		} catch (error: unknown) {
			next(error)
			return
		}

		// We are good to go!
		next()
	}

export default authenticateUsers
