// @/routes/auth.ts
// Sign up/in and token refresh API endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import Auth from '../providers/auth.js'

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
 * @summary Create a DoNew Today account
 * @tags auth - Authentication related endpoints
 *
 * @param {SignUpPayload} request.body.required - The name, email address and password of the user to create.
 *
 * @returns {SignUpResponse} 201 - The created user and the tokens for that user.
 * @returns {ImproperPayloadError} 400 - The name, email or password passed were invalid.
 * @returns {EntityAlreadyExistsError} 409 - A user with the same email address already exists.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
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
			const userAndTokens = await Auth.signUp(
				request.body.name,
				request.body.email,
				request.body.password
			)

			response.status(201).send(userAndTokens)
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to make a request to sign in a user.
 *
 * @typedef {object} SignInPayload
 * @property {string} email.required - The user's email address. - email
 * @property {string} password.required - The user's password. - password
 */

/**
 * The response from the sign in endpoint.
 *
 * @typedef {object} SignInResponse
 * @property {User} user.required - The signed in user.
 * @property {Tokens} tokens.required - The tokens the user can use to access other endpoints.
 */

/**
 * POST /auth/signin
 *
 * @summary Sign into your DoNew Today account
 * @tags auth - Authentication related endpoints
 *
 * @param {SignInPayload} request.body.required - The email address and password of the user to sign in.
 *
 * @returns {SignInResponse} 200 - The signed in user and the tokens for that user.
 * @returns {ImproperPayloadError} 400 - The email or password passed were invalid.
 * @returns {IncorrectCredentialsError} 401 - The password for that account was incorrect.
 * @returns {EntityNotFoundError} 404 - A user with the email address passed in the request does not exists.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example payload.
 * {
 * 	"email": "user@example.com",
 * 	"password": "secret"
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/signin',
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const userAndTokens = await Auth.signIn(
				request.body.email,
				request.body.password
			)
			response.status(200).send(userAndTokens)
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to make a request to refresh a user's tokens.
 *
 * @typedef {object} TokenRefreshPayload
 * @property {string} refreshToken.required - The user's refresh token.
 */

/**
 * The response from the token refresh endpoint.
 *
 * @typedef {object} TokenRefreshResponse
 * @property {Tokens} tokens.required - The tokens the user can use to access other endpoints.
 */

/**
 * POST /auth/refresh-token
 *
 * @summary Refresh access token
 * @tags auth - Authentication related endpoints
 *
 * @param {TokenRefreshPayload} request.body.required - The refresh token the user is given while signing up/in.
 *
 * @returns {TokenRefreshResponse} 200 - The new set of tokens the user can use.
 * @returns {ImproperPayloadError} 400 - The refresh token passed was invalid.
 * @returns {IncorrectCredentialsError} 401 - The refresh token had expired.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example payload.
 * {
 * 	"refreshToken": "..."
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/refresh-token',
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const tokens = await Auth.refreshTokens(request.body.refreshToken)

			response.status(200).send({ tokens })
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
