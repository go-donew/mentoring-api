// @/middleware/authorization.ts
// Middleware that checks if a user is authorized to make a request

import { Request, RequestHandler, Response, NextFunction } from 'express'

import Group from '../models/group.js'
import Groups from '../providers/data/groups.js'
import ServerError from '../utils/errors.js'
import { handleAsyncErrors } from '../utils/index.js'
import { AuthorizationContext } from '../types.js'

/**
 * Ensure that a user making a request is authorized to do so.
 *
 * @param {AuthorizationContext} context - This tells the middleware what kind of data is the endpoint returns, and who should be able to access it.
 *
 * @returns {RequestHandler} - The authorization middleware.
 * @throws {ServerError} - 'not-allowed'
 */
const permit = (context: AuthorizationContext): RequestHandler =>
	handleAsyncErrors(
		async (
			request: Request,
			response: Response,
			next: NextFunction
		): Promise<void> => {
			// Make sure the user exists
			if (!request.user) {
				throw new ServerError('invalid-token')
			}

			// Retrieve the user's custom claims and check if groot is present and
			// set to true
			if (request.user.isGroot) {
				// If so, let them access any endpoint
				next()
				return
			}

			// In this context, only groot can access the endpoint
			if (context === 'groot') {
				// If the client is groot, then we have already let them through in the
				// previous check
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a user
			if (context.subject === 'user') {
				// Allow the client to do this if they match the roles provided
				// - self => the client is the user themselves
				// - <role> => the client is a <role> in a group with the user
				for (const role of context.roles) {
					if (role === 'self') {
						if (request.params.userId === request.user.id) {
							next()
							return
						}

						continue
					}

					// Query the database and check if:
					// - the client is part of a group with the user
					// - in that group, the client is a mentor/supermentor of the user
					const groups = await Groups.find([
						{
							field: `participants`,
							operator: 'includes',
							value: request.params.userId,
						},
						{
							field: `participants`,
							operator: 'includes',
							value: request.user.id,
						},
					])

					// If any such group exists, then let them through
					if (
						groups.some(
							(group) => group.participants[request.user!.id] === role
						)
					) {
						next()
						return
					}
				}

				// If the client matches none of the above roles, return a 403
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a group
			if (context.subject === 'group') {
				// Allow the client to do this if they match the roles provided
				// - participant => the client is a part of the group (any role)
				// - <role> => the client is a <role> in the group
				for (const role of context.roles) {
					// Query the database and check if:
					// - the client is part of the group and is a participant, mentor or supermentor

					// First fetch the group
					const group = await Group.fromGroupId(request.params.groupId)

					// Check the client's role in the group
					if (
						role === 'participant' && // The client just needs to be part of the group
						Object.keys(group.participants).includes(request.user.id)
					) {
						next()
						return
					}

					// Else the client needs to be a <role> in the group
					if (group.participants[request.user.id] === role) {
						next()
						return
					}
				}

				// If the client matches none of the above roles, return a 403
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a conversation
			if (context.subject === 'conversation') {
				// Query the database and check if the client is part of a group and that
				// the group members are allowed to take part in the conversation
				const groups = await Groups.find([
					{
						field: 'participants',
						operator: 'includes',
						value: request.user.id,
					},
					{
						field: 'conversations',
						operator: 'includes',
						value: request.params.conversationId,
					},
				])

				// Within a group, it is possible to restrict the ability to take part
				// in a conversation to certain roles. Check if the user has the correct
				// role to take part in the conversation
				if (
					groups.some((group) =>
						group.conversations[request.params.conversationId].includes(
							group.participants[request.user!.id]
						)
					)
				) {
					next()
					return
				}

				// If the client matches none of the above roles, return a 403
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a report
			if (context.subject === 'report') {
				// Query the database and check if the client is part of a group and that
				// the group members are allowed to view the report
				const groups = await Groups.find([
					{
						field: `participants`,
						operator: 'includes',
						value: request.params.userId,
					},
					{
						field: `participants`,
						operator: 'includes',
						value: request.user.id,
					},
					{
						field: 'reports',
						operator: 'includes',
						value: request.params.reportType,
					},
				])

				// Within a group, it is possible to restrict the ability to view the
				// report to certain roles. Check if the user has the correct role to
				// view the report
				if (
					groups.some((group) =>
						group.reports[request.params.reportType].includes(
							group.participants[request.user!.id]
						)
					)
				) {
					next()
					return
				}

				// If the client matches none of the above roles, return a 403
				response.sendError('not-allowed')
				return
			}

			// To be safe, if somehow none of the above conditions match, err on the
			// side of safety/caution and return a 403
			response.sendError('not-allowed')
		}
	)

export default permit
