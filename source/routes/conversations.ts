// @/routes/conversations.ts
// List, retrieve, create, update and delete API endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import permit from '../middleware/authorization.js'
import Conversation from '../models/conversation.js'
import Conversations from '../providers/data/conversations.js'
import { generateId } from '../utils/index.js'
import { Query } from '../types.js'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * The payload needed to make a request to list/find for conversations.
 *
 * @typedef {object} ListOrFindConversationsPayload
 * @property {string} name - The conversation should have this name.
 * @property {string} description - The conversation should have this description.
 * @property {boolean} once - The conversation should be allowed to be taken only once.
 * @property {array<string>} tags - The conversation should have all these tags.
 */

/**
 * The response from the list/find conversations endpoint.
 *
 * @typedef {object} ListOrFindConversationsResponse
 * @property {array<Conversation>} conversations.required - The conversations returned from the query.
 */

/**
 * GET /conversations
 *
 * @summary List/find conversations
 * @tags conversations
 *
 * @security bearer
 *
 * @param {ListOrFindConversationsPayload} request.body - The query to run and find conversations.
 *
 * @returns {ListOrFindConversationsResponse} 200 - The conversations returned from the query. You must be Groot to list or query all conversations.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all conversations that are tagged `quiz`
 * {
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	permit({
		subject: 'conversation',
		roles: 'dynamic',
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			// Build a valid query, and then return the result
			let query = []
			for (const [field, value] of Object.entries(request.body)) {
				if (field === 'tags')
					for (const tag of value as string[])
						query.push({
							field,
							operator: 'includes',
							tag,
						})
				else
					query.push({
						field,
						operator: '==',
						value,
					})
			}

			query = query as Array<Query<Conversation>>
			const conversations = await Conversations.find(query)

			response.status(200).send({ conversations })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to create a conversation.
 *
 * @typedef {object} CreateConversationPayload
 * @property {string} name.required - The name of the conversation.
 * @property {string} description.required - The description of the conversation.
 * @property {boolean} once.required - Whether the conversation should be taken only once.
 * @property {array<string>} tags.required - The tags of the conversation.
 */

/**
 * The response from the create conversation endpoint.
 *
 * @typedef {object} CreateConversationResponse
 * @property {Conversation} conversation.required - The created conversation.
 */

/**
 * POST /conversations
 *
 * @summary Create a conversation
 * @tags conversations
 *
 * @security bearer
 *
 * @param {CreateConversationPayload} request.body - The necessary details to create a conversation.
 *
 * @returns {CreateConversationResponse} 201 - The created conversation. You must be Groot to create a conversation.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a conversation
 * {
 * 	"name": "Daily Update",
 *  "description": "Enables the user to give a daily update to their mentor in a conversational format."
 * 	"once": false,
 *  "tags": ["daily-update"]
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
			const conversation = await Conversations.create(id, {
				...request.body,
				id,
			})

			response.status(201).send({ conversation })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The response from the retrieve conversation endpoint.
 *
 * @typedef {object} RetrieveConversationResponse
 * @property {Conversation} conversation.required - The requested conversation.
 */

/**
 * GET /conversations/{conversationId}
 *
 * @summary Retrieve a requested conversation
 * @tags conversations
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the conversation to return.
 *
 * @returns {RetrieveConversationResponse} 200 - The requested conversation. You must be a part of the group that is allowed to take this conversation.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:conversationId',
	permit({
		subject: 'conversation',
		roles: 'dynamic',
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const conversation = await Conversations.get(
				request.params.conversationId
			)

			response.status(200).send({ conversation })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to update a conversation.
 *
 * @typedef {object} UpdateConversationPayload
 * @property {string} name.required - The name of the conversation.
 * @property {string} description.required - The description of the conversation.
 * @property {boolean} once.required - Whether the conversation should be taken only once.
 * @property {array<string>} tags.required - The tags of the conversation.
 */

/**
 * The response from the update conversation endpoint.
 *
 * @typedef {object} UpdateConversationResponse
 * @property {Conversation} conversation.required - The updated conversation.
 */

/**
 * PUT /conversations/{conversationId}
 *
 * @summary Update a certain conversation
 * @tags conversations
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the conversation to update.
 * @param {UpdateConversationPayload} request.body.required - The new conversation.
 *
 * @returns {UpdateConversationResponse} 200 - The updated conversation. You must be a part of the group that is allowed to take this conversation.
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
	'/:conversationId',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const conversation = await Conversations.update(
				request.params.conversationId,
				request.body
			)

			response.status(200).send({ conversation })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * DELETE /conversations/{conversationId}
 *
 * @summary Delete a certain conversation
 * @tags conversations
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the conversation to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a conversation.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:conversationId',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await Conversations.delete(request.params.conversationId)
			// TODO: Delete all questions that are part of the conversation too

			response.sendStatus(204)
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
