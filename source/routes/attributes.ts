// @/routes/attributes.ts
// List, retrieve, create, update and delete API endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import permit from '../middleware/authorization.js'
import Attribute from '../models/attribute.js'
import Attributes from '../providers/data/attributes.js'
import { Query } from '../types.js'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * The payload needed to make a request to list/find for attributes.
 *
 * @typedef {object} ListOrFindAttributesPayload
 * @property {string} id - The attribute should have this id.
 * @property {string | number | boolean} value - The attribute should have the given value.
 */

/**
 * The response from the list/find attributes endpoint.
 *
 * @typedef {object} ListOrFindAttributesResponse
 * @property {array<Attribute>} attributes.required - The attributes returned from the query.
 */

/**
 * GET /users/{userId}/attributes
 *
 * @summary List/find attributes
 * @tags attributes
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attributes to list.
 * @param {ListOrFindAttributesPayload} request.body - The query to run and find attributes.
 *
 * @returns {ListOrFindAttributesResponse} 200 - The attributes returned from the query. If no parameters are passed, then it returns all the attributes the user is a part of.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all attributes that have the value `1`.
 * {
 * 	"value": 1
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/:userId/attributes',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Attributes.context({ userId: request.params.userId })

			// Build a valid query, and then return the result
			let query = []
			for (const [field, value] of Object.entries(request.body)) {
				query.push({
					field,
					operator: '==',
					value,
				})
			}

			query = query as Array<Query<Attribute>>
			const attributes = await Attributes.find(query)

			response.status(200).send({ attributes })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to create a attribute.
 *
 * @typedef {object} CreateAttributePayload
 * @property {string} id.required - The ID of the attribute.
 * @property {string | number | boolean} value.required - The value to set for the attribute.
 * @property {BlamedMessage} message - The message/question, answering which, this attribute was observed.
 */

/**
 * The response from the create attribute endpoint.
 *
 * @typedef {object} CreateAttributeResponse
 * @property {Attribute} attribute.required - The created attribute.
 */

/**
 * POST /users/{userId}/attributes
 *
 * @summary Create a attribute
 * @tags attributes
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to create.
 * @param {CreateAttributePayload} request.body - The necessary details to create a attribute.
 *
 * @returns {CreateAttributeResponse} 201 - The created attribute.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a attribute
 * {
 * 	"id": "quiz_score",
 * 	"value": 10
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/:userId/attributes',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Attributes.context({ userId: request.params.userId })

			const observer = request.user!.id
			const timestamp = new Date()
			const attribute = await Attributes.create(request.body.id, {
				_userId: request.params.userId,
				id: request.body.id,
				value: request.body.value,
				history: [
					{
						observer,
						timestamp,
						message: request.body.message ?? null, // Firestore doesn't like `undefined`
						value: request.body.value,
					},
				],
			})

			response.status(201).send({ attribute })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The response from the retrieve attribute endpoint.
 *
 * @typedef {object} RetrieveAttributeResponse
 * @property {Attribute} attribute.required - The requested attribute.
 */

/**
 * GET /users/{userId}/attributes/{attributeId}
 *
 * @summary Retrieve a requested attribute
 * @tags attributes
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to return.
 * @param {string} attributeId.path.required - The ID of the attribute to return.
 *
 * @returns {RetrieveAttributeResponse} 200 - The requested attribute. You must be a part of the attribute.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:userId/attributes/:attributeId',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Attributes.context({ userId: request.params.userId })

			const attribute = await Attributes.get(request.params.attributeId)

			response.status(200).send({ attribute })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to update a attribute.
 *
 * @typedef {object} UpdateAttributePayload
 * @property {string | number | boolean} value.required - The value to set for the attribute.
 * @property {BlamedMessage} message - The message/question, answering which, this attribute was observed.
 */

/**
 * The response from the update attribute endpoint.
 *
 * @typedef {object} UpdateAttributeResponse
 * @property {Attribute} attribute.required - The updated attribute.
 */

/**
 * PUT /users/{userId}/attributes/{attributeId}
 *
 * @summary Update a certain attribute
 * @tags attributes
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to update.
 * @param {string} attributeId.path.required - The ID of the attribute to update.
 * @param {UpdateAttributePayload} request.body.required - The new attribute.
 *
 * @returns {UpdateAttributeResponse} 200 - The updated attribute. You must be a supermentor of the attribute to update its details.
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
	'/:userId/attributes/:attributeId',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Attributes.context({ userId: request.params.userId })

			const observer = request.user!.id
			const timestamp = new Date()
			const attribute = await Attributes.update(request.params.attributeId, {
				value: request.body.value,
				history: [
					{
						observer,
						timestamp,
						message: request.body.message ?? null, // Firestore doesn't like `undefined`
						value: request.body.value,
					},
				],
			})

			response.status(200).send({ attribute })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * DELETE /users/{userId}/attributes/{attributeId}
 *
 * @summary Delete a certain attribute
 * @tags attributes
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to delete.
 * @param {string} attributeId.path.required - The ID of the attribute to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a attribute.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:userId/attributes/:attributeId',
	permit({
		subject: 'user',
		roles: ['supermentor'],
	}),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Attributes.context({ userId: request.params.userId })

			await Attributes.delete(request.params.attributeId)

			response.sendStatus(204)
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
