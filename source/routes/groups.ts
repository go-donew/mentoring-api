// @/routes/groups.ts
// List, retrieve, create, update and delete API endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import permit from '../middleware/authorization.js'
import Group from '../models/group.js'
import Groups from '../providers/data/groups.js'
import { generateId } from '../utils/index.js'
import { Query } from '../types.js'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * The payload needed to make a request to list/find for groups.
 *
 * @typedef {object} ListOrFindGroupsPayload
 * @property {string} name - The group should have this name.
 * @property {string} participants - The group should have the given participants.
 * @property {string} conversations - The group should be allowed to take part in the given conversations.
 * @property {string} reports - The group should be allowed to view the given reports.
 * @property {string} code - The group should have this code.
 */

/**
 * The response from the list/find groups endpoint.
 *
 * @typedef {object} ListOrFindGroupsResponse
 * @property {array<Group>} groups.required - The groups returned from the query.
 */

/**
 * GET /groups
 *
 * @summary List/find groups
 * @tags groups
 *
 * @security bearer
 *
 * @param {ListOrFindGroupsPayload} request.body - The query to run and find groups.
 *
 * @returns {ListOrFindGroupsResponse} 200 - The groups returned from the query. If no parameters are passed, then it returns all the groups the user is a part of.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all groups that have the user ID `LZfXLFzPPR4NNrgjlWDxn`
 * {
 * 	"participants": "LZfXLFzPPR4NNrgjlWDxn"
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	// => permit('anyone'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			// Build a valid query, and then return the result
			let query = []
			for (const [field, value] of Object.entries(request.body)) {
				if (['participants', 'conversations', 'reports'].includes(field))
					query.push({
						field,
						operator: 'includes',
						value,
					})
				else
					query.push({
						field,
						operator: '==',
						value,
					})
			}

			if (!request.user?.isGroot) {
				query.push({
					field: 'participants',
					operator: 'includes',
					value: request.user!.id,
				})
			}

			query = query as Array<Query<Group>>
			const groups = await Groups.find(query)

			response.status(200).send({ groups })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to create a group.
 *
 * @typedef {Group} CreateGroupPayload
 * @property {string} name.required - The group should have this name.
 * @property {ParticipantList} participants.required - The group should have the given participants.
 * @property {ConversationList} conversations.required - The group should be allowed to take part in the given conversations.
 * @property {ReportList} reports.required - The group should be allowed to view the given reports.
 * @property {string} code.required - The group should have this code.
 */

/**
 * The response from the create group endpoint.
 *
 * @typedef {object} CreateGroupResponse
 * @property {Group} group.required - The created group.
 */

/**
 * POST /groups
 *
 * @summary Create a group
 * @tags groups
 *
 * @security bearer
 *
 * @param {CreateGroupPayload} request.body - The necessary details to create a group.
 *
 * @returns {CreateGroupResponse} 201 - The created group.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a group
 * {
 * 	"name": "A Group"
 * 	"participants": {
 * 		"LZfXLFzPPR4NNrgjlWDxn"	: "mentee"
 * 	},
 * 	"conversations": {
 * 		"quiz": ["mentee"]
 * 	},
 * 	"reports": {
 * 		"quiz-score": ["mentor"]
 * 	},
 * 	"code": "join-using-this-code"
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const id = generateId()
			const group = await Groups.create(id, {
				...request.body,
				id,
			})

			response.status(201).send({ group })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The response from the retrieve group endpoint.
 *
 * @typedef {object} RetrieveGroupResponse
 * @property {Group} group.required - The requested group.
 */

/**
 * GET /groups/{groupId}
 *
 * @summary Retrieve a requested group
 * @tags groups
 *
 * @security bearer
 *
 * @param {string} groupId.path.required - The ID of the group to return.
 *
 * @returns {RetrieveGroupResponse} 200 - The requested group. You must be a part of the group.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:groupId',
	permit({
		subject: 'group',
		roles: ['participant'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const group = await Groups.get(request.params.groupId)

			response.status(200).send({ group })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to update a group.
 *
 * @typedef {Group} UpdateGroupPayload
 * @property {string} name.required - The group should have this name.
 * @property {ParticipantList} participants.required - The group should have the given participants.
 * @property {ConversationList} conversations.required - The group should be allowed to take part in the given conversations.
 * @property {ReportList} reports.required - The group should be allowed to view the given reports.
 * @property {string} code.required - The group should have this code.
 */

/**
 * The response from the update group endpoint.
 *
 * @typedef {object} UpdateGroupResponse
 * @property {Group} group.required - The updated group.
 */

/**
 * PUT /groups/{groupId}
 *
 * @summary Update a certain group
 * @tags groups
 *
 * @security bearer
 *
 * @param {string} groupId.path.required - The ID of the group to update.
 * @param {UpdateGroupPayload} request.body.required - The new group.
 *
 * @returns {UpdateGroupResponse} 200 - The updated group. You must be a supermentor of the group to update its details.
 * @returns {ImproperPayloadError} 400 - The payload was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.put(
	'/:groupId',
	permit({
		subject: 'group',
		roles: ['supermentor'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const group = await Groups.update(request.params.groupId, request.body)

			response.status(200).send({ group })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * DELETE /groups/{groupId}
 *
 * @summary Delete a certain group
 * @tags groups
 *
 * @security bearer
 *
 * @param {string} groupId.path.required - The ID of the group to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a group.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:groupId',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await Groups.delete(request.params.groupId)

			response.sendStatus(204)
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
