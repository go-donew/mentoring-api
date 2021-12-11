// @/providers/data/user.ts
// Retrieves, creates, updates and deletes users in Firebase.

import { FirebaseError } from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'

import ServerError from '../../utils/errors.js'
import User from '../../models/user.js'
import { Query, DataProvider } from '../../types.js'

/**
 * A interface that a data provider must implement.
 */
class UserProvider implements DataProvider<User> {
	/**
	 * Lists/searches through all users.
	 *
	 * @param {Array<Query>} queries A list of queries to filter the users.
	 *
	 * @returns {User[]} Array of users matching the query.
	 * @throws {HttpError} 'backend-error'
	 */
	async find(queries: Array<Query<User>>): Promise<User[]> {
		// Build the query
		const usersQuery = getFirestore().collection('users')
		for (const query of queries) {
			usersQuery.where(query.field, query.operator, query.value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await usersQuery.get())
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `User` class
		const users = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			if (!doc.exists) {
				continue
			}

			// Convert the `lastSignedIn` field from a `Timestamp` to a `Date`
			const data = doc.data()
			data.lastSignedIn = data.lastSignedIn.toDate()

			// Add it to the array
			users.push(plainToInstance(User, data))
		}

		return users
	}

	/**
	 * Retrieves a user from the database.
	 *
	 * @param {string} id The ID of the user to retrieve.
	 *
	 * @returns {User} The requested user.
	 * @throws {HttpError} 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<User> {
		// Fetch the user from Firestore
		let doc
		try {
			doc = await getFirestore().collection('users').doc(id).get()
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				console.trace(JSON.stringify(error))
				throw new ServerError('backend-error')
			}
		}

		// Convert the document retrieved into an instance of a `User` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Convert the `lastSignedIn` field from a `Timestamp` to a `Date`
		data.lastSignedIn = data.lastSignedIn.toDate()

		// Return the object as an instance of the `User` class
		return plainToInstance(User, data)
	}

	/**
	 * Stores a user in the database.
	 *
	 * @param {string} id The ID of the user to create.
	 * @param {User} data The data to store in the user.
	 *
	 * @returns {User} The created user.
	 * @throws {HttpError} 'already-exists' | 'backend-error'
	 */
	async create(id: string, data: User): Promise<User> {
		// Convert the `User` instance to a firebase document and save it
		try {
			// Check if the document exists
			const userDocument = getFirestore().collection('users').doc(id)
			const existingUser = await userDocument.get()

			// If it does, then return an 'already-exists' error
			if (existingUser.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedUser = instanceToPlain(data)
			await getFirestore().collection('users').doc(id).set(serializedUser)

			// If the transaction was successful, return the created user
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a user in the database.
	 *
	 * @param {string} id The ID of the user to update.
	 * @param {string} data A list of properties to update and the value to set.
	 *
	 * @returns {User} The updated user.
	 * @throws {HttpError} 'not-found' | 'backend-error'
	 */
	async update(id: string, data: Partial<User>): Promise<User> {
		// Update given fields for the user in Firestore
		try {
			let existingUser
			await getFirestore().runTransaction(async (transaction) => {
				// Check if the document exists
				const userDocument = getFirestore().collection('users').doc(id)
				existingUser = await transaction.get(userDocument)

				// If it does not, then return a 'not-found' error
				if (existingUser.exists) {
					existingUser = existingUser.data()
				} else {
					throw new ServerError('entity-not-found')
				}

				// Else insert away!
				await userDocument.set(instanceToPlain(data), { merge: true })
			})

			// If the transaction was successfull, return the updated user
			return plainToInstance(User, {
				existingUser,
				...data,
			})
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Deletes a user in the database.
	 *
	 * @param {string} id The ID of the user to delete.
	 *
	 * @returns {void}
	 * @throws {HttpError} 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await getFirestore().collection('users').doc(id).delete()
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				console.trace(JSON.stringify(error))
				throw new ServerError('backend-error')
			}
		}
	}
}

export default new UserProvider()
