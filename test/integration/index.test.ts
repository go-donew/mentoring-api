// @/integration-tests/index.test.ts
// Tests all APIs

import { fetch, fetchError } from '../helpers/request.js'
import { testData } from '../helpers/test-data.js'

// Typpeesssscccrriipppppttttttt
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		interface Matchers<R, T> {
			toMatchShapeOf(expected: any): R
			toMatchOneOf(expected: any[]): R
		}
	}
}

// Data to persist throughout the test
const users: { bofh: any; pfy: any } = { bofh: {}, pfy: {} }
const tokens: { bofh: any; pfy: any } = { bofh: {}, pfy: {} }

/**
 * Test the authentication endpoints.
 */
describe('auth', () => {
	describe('post /auth/signup', () => {
		it('should return an `improper-payload` error when an invalid name is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, name: 42 },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return an `improper-payload` error when an invalid email is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, email: 'weird!addr' },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return an `improper-payload` error when an invalid password is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, password: { invalid: 'value' } },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return an `improper-payload` error when a weak password (< 6 letters) is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, password: 'abcde' },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return the user and tokens upon a valid request (bofh)', async () => {
			const data = await testData('auth/signup/bofh')
			const { body, status } = await fetch({
				method: 'post',
				url: 'auth/signup',
				json: data,
			})

			expect(status).toEqual(201)
			expect(body).toMatchShapeOf({
				user: {
					id: 'string',
					name: 'string',
					email: 'string',
					phone: undefined,
					lastSignedIn: 'string',
				},
				tokens: {
					bearer: 'string',
					refresh: 'string',
				},
			})

			users.bofh = body.user
			tokens.bofh = body.tokens
		})

		it('should return the user and tokens upon a valid request (pfy)', async () => {
			const data = await testData('auth/signup/pfy')
			const { body, status } = await fetch({
				method: 'post',
				url: 'auth/signup',
				json: data,
			})

			expect(status).toEqual(201)
			expect(body).toMatchShapeOf({
				user: {
					id: 'string',
					name: 'string',
					email: 'string',
					phone: undefined,
					lastSignedIn: 'string',
				},
				tokens: {
					bearer: 'string',
					refresh: 'string',
				},
			})

			users.pfy = body.user
			tokens.pfy = body.tokens
		})
	})

	describe('post /auth/signin', () => {
		it('should return an `improper-payload` error when an invalid email is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, email: 'weird!addr' },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return an `improper-payload` error when an invalid password is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, password: { invalid: 'value' } },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return an `incorrect-credentials` error when an incorrect password is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, password: 'wrong-password' },
			})

			expect(error?.status).toEqual(401)
			expect(error?.code).toEqual('incorrect-credentials')
		})

		it('should return an `entity-not-found` error when an email for a user that does not exist is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, email: 'no-one@wreck.all' },
			})

			expect(error?.status).toEqual(404)
			expect(error?.code).toEqual('entity-not-found')
		})

		it('should return the user and tokens upon a valid request (bofh)', async () => {
			const data = await testData('auth/signin/bofh')
			const { body, status } = await fetch({
				method: 'post',
				url: 'auth/signin',
				json: data,
			})

			expect(status).toEqual(200)
			expect(body).toMatchShapeOf({
				user: {
					id: 'string',
					name: 'string',
					email: 'string',
					phone: undefined,
					lastSignedIn: 'string',
				},
				tokens: {
					bearer: 'string',
					refresh: 'string',
				},
			})

			users.bofh = body.user
			tokens.bofh = body.tokens
		})

		it('should return the user and tokens upon a valid request (pfy)', async () => {
			const data = await testData('auth/signin/bofh')
			const { body, status } = await fetch({
				method: 'post',
				url: 'auth/signin',
				json: data,
			})

			expect(status).toEqual(200)
			expect(body).toMatchShapeOf({
				user: {
					id: 'string',
					name: 'string',
					email: 'string',
					phone: undefined,
					lastSignedIn: 'string',
				},
				tokens: {
					bearer: 'string',
					refresh: 'string',
				},
			})

			users.pfy = body.user
			tokens.pfy = body.tokens
		})
	})

	describe('post /auth/refresh-token', () => {
		it('should return an `improper-payload` error when an invalid refresh token is passed', async () => {
			const data = await testData('auth/refresh-token/bofh', {
				refreshToken: tokens.bofh.refresh,
			})
			const error = await fetchError({
				method: 'post',
				url: 'auth/refresh-token',
				json: { ...data, refreshToken: 'weird!stuff' },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return an `improper-payload` error when a bearer token is passed instead of a refresh token', async () => {
			const data = await testData('auth/refresh-token/bofh', {
				refreshToken: tokens.bofh.refresh,
			})
			const error = await fetchError({
				method: 'post',
				url: 'auth/refresh-token',
				json: { ...data, refreshToken: tokens.bofh.bearer },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a new set of tokens upon a valid request (bofh)', async () => {
			const data = await testData('auth/refresh-token/bofh', {
				refreshToken: tokens.bofh.refresh,
			})
			const { body, status } = await fetch({
				method: 'post',
				url: 'auth/refresh-token',
				json: data,
			})

			expect(status).toEqual(200)
			expect(body).toMatchShapeOf({
				tokens: {
					bearer: 'string',
					refresh: 'string',
				},
			})

			tokens.bofh = body.tokens
		})

		it('should return a new set of tokens upon a valid request (pfy)', async () => {
			const data = await testData('auth/refresh-token/pfy', {
				refreshToken: tokens.pfy.refresh,
			})
			const { body, status } = await fetch({
				method: 'post',
				url: 'auth/refresh-token',
				json: data,
			})

			expect(status).toEqual(200)
			expect(body).toMatchShapeOf({
				tokens: {
					bearer: 'string',
					refresh: 'string',
				},
			})

			tokens.pfy = body.tokens
		})
	})
})
