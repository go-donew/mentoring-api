// @/routes/auth
// Sign In and signup API Endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import { Auth } from '../providers/auth.js'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * The payload needed to make a request to sign up a user.
 *
 * @typedef {object} SignUpPayload
 * @property {string} name.required - The user's name.
 * @property {string} email.required - The user's email address. - email
 * @property {string} password.required - The user's password. - password
 */
/**
 * The response from the sign up endpoint.
 *
 * @typedef {object} SignUpResponse
 * @property {User} user.required - The created user.
 * @property {Tokens} tokens.required - The tokens the user can use to access other endpoints.
 */

/**
 * POST /auth/signup
 *
 * @summary Creates a DoNew Today account for the user.
 * @tags auth
 *
 * @param {SignUpPayload} request.body.required - The name, email address and password of the user to create.
 *
 * @returns {SignUpResponse} 201 - The created user and the tokens for that user.
 * @returns {ImproperPayloadError} 400 - The name, email or password passed were invalid.
 * @returns {EntityAlreadyExistsError} 409 - A user with the same email address already exists.
 * @returns {TooManyRequestsError} 429 - The client has been rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example payload.
 * {
 * 	"name": "A User",
 * 	"email": "user@example.com",
 * 	"password": "secret"
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/signup',
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			response
				.status(201)
				.send(
					await Auth.signUp(
						request.body.name,
						request.body.email,
						request.body.password
					)
				)
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
