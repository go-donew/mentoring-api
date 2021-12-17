// @/routes/users.ts
// Sign up/in and token refresh API endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import permit from '../middleware/authorization.js'
import User from '../models/user.js'
import Users from '../providers/data/users.js'
import { Query } from '../types.js'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * The payload needed to make a request to list/find for users.
 *
 * @typedef {object} ListOrFindUsersPayload
 * @property {string} name - The user should have this name.
 * @property {string} email - The user should have this email address. - email
 * @property {string} phone - The user should have this phone number.
 * @property {string} lastSignedInBefore - The user should have signed in before this time. - date
 * @property {string} lastSignedInAfter - The user should have signed in after this time. - date
 */

/**
 * The response from the list/find users endpoint.
 *
 * @typedef {object} ListOrFindUsersResponse
 * @property {array<User>} users.required - The users returned from the query.
 */

/**
 * GET /users
 *
 * @summary List/find users
 * @tags users
 *
 * @security bearer
 *
 * @param {ListOrFindUsersPayload} request.body - The query to run and find users.
 *
 * @returns {ListOrFindUsersResponse} 200 - The users returned from the query. You must be `groot` to perform this query.
 * @returns {ImproperPayloadError} 400 - The name, email, phone or timestamps passed were invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all users that signed in after midnight (IST) on 1st January, 1970.
 * {
 * 	"lastSignedInAfter": "19700101T000000+0530"
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			// Build a valid query, and then return the result
			let query = []
			for (const [field, value] of Object.entries(request.body)) {
				if (field.endsWith('Before'))
					query.push({
						field: field.replace(/Before$/, ''),
						operator: '<',
						value,
					})
				else if (field.endsWith('After'))
					query.push({
						field: field.replace(/After$/, ''),
						operator: '>',
						value,
					})
				else
					query.push({
						field,
						operator: '==',
						value,
					})
			}

			query = query as Array<Query<User>>

			response.status(200).send({ users: await Users.find(query) })
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
