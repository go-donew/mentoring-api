// @/providers/auth.ts
// Auth provider - a wrapper around Firebase Auth
// This file can be replaced by a wrapper around another auth service

import Process from 'node:process'

import { getAuth } from 'firebase-admin/auth'
import fetch from 'got'

import User from '../models/user.js'
import ServerError from '../utils/errors.js'
import { AuthProvider, CustomClaims, DecodedToken, Tokens } from '../types.js'

import Users from './data/user.js'

// The auth endpoint to sign in/up users
const signInUpEndpoint =
	Process.env.NODE_ENV === 'production'
		? 'https://identitytoolkit.googleapis.com/v1'
		: `http://${Process.env
				.FIREBASE_AUTH_EMULATOR_HOST!}/identitytoolkit.googleapis.com/v1`
// The endpoint to refresh the bearer token
const tokenExchangeEndpoint =
	Process.env.NODE_ENV === 'production'
		? 'https://securetoken.googleapis.com/v1'
		: `http://${Process.env
				.FIREBASE_AUTH_EMULATOR_HOST!}/securetoken.googleapis.com/v1`
// The API key to use while making calls to the above endpoints
const apiKey =
	Process.env.NODE_ENV === 'production'
		? Process.env.FIREBASE_API_KEY!
		: 'fake-key'

/**
 * The response to expect from the auth endpoints.
 */
type FirebaseAuthApiResponse = {
	idToken: string
	refreshToken: string
	localId: string
	email: string
	displayName: string
}

/**
 * The response to expect from the token endpoint.
 */
type FirebaseTokenApiResponse = {
	id_token: string
	refresh_token: string
}

/**
 * A wrapper around Firebase Auth.
 */
export class FirebaseAuthProvider implements AuthProvider {
	/**
	 * Signs a user up.
	 *
	 * @param {string} name - The user's display name.
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<user: User, tokens: Tokens>} - The user's profile and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'entity-already-exists' | 'too-many-requests' | 'backend-error'
	 *
	 * @async
	 */
	async signUp(
		name: string,
		email: string,
		password: string
	): Promise<{ user: User; tokens: Tokens }> {
		// Make a manual REST API call to sign up the user
		let body: FirebaseAuthApiResponse
		try {
			// Sign up the user via email and password
			body = await fetch({
				method: 'post',
				url: `${signInUpEndpoint}/accounts:signUp`,
				json: {
					email,
					password,
					returnSecureToken: true,
				},
				searchParams: {
					key: apiKey,
				},
			}).json()

			// Also set their display name
			await fetch({
				method: 'post',
				url: `${signInUpEndpoint}/accounts:update`,
				json: {
					idToken: body.idToken,
					displayName: name,
					returnSecureToken: true,
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
		} catch (caughtError: unknown) {
			const { error } = JSON.parse(
				(caughtError as any).response?.body ?? '{"error": {"message": ""}}'
			)
			console.trace(JSON.stringify(error))

			if ((error.message as string).startsWith('EMAIL_EXISTS'))
				throw new ServerError(
					'entity-already-exists',
					'A user with that email address already exists. Please try again with a different email or contact us if you think this is a mistake.'
				)
			if ((error.message as string).startsWith('INVALID_EMAIL'))
				throw new ServerError(
					'improper-payload',
					'The email address passed in the request body was invalid. Please try again with a valid email address.'
				)
			if ((error.message as string).startsWith('WEAK_PASSWORD'))
				throw new ServerError(
					'improper-payload',
					'The password passed in the request body was too weak. Please try again with a longer (> 6 letters) password.'
				)
			if ((error.message as string).startsWith('TOO_MANY_ATTEMPTS_TRY_LATER'))
				throw new ServerError('too-many-requests')

			throw new ServerError('backend-error')
		}

		// The ID token that Firebase Auth returns is also their bearer token for
		// the API endpoints, as well as the refresh token to get a new bearer token
		// once the current one expires
		const { refreshToken: refresh, idToken: bearer } = body
		// We also need to return a user instance
		const user = await Users.create(body.localId, {
			id: body.localId,
			name,
			email,
			lastSignedIn: new Date(),
		})

		// Return them all
		return {
			user,
			tokens: { bearer, refresh },
		}
	}

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
	async signIn(
		email: string,
		password: string
	): Promise<{
		user: User
		tokens: Tokens
	}> {
		// Make a manual REST API call to sign the user in
		let body: FirebaseAuthApiResponse
		try {
			body = await fetch({
				method: 'post',
				url: `${signInUpEndpoint}/accounts:signInWithPassword`,
				json: {
					email,
					password,
					returnSecureToken: true,
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
		} catch (caughtError: unknown) {
			const { error } = JSON.parse(
				(caughtError as any).response?.body ?? '{"error": {"message": ""}}'
			)
			console.trace(JSON.stringify(error))

			if ((error.message as string).startsWith('EMAIL_NOT_FOUND'))
				throw new ServerError(
					'entity-not-found',
					'We could not find a user with that email address. Please check the email address for typos and try again.'
				)
			if ((error.message as string).startsWith('INVALID_PASSWORD'))
				throw new ServerError(
					'incorrect-credentials',
					'The password for that account was incorrect. Please try again with valid credentials.'
				)

			throw new ServerError('backend-error')
		}

		// The ID token that Firebase Auth returns is also their bearer token for
		// the API endpoints. Also return the refresh token so they can get a new
		// bearer token once the current one expires
		const { refreshToken: refresh, idToken: bearer } = body
		// We also need to return a user instance
		const user = await Users.get(body.localId)

		// Return them all
		return {
			user,
			tokens: { bearer, refresh },
		}
	}

	/**
	 * Given a refresh token, returns a new set of tokens for a user.
	 *
	 * @param {string} refreshToken The refresh token returned when signing in/up.
	 *
	 * @returns {Tokens} A new set of tokens for the user.
	 * @throws {ServerError} 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	async refreshTokens(refreshToken: string): Promise<Tokens> {
		// Make a manual REST API call to refresh the token
		let body: FirebaseTokenApiResponse
		try {
			body = await fetch({
				method: 'post',
				url: `${tokenExchangeEndpoint}/token`,
				json: {
					grant_type: 'refresh_token', // eslint-disable-line @typescript-eslint/naming-convention
					refresh_token: refreshToken, // eslint-disable-line @typescript-eslint/naming-convention
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
		} catch (caughtError: unknown) {
			const { error } = JSON.parse(
				(caughtError as any).response?.body ?? '{"error": {"message": ""}}'
			)
			console.trace(JSON.stringify(error))

			if ((error.message as string).startsWith('INVALID_REFRESH_TOKEN'))
				throw new ServerError(
					'improper-payload',
					'The refresh token passed in the request body was invalid. Please try again with a valid refresh token.'
				)
			if ((error.message as string).startsWith('TOKEN_EXPIRED'))
				throw new ServerError(
					'incorrect-credentials',
					'The refresh token passed in the request body had expired. Please sign in to get a new set of tokens instead.'
				)

			throw new ServerError('backend-error')
		}

		// Return the 'rejuvenated' tokens
		return {
			bearer: body.id_token,
			refresh: body.refresh_token,
		}
	}

	/**
	 * Verifies a bearer token.
	 *
	 * @param {string} token The token to verify.
	 *
	 * @returns {DecodedToken} The contents of the bearer token.
	 * @throws {ServerError} 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	async verifyToken(token: string): Promise<DecodedToken> {
		// Verify and decode the bearer token
		try {
			return await getAuth().verifyIdToken(token, true)
		} catch (error: unknown) {
			console.trace(JSON.stringify(error))

			throw new ServerError('invalid-token')
		}
	}

	/**
	 * Retrieve the custom claims set on a user.
	 *
	 * @param {string} userId The ID of the user whose claims to retrieve.
	 *
	 * @returns {CustomClaims} The custom claims set on a user.
	 * @throws {HttpError} 'backend-error'
	 *
	 * @async
	 */
	async retrieveClaims(userId: string): Promise<CustomClaims> {
		let user
		try {
			user = await getAuth().getUser(userId)
		} catch (error: unknown) {
			console.trace(JSON.stringify(error))

			throw new ServerError('backend-error')
		}

		return user.customClaims as CustomClaims
	}
}

// Export a new instance of the auth provider
export const Auth = new FirebaseAuthProvider() // eslint-disable-line @typescript-eslint/naming-convention
