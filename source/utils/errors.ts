// @/errors/index.ts
// We <3 errors! No, not really XD

/**
 * A list of errors we can return.
 */
const errors = {
	/**
	 * Error to return when the request body contained invalid data.
	 *
	 * @typedef {object} ImproperPayloadError
	 *
	 * @property {string} code.required - The error code. - enum:improper-payload
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:400
	 */
	'improper-payload': {
		message: `The request body did not contain valid data needed to perform the operation.`,
		status: 400,
	},

	/**
	 * Error to return when the bearer token passed by the user is invalid.
	 *
	 * @typedef {object} InvalidTokenError
	 *
	 * @property {string} code.required - The error code. - enum:invalid-token
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:401
	 */
	'invalid-token': {
		message: `The bearer token passed was invalid. Please pass a valid token in the 'Authorization' header and try again.`,
		status: 401,
	},

	/**
	 * Error to return when the credentials (usually password) passed by the user
	 * were incorrect.
	 *
	 * @typedef {object} IncorrectCredentialsError
	 *
	 * @property {string} code.required - The error code. - enum:incorrect-credentials
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:401
	 */
	'incorrect-credentials': {
		message: `The credentials passed were invalid. Please pass valid credentials and try again.`,
		status: 401,
	},

	/**
	 * Error to return when the requested entity was not found.
	 *
	 * @typedef {object} EntityNotFoundError
	 *
	 * @property {string} code.required - The error code. - enum:entity-not-found
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:404
	 */
	'entity-not-found': {
		message: `The requested entity was not found.`,
		status: 404,
	},

	/**
	 * Error to return when the route requested by the user doesn't exist.
	 *
	 * @typedef {object} RouteNotFoundError
	 *
	 * @property {string} code.required - The error code. - enum:route-not-found
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:404
	 */
	'route-not-found': {
		message: `The requested route was not found. Take a look at the documentation for a list of valid endpoints.`,
		status: 404,
	},

	/**
	 * Error to return when an entity with the same value in a unique field exists.
	 *
	 * @typedef {object} EntityAlreadyExistsError
	 *
	 * @property {string} code.required - The error code. - enum:entity-already-exists
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:409
	 */
	'entity-already-exists': {
		message: `An entity with the same ID already exists.`,
		status: 409,
	},

	/**
	 * Error to return when the user gets rate limited.
	 *
	 * @typedef {object} TooManyRequestsError
	 *
	 * @property {string} code.required - The error code. - enum:too-many-requests
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:429
	 */
	'too-many-requests': {
		message: `Woah! You need to enhance your calm...`,
		status: 429,
	},

	/**
	 * Error to return when an error occurs while talking to the database/auth service.
	 *
	 * @typedef {object} BackendError
	 *
	 * @property {string} code.required - The error code. - enum:backend-error
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:500
	 */
	'backend-error': {
		message: `An unexpected error occurred while interacting with the backend. Please try again in a few seconds or report this issue.`,
		status: 500,
	},

	/**
	 * Error to return when the server crashes.
	 *
	 * @typedef {object} ServerCrashError
	 *
	 * @property {string} code.required - The error code. - enum:server-crash
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:500
	 */
	'server-crash': {
		message: `An unexpected error occurred. Please try again in a few seconds or report this issue.`,
		status: 500,
	},
}

/**
 * A type for error codes.
 */
export type ErrorCode = keyof typeof errors

/**
 * A custom error class with additional information to return to the client.
 *
 * @property {string} code - The error 'code'.
 * @property {number} status - The corresponding HTTP status code to return.
 * @property {string} message - A detailed error message, explaining why the error occurred and a possible fix.
 */
class ServerError extends Error {
	code: ErrorCode
	status: number
	message: string

	constructor(code: ErrorCode, message?: string, status?: number) {
		message ??= errors[code].message
		status ??= errors[code].status

		super(message)
		Error.captureStackTrace(this)

		this.code = code
		this.status = status
		this.message = message

		console.log(this.stack)
	}
}

export default ServerError