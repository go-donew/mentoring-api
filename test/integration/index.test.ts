// @/integration-tests/index.test.ts
// Tests all APIs

// eslint-disable-next-line import/no-unassigned-import
import '../setup.js'

import { fetch, fetchError } from '../helpers/request.js'
import { testData } from '../helpers/test-data.js'

/**
 * Data to persist throughout the test
 */
const users: { bofh: any; pfy: any; groot: any } = {
	bofh: {},
	pfy: {},
	groot: {},
}
const tokens: { bofh: any; pfy: any; groot: any } = {
	bofh: {},
	pfy: {},
	groot: {},
}
const groups: { bastards: any; interns: any } = {
	bastards: {},
	interns: {},
}

/**
 * Test the authentication endpoints and middleware.
 */
describe('auth', () => {
	describe('post /auth/signup', () => {
		it('should return a `improper-payload` error when an invalid name is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, name: 42 },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `improper-payload` error when an invalid email is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, email: 'weird!addr' },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `improper-payload` error when an invalid password is passed', async () => {
			const data = await testData('auth/signup/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signup',
				json: { ...data, password: { invalid: 'value' } },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `improper-payload` error when a weak password (< 6 letters) is passed', async () => {
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

		it('should return the user and tokens upon a valid request (groot)', async () => {
			const data = await testData('auth/signup/groot')
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

			users.groot = body.user
			tokens.groot = body.tokens

			const {
				body: { idToken, refreshToken },
			} = await fetch({
				method: 'post',
				prefixUrl: 'http://localhost:9099/identitytoolkit.googleapis.com/v1',
				url: `accounts:update`,
				headers: {
					authorization: 'Bearer owner',
				},
				json: {
					localId: users.groot.id,
					displayName: data.name,
					email: data.email,
					password: data.password,
					customAttributes: '{"groot": true}',
				},
			})

			tokens.groot = {
				bearer: idToken,
				refresh: refreshToken,
			}
		})
	})

	describe('post /auth/signin', () => {
		it('should return a `improper-payload` error when an invalid email is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, email: 'weird!addr' },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `improper-payload` error when an invalid password is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, password: { invalid: 'value' } },
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `incorrect-credentials` error when an incorrect password is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, password: 'wrong-password' },
			})

			expect(error?.status).toEqual(401)
			expect(error?.code).toEqual('incorrect-credentials')
		})

		it('should return a `entity-not-found` error when an email for a user that does not exist is passed', async () => {
			const data = await testData('auth/signin/bofh')
			const error = await fetchError({
				method: 'post',
				url: 'auth/signin',
				json: { ...data, email: 'no-one@wreck.all' },
			})

			expect(error?.status).toEqual(404)
			expect(error?.code).toEqual('entity-not-found')
		})

		it('should return the user and tokens upon a valid request', async () => {
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
	})

	describe('post /auth/refresh-token', () => {
		it('should return a `improper-payload` error when an invalid refresh token is passed', async () => {
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

		it('should return a `improper-payload` error when a bearer token is passed instead of a refresh token', async () => {
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

		it('should return a new set of tokens upon a valid request', async () => {
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
	})

	describe('test authn middleware', () => {
		it('should return a `invalid-token` error when a token is not passed', async () => {
			const error = await fetchError({
				method: 'get',
				url: 'pong',
			})

			expect(error?.status).toEqual(401)
			expect(error?.code).toEqual('invalid-token')
		})

		it('should return a `invalid-token` error when an invalid token is passed', async () => {
			const error = await fetchError({
				method: 'get',
				url: 'pong',
				headers: {
					authorization: 'weird!weird!weird',
				},
			})

			expect(error?.status).toEqual(401)
			expect(error?.code).toEqual('invalid-token')
		})

		it('should parse bearer tokens in the `authorization` header with the `Bearer` prefix', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: 'pong',
				headers: {
					authorization: `Bearer ${tokens.bofh.bearer}`,
				},
			})

			expect(body).toBeTruthy()
			expect(status).toEqual(200)
		})

		it('should parse bearer tokens in the `authorization` header without the `Bearer` prefix', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: 'pong',
				headers: {
					authorization: tokens.bofh.bearer,
				},
			})

			expect(body).toBeTruthy()
			expect(status).toEqual(200)
		})
	})
})

/**
 * Test the group endpoints.
 */
describe('groups', () => {
	describe('post /groups', () => {
		it('should return a `improper-payload` error when an invalid name is passed', async () => {
			const data = await testData('groups/create/bastards')
			const error = await fetchError({
				method: 'post',
				url: 'groups',
				json: { ...data, name: { is: 'invalid' } },
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		// FIXME: None of the below validations work
		/*
		it('should return a `improper-payload` error when an invalid participant list is passed', async () => {
			const data = await testData('groups/create/bastards')
			const error = await fetchError({
				method: 'post',
				url: 'groups',
				json: { ...data, participants: { 'The BOFH': ['mentee'] } },
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `improper-payload` error when an invalid conversations list is passed', async () => {
			const data = await testData('groups/create/bastards')
			const error = await fetchError({
				method: 'post',
				url: 'groups',
				json: { ...data, conversations: {},
				reports: {},					authorization: tokens.groot.bearer,
				},
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `improper-payload` error when an invalid reports list is passed', async () => {
			const data = await testData('groups/create/bastards')
			const error = await fetchError({
				method: 'post',
				url: 'groups',
				json: { ...data, reports: { 'quiz-score': 'mentee' } },
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})
		*/

		it('should return a `improper-payload` error when an invalid code is passed', async () => {
			const data = await testData('groups/create/bastards')
			const error = await fetchError({
				method: 'post',
				url: 'groups',
				json: { ...data, code: ['the-bastards', 'sys-admin'] },
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(error?.status).toEqual(400)
			expect(error?.code).toEqual('improper-payload')
		})

		it('should return a `not-allowed` error when the requesting user is not groot', async () => {
			const data = await testData('groups/create/bastards')
			const error = await fetchError({
				method: 'post',
				url: 'groups',
				json: data,
				headers: {
					authorization: tokens.bofh.bearer,
				},
			})

			expect(error?.status).toEqual(403)
			expect(error?.code).toEqual('not-allowed')
		})

		it('should return the created group upon a valid request (bastards)', async () => {
			const data = await testData('groups/create/bastards', {
				bofh: users.bofh.id,
			})
			const { body, status } = await fetch({
				method: 'post',
				url: 'groups',
				json: data,
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(status).toEqual(201)
			expect(body.group).toMatchShapeOf({
				id: 'string',
				name: 'string',
				participants: {
					[users.bofh.id]: 'supermentor',
				},
				conversations: {},
				reports: {},
				code: 'string',
			})

			groups.bastards = body.group
		})

		it('should return the created group upon a valid request (interns)', async () => {
			const data = await testData('groups/create/interns', {
				bofh: users.bofh.id,
				pfy: users.pfy.id,
			})
			const { body, status } = await fetch({
				method: 'post',
				url: 'groups',
				json: data,
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(status).toEqual(201)
			expect(body.group).toMatchShapeOf({
				id: 'string',
				name: 'string',
				participants: {
					[users.bofh.id]: 'supermentor',
					[users.pfy.id]: 'mentee',
				},
				conversations: {},
				reports: {},
				code: 'string',
			})

			groups.interns = body.group
		})
	})

	describe('get /groups', () => {
		it('should return all groups if the requesting user is groot', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: 'groups',
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(status).toEqual(200)
			expect(body.groups.length).toEqual(2)
			expect(body.groups).toMatchShapeOf([
				{
					id: 'string',
					name: 'string',
					participants: {},
					conversations: {},
					reports: {},
					code: 'string',
				},
			])
		})

		it('should only list groups the requesting user is a part of upon a valid request', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: 'groups',
				headers: {
					authorization: tokens.pfy.bearer,
				},
			})

			expect(status).toEqual(200)
			expect(body.groups.length).toEqual(1)
			expect(body.groups).toMatchShapeOf([
				{
					id: 'string',
					name: 'string',
					participants: {},
					conversations: {},
					reports: {},
					code: 'string',
				},
			])
		})
	})

	describe('get /groups/{groupId}', () => {
		it('should return a `entity-not-found` error when the requested group is not found', async () => {
			const error = await fetchError({
				method: 'get',
				url: 'groups/weird',
				headers: {
					authorization: tokens.bofh.bearer,
				},
			})

			expect(error?.status).toEqual(404)
			expect(error?.code).toEqual('entity-not-found')
		})

		it('should return a `not-allowed` error when the requesting user is not a part of the requested group', async () => {
			const error = await fetchError({
				method: 'get',
				url: `groups/${groups.bastards.id}`,
				headers: {
					authorization: tokens.pfy.bearer,
				},
			})

			expect(error?.status).toEqual(403)
			expect(error?.code).toEqual('not-allowed')
		})

		it('should return the requested group when requesting user is a part of the group', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: `groups/${groups.interns.id}`,
				headers: {
					authorization: tokens.pfy.bearer,
				},
			})

			expect(status).toEqual(200)
			expect(body.group).toMatchShapeOf({
				id: 'string',
				name: 'string',
				participants: {
					[users.pfy.id]: 'mentee',
				},
				conversations: {},
				reports: {},
				code: 'string',
			})
		})

		it('should return the requested group when requesting user is groot', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: `groups/${groups.interns.id}`,
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(status).toEqual(200)
			expect(body.group).toMatchShapeOf({
				id: 'string',
				name: 'string',
				participants: {
					[users.pfy.id]: 'mentee',
				},
				conversations: {},
				reports: {},
				code: 'string',
			})
		})
	})
})

/**
 * Test the user profile endpoints.
 */
describe('users', () => {
	describe('get /users', () => {
		it('should return a `not-allowed` error when the client is not groot', async () => {
			const error = await fetchError({
				method: 'get',
				url: 'users',
				headers: {
					authorization: tokens.pfy.bearer,
				},
			})

			expect(error?.status).toEqual(403)
			expect(error?.code).toEqual('not-allowed')
		})

		it('should return a list of users upon a valid request', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: 'users',
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(status).toEqual(200)
			expect(body.users.length).toEqual(3)
			expect(body.users).toMatchShapeOf([
				{
					id: 'string',
					name: 'string',
					email: 'string',
					phone: undefined,
					lastSignedIn: 'string',
				},
			])
		})
	})

	describe('get /users/{userId}', () => {
		it('should return a `not-allowed` error when the requested user is not found but the requesting user is not groot', async () => {
			const error = await fetchError({
				method: 'get',
				url: 'users/weird',
				headers: {
					authorization: tokens.bofh.bearer,
				},
			})

			expect(error?.status).toEqual(403)
			expect(error?.code).toEqual('not-allowed')
		})

		it('should return a `not-allowed` error when the requesting user is not a mentor/supermentor of the requested user', async () => {
			const error = await fetchError({
				method: 'get',
				url: `users/${users.bofh.id}`,
				headers: {
					authorization: tokens.pfy.bearer,
				},
			})

			expect(error?.status).toEqual(403)
			expect(error?.code).toEqual('not-allowed')
		})

		it('should return a `entity-not-found` error when the requested user is not found but the requesting user is groot', async () => {
			const error = await fetchError({
				method: 'get',
				url: 'users/weird',
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(error?.status).toEqual(404)
			expect(error?.code).toEqual('entity-not-found')
		})

		it('should return the requested user when requesting user is groot', async () => {
			const { body, status } = await fetch({
				method: 'get',
				url: `users/${users.bofh.id}`,
				headers: {
					authorization: tokens.groot.bearer,
				},
			})

			expect(status).toEqual(200)
			expect(body.user).toMatchShapeOf({
				id: 'string',
				name: 'string',
				email: 'string',
				phone: undefined,
				lastSignedIn: 'string',
			})
		})

		// TODO: Add test for when one user is mentor/supermentor of another
	})
})
