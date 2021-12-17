// @/types.ts
// Types for the server!

import User from './models/user.js'
import ServerError, { ErrorCode } from './utils/errors.js'

// Extend Express' types
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			/**
			 * The request ID.
			 */
			id: string

			/**
			 * The user making the request.
			 */
			user?: User & {
				isGroot: boolean
				token: string
			}
		}

		interface Response {
			/**
			 * Send an error back to the client.
			 */
			sendError: (error: ErrorCode | ServerError) => void
		}
	}
}

// Route definitions for `/ping` and `/pong`
/**
 * GET /ping
 *
 * @summary Check if server is ready to accept connections
 *
 * @returns {string} 200 - A message
 *
 * @endpoint
 */
/**
 * GET /pong
 *
 * @summary Check if your authentication token is valid
 *
 * @security bearer
 *
 * @returns {string} 200 - A message
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 *
 * @endpoint
 */

/**
 * List of participants in a group.
 *
 * @typedef {object} ParticipantList
 * @property {string} userId.required - The participating user's ID and their role in the group. - enum:mentee,mentor,supermentor
 */
export declare type ParticipantList = Record<
	string,
	'mentee' | 'mentor' | 'supermentor'
>

/**
 * List of conversations the group's participants are allowed to take part in.
 *
 * @typedef {object} ConversationsList
 * @property {string} conversationId.required - The conversation ID and which roles in the group are allowed to take part in it. - enum:mentee,mentor,supermentor
 */
export declare type ConversationsList = Record<
	string,
	'mentee' | 'mentor' | 'supermentor'
>

/**
 * List of reports the group's participants can view.
 *
 * @typedef {object} ReportsList
 * @property {string} reportId.required - The report ID and which roles in the group are allowed to view it. - enum:mentee,mentor,supermentor
 */
export declare type ReportsList = Record<
	string,
	'mentee' | 'mentor' | 'supermentor'
>

/**
 * The bearer token and refresh token set returned when a user signs in/up or
 * refreshes the token set.
 *
 * @typedef {object} Tokens
 * @property {string} bearer.required - The user's bearer token that must be passed in the `Authorization` header of subsequent requests.
 * @property {string} refresh.required - The refresh token used to retrieve a new set of tokens when the current set expires.
 */
export declare type Tokens = {
	/**
	 * The user's bearer token. Must be passed in the `Authorization` header in
	 * all requests.
	 *
	 * @type {string}
	 */
	bearer: string

	/**
	 * The user's refresh token. Used to retrieve a new set of tokens from the
	 * server if the bearer token expires.
	 *
	 * @type {string}
	 */
	refresh: string
}

/**
 * The contents of a bearer token.
 */
export declare type DecodedToken = {
	/**
	 * The user's ID.
	 *
	 * @type {string}
	 */
	sub: string
}

/**
 * The custom claims set on a user.
 */
export declare type CustomClaims = {
	/**
	 * Whether the user is `groot` (super-duper admin).
	 *
	 * @type {boolean}
	 */
	groot: boolean
}

/**
 * A query on a entity.
 */
export declare type Query<T> = {
	/**
	 * The field name.
	 *
	 * @type {keyof T}
	 */
	field: keyof T

	/**
	 * The query operator. Can be one of the following:
	 *
	 * - '=='
	 * - '!='
	 * - '>'
	 * - '<'
	 * - '>='
	 * - '<='
	 *
	 * @type {string}
	 */
	operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'includes'

	/**
	 * The value the field should be equal to, not equal to, etc.
	 *
	 * @type {T[keyof T]}
	 */
	value: T[keyof T]
}

/**
 * A interface that an authentication provider must implement.
 */
export declare interface AuthProvider {
	/**
	 * Signs a user up.
	 *
	 * @param {string} name - The user's display name.
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<user: User, tokens: Tokens>} - The user's profile and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'already-exists' | 'too-many-requests' | 'backend-error'
	 *
	 * @async
	 */
	signUp(
		name: string,
		email: string,
		password: string
	): Promise<{ user: User; tokens: Tokens }>

	/**
	 * Signs a user into their account.
	 *
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<user: User, tokens: Tokens>} - The user's profile and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'incorrect-credentials' | 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	signIn(
		email: string,
		password: string
	): Promise<{ user: User; tokens: Tokens }>

	/**
	 * Given a refresh token, returns a new set of tokens for a user.
	 *
	 * @param {string} refreshToken - The refresh token returned when signing in/up.
	 *
	 * @returns {Tokens} - A new set of tokens for the user.
	 * @throws {ServerError} - 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	refreshTokens(refreshToken: string): Promise<Tokens>

	/**
	 * Verifies a bearer token.
	 *
	 * @param {string} token - The token to verify.
	 *
	 * @returns {DecodedToken} - The contents of the bearer token.
	 * @throws {ServerError} - 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	verifyToken(token: string): Promise<DecodedToken>

	/**
	 * Retrieve the custom claims set on a user.
	 *
	 * @param {string} userId - The ID of the user whose claims to retrieve.
	 *
	 * @returns {CustomClaims} - The custom claims set on a user.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	retrieveClaims(userId: string): Promise<CustomClaims>
}

/**
 * A interface that a data provider must implement.
 */
export declare interface DataProvider<T> {
	/**
	 * Lists/searches through all entities.
	 *
	 * @param {Array<Query query>} - A list of queries to filter the entities.
	 *
	 * @returns {T[]} - Array of entities matchin the query.
	 * @throws {ServerError} - 'backend-error'
	 *
	 * @async
	 */
	find(queries: Array<Query<T>>): Promise<T[]>

	/**
	 * Retrieves an entity from the database.
	 *
	 * @param {string} id - The ID of the entity to retrieve.
	 *
	 * @returns {T} - The requested entity.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	get(id: string): Promise<T>

	/**
	 * Stores an entity in the database.
	 *
	 * @param {string} id - The ID of the entity to create.
	 * @param {T} data - The data to store in the entity.
	 *
	 * @returns {T} - The created entity.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 *
	 * @async
	 */
	create(id: string, data: T): Promise<T>

	/**
	 * Updates an entity in the database.
	 *
	 * @param {string} id - The ID of the entity to update.
	 * @param {string} data - A list of properties to update and the value to set.
	 *
	 * @returns {T} - The updated entity.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	update(id: string, data: Partial<T>): Promise<T>

	/**
	 * Deletes an entity in the database.
	 *
	 * @param {string} id - The ID of the entity to delete.
	 *
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	delete(id: string): Promise<void>
}
