// @/providers/data/attributes.ts
// Retrieves, creates, updates and deletes a user's attributes in Firebase.

import { FirebaseError } from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'

import ServerError from '../../utils/errors.js'
import Attribute from '../../models/attribute.js'
import { Query, DataProvider } from '../../types.js'

/**
 * A interface that a data provider must implement.
 */
class AttributeProvider implements DataProvider<Attribute> {
	userId?: string
	clearContextImmediately?: boolean

	/**
	 * Attributes are specific to a certain user. The `context` function allows
	 * the caller to specify the user whose attributes they wish to list/create
	 * /modify/delete.
	 */
	context(options: {
		userId: string
		clearContextImmediately?: boolean
	}): void {
		this.userId = options.userId
		this.clearContextImmediately = options.clearContextImmediately ?? true
	}

	/**
	 * Lists/searches through all attributes.
	 *
	 * @param {Array<Query>} queries A list of queries to filter the attributes.
	 *
	 * @returns {Attribute[]} Array of attributes matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Attribute>>): Promise<Attribute[]> {
		if (!this.userId)
			throw new Error(
				'Finding an attribute can only be done for a certain user.'
			)

		// Build the query
		const attributesRef = getFirestore()
			.collection('users')
			.doc(this.userId)
			.collection('attributes')
		let foundAttributes = attributesRef.orderBy('id')
		for (const query of queries) {
			foundAttributes = foundAttributes.where(
				query.field as string,
				query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>',
				query.value as any
			)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundAttributes.get())
		} catch (error: unknown) {
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Attribute` class
		const attributes = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			for (const snapshot of data.history)
				snapshot.timestamp = new Date(snapshot.timestamp._nanoseconds)

			attributes.push(
				plainToInstance(Attribute, data, { excludePrefixes: ['__'] })
			)
		}

		if (this.clearContextImmediately) this.userId = undefined

		return attributes
	}

	/**
	 * Retrieves a attribute from the database.
	 *
	 * @param {string} id The ID of the attribute to retrieve.
	 *
	 * @returns {Attribute} The requested attribute.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Attribute> {
		if (!this.userId)
			throw new Error(
				'Retrieving an attribute can only be done for a certain user.'
			)

		// Fetch the attribute from Firestore
		let doc
		try {
			doc = await getFirestore()
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.get()
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

		// If the document does not exist, skip it
		const data = doc.data()
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Convert the document retrieved into an instance of a `Attribute` class
		for (const snapshot of data.history)
			snapshot.timestamp = new Date(snapshot.timestamp._nanoseconds)

		if (this.clearContextImmediately) this.userId = undefined

		// Return the object as an instance of the `Attribute` class
		return plainToInstance(Attribute, data, { excludePrefixes: ['__'] })
	}

	/**
	 * Stores a attribute in the database.
	 *
	 * @param {string} id The ID of the attribute to create.
	 * @param {Attribute} data The data to store in the attribute.
	 *
	 * @returns {Attribute} The created attribute.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(id: string, data: Attribute): Promise<Attribute> {
		if (!this.userId)
			throw new Error(
				'Creating an attribute can only be done for a certain user.'
			)

		// Convert the `Attribute` instance to a firebase document and save it
		try {
			// Check if the document exists
			const attributeDocument = await getFirestore()
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.get()

			// If it does, then return an 'already-exists' error
			if (attributeDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedAttribute = instanceToPlain(data)
			// Add the data into the database
			await getFirestore()
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.set(serializedAttribute)

			if (this.clearContextImmediately) this.userId = undefined

			// If the transaction was successful, return the created attribute
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a attribute in the database.
	 *
	 * @param {string} id The ID of the attribute to update.
	 * @param {Partial<Attribute>} data A list of properties to update and the value to set.
	 *
	 * @returns {Attribute} The updated attribute.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(id: string, data: Partial<Attribute>): Promise<Attribute> {
		if (!this.userId)
			throw new Error(
				'Updating an attribute can only be done for a certain user.'
			)

		// Update given fields for the attribute in Firestore
		try {
			// First retrieve the attribute
			const existingAttributeDoc = await getFirestore()
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.get()

			// If it does not exist, then return a 'not-found' error
			const existingData = existingAttributeDoc.data()
			if (!existingAttributeDoc.exists || !existingData) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			for (const snapshot of existingData.history)
				snapshot.timestamp = new Date(snapshot.timestamp._nanoseconds)
			const serializedAttribute = instanceToPlain({
				...existingData,
				...data,
				history: [...existingData.history, ...(data.history ?? [])],
			})
			// Merge the data with the existing data in the database
			await getFirestore()
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.set(serializedAttribute, { merge: true })

			if (this.clearContextImmediately) this.userId = undefined

			// If the transaction was successful, return the updated attribute
			return plainToInstance(Attribute, serializedAttribute, {
				excludePrefixes: ['__'],
			})
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Deletes a attribute in the database.
	 *
	 * @param {string} id The ID of the attribute to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		if (!this.userId)
			throw new Error(
				'Deleting an attribute can only be done for a certain user.'
			)

		// Delete the document
		try {
			await getFirestore()
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.delete()

			if (this.clearContextImmediately) this.userId = undefined
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

export default new AttributeProvider()
