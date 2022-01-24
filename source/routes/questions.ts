// @/routes/questions.ts
// List, retrieve, create, update and delete API endpoint handler

import {
	Router as createRouter,
	Request,
	Response,
	NextFunction,
} from 'express'

import permit from '../middleware/authorization.js'
import Question from '../models/question.js'
import Attribute from '../models/attribute.js'
import Questions from '../providers/data/questions.js'
import Attributes from '../providers/data/attributes.js'
import ServerError from '../utils/errors.js'
import { generateId } from '../utils/index.js'
import { Query } from '../types.js'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * The payload needed to make a request to list/find for questions.
 *
 * @typedef {object} ListOrFindQuestionsPayload
 * @property {boolean} first - Whether the question should be the first one in the conversation.
 * @property {boolean} last - Whether the question should be the last one in the conversation.
 * @property {boolean} randomizeOptionOrder - Whether the options for that question should be randomized.
 * @property {array<string>} tags - The question should have all the given tags.
 */

/**
 * The response from the list/find questions endpoint.
 *
 * @typedef {object} ListOrFindQuestionsResponse
 * @property {array<Question>} questions.required - The questions returned from the query.
 */

/**
 * GET /conversations/{conversationId}/questions
 *
 * @summary List/find questions
 * @tags questions
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose questions to list.
 * @param {ListOrFindQuestionsPayload} request.body - The query to run and find questions.
 *
 * @returns {ListOrFindQuestionsResponse} 200 - The questions returned from the query. If no parameters are passed, then it returns all the questions part of the conversation.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all questions that have the tag `quiz`.
 * {
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/:conversationId/questions',
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
			Questions.context({ conversationId: request.params.conversationId })

			// Build a valid query, and then return the result
			let query = []
			for (const [field, value] of Object.entries(request.body)) {
				if (field === 'tags')
					for (const tag of value as string[])
						query.push({
							field,
							operator: 'includes',
							value: tag,
						})
				else
					query.push({
						field,
						operator: '==',
						value,
					})
			}

			query = query as Array<Query<Question>>
			const questions = await Questions.find(query)

			response.status(200).send({ questions })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to create a question.
 *
 * @typedef {object} CreateQuestionPayload
 * @property {string} text.required - The question text.
 * @property {array<Option>} options.required - The options to the question.
 * @property {boolean} first.required - Whether this is the first question in the conversation.
 * @property {boolean} last.required - Whether this is the last question in the conversation.
 * @property {boolean} randomizeOptionOrder.required - Whether to randomize the order of the options.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */

/**
 * The response from the create question endpoint.
 *
 * @typedef {object} CreateQuestionResponse
 * @property {Question} question.required - The created question.
 */

/**
 * POST /conversations/{conversationId}/questions
 *
 * @summary Create a question
 * @tags questions
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to create.
 * @param {CreateQuestionPayload} request.body - The necessary details to create a question.
 *
 * @returns {CreateQuestionResponse} 201 - The created question. You must be Groot to create a question.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a question
 * {
 * 	"text": "Some question?",
 * 	"options": [
 * 		{
 * 			"position": 1,
 * 			"type": "select",
 * 			"text": "An Option",
 * 			"attribute": {
 * 				"id": "answered-question",
 * 				"value": 1
 * 			},
 * 		},
 * 	],
 * 	"first": true,
 * 	"last": false,
 * 	"randomizeOptionOrder": true
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/:conversationId/questions',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Questions.context({ conversationId: request.params.conversationId })

			const id = generateId()
			const question = await Questions.create(id, {
				...request.body,
				_conversationId: request.params.conversationId,
				id,
			})

			response.status(201).send({ question })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The response from the retrieve question endpoint.
 *
 * @typedef {object} RetrieveQuestionResponse
 * @property {Question} question.required - The requested question.
 */

/**
 * GET /conversations/{conversationId}/questions/{questionId}
 *
 * @summary Retrieve a requested question
 * @tags questions
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to return.
 * @param {string} questionId.path.required - The ID of the question to return.
 *
 * @returns {RetrieveQuestionResponse} 200 - The requested question. You must be part of a group that is allowed to take the conversation.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:conversationId/questions/:questionId',
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
			Questions.context({ conversationId: request.params.conversationId })

			const question = await Questions.get(request.params.questionId)

			response.status(200).send({ question })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to update a question.
 *
 * @typedef {object} UpdateQuestionPayload
 * @property {string} text.required - The question text.
 * @property {array<Option>} options.required - The options to the question.
 * @property {boolean} first.required - Whether this is the first question in the conversation.
 * @property {boolean} last.required - Whether this is the last question in the conversation.
 * @property {boolean} randomizeOptionOrder.required - Whether to randomize the order of the options.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */

/**
 * The response from the update question endpoint.
 *
 * @typedef {object} UpdateQuestionResponse
 * @property {Question} question.required - The updated question.
 */

/**
 * PUT /conversations/{conversationId}/questions/{questionId}
 *
 * @summary Update a certain question
 * @tags questions
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to update.
 * @param {string} questionId.path.required - The ID of the question to update.
 * @param {UpdateQuestionPayload} request.body.required - The new question.
 *
 * @returns {UpdateQuestionResponse} 200 - The updated question. You must be Groot to update a question.
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
	'/:conversationId/questions/:questionId',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Questions.context({ conversationId: request.params.conversationId })

			const question = await Questions.update(
				request.params.questionId,
				request.body
			)

			response.status(200).send({ question })
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * DELETE /conversations/{conversationId}/questions/{questionId}
 *
 * @summary Delete a certain question
 * @tags questions
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to delete.
 * @param {string} questionId.path.required - The ID of the question to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a question.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:conversationId/questions/:questionId',
	permit('groot'),
	async (
		request: Request,
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			Questions.context({ conversationId: request.params.conversationId })

			await Questions.delete(request.params.questionId)

			response.sendStatus(204)
		} catch (error: unknown) {
			next(error)
		}
	}
)

/**
 * The payload needed to answer a question.
 *
 * @typedef {object} AnswerQuestionPayload
 * @property {number} position.required - The position of the answer selected by the user.
 * @property {string} input - The input provided by the user if the option was of type `input`.
 */

/**
 * The response from the answer question endpoint.
 *
 * @typedef {object} AnswerQuestionResponse
 * @property {Question} nextQuestion - The next question the user should answer.
 */

/**
 * PUT /conversations/{conversationId}/questions/{questionId}/answer
 *
 * @summary Answer a question
 * @tags questions
 *
 * @security bearer
 *
 * @param {AnswerQuestionPayload} request.body.required - The details required for joining a group.
 *
 * @returns {AnswerQuestionResponse} 200 - The next question the user should answer.
 * @returns {ImproperPayloadError} 400 - The payload was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {EntityNotFoundError} 404 - There was no group that can be joined using the passed code.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.put(
	'/:conversationId/questions/:questionId/answer',
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
			Questions.context({
				conversationId: request.params.conversationId,
				clearContextImmediately: false,
			})
			Attributes.context({
				userId: request.user!.id,
				clearContextImmediately: false,
			})

			// Get the question
			const question = await Questions.get(request.params.questionId)

			// Then figure out which option the user picked
			const pickedOption = question.options.find(
				(option) => option.position === request.body.position
			)
			if (!pickedOption) {
				throw new ServerError('entity-not-found', 'Could not find that option.')
			}

			// Get the user's answer
			const answer =
				pickedOption.type === 'select'
					? pickedOption.attribute.value
					: pickedOption.type === 'input'
					? request.body.input ?? '!noinput'
					: '!noinput'

			// Check if the attribute already exists
			let attribute
			try {
				attribute = await Attributes.get(pickedOption.attribute.id)

				// If it does, just update the value
				attribute.value = answer
				// Also update the attribute history
				attribute.history.push({
					observer: 'qa-bot',
					timestamp: new Date(),
					message: {
						in: 'question',
						id: request.params.questionId,
					},
					value: answer,
				})

				// Update the attribute in the database
				await Attributes.update(attribute.id, attribute)
			} catch {
				// Else create a new attribute
				attribute = new Attribute(
					pickedOption.attribute.id,
					answer,
					[],
					request.user!.id
				)

				// Also update the attribute history
				attribute.history.push({
					observer: 'qa-bot',
					timestamp: new Date(),
					message: {
						in: 'question',
						id: request.params.questionId,
					},
					value: answer,
				})

				// Save the attribute in the database
				await Attributes.create(attribute.id, attribute)
			}

			// If there is a next question, return it
			if (pickedOption.nextQuestion) {
				response.status(200).send({
					nextQuestion: await Questions.get(pickedOption.nextQuestion),
				})
			} else {
				response.status(200).send({})
			}

			Questions.conversationId = undefined
			Attributes.userId = undefined
		} catch (error: unknown) {
			next(error)
		}
	}
)

// Export the router
export default endpoint
