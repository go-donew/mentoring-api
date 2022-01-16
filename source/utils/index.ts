// @/utils/index.ts
// Misc utility functions

import { customAlphabet } from 'nanoid'
import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Generates a random 28 long alphanum ID that matches Firebase's IDs.
 *
 * @returns {string}
 */
export const generateId = customAlphabet(
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
	28
)

/**
 * Catches asynchronous errors thrown in middleware, and forwards them using
 * the `next` function
 *
 * @param fn {RequestHandler} - The request handler for which to handle errors
 *
 * @returns {RequestHandler} - The request handler wrapped with a `.catch` clause
 */
export const handleAsyncErrors =
	(fn: RequestHandler): RequestHandler =>
	async (request: Request, response: Response, next: NextFunction) => {
		try {
			await Promise.resolve(fn(request, response, next)).catch(next)
		} catch (error: unknown) {
			next(error)
		}
	}
