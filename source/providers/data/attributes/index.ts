// @/providers/data/attribute.ts
// Retrieves, creates, updates and deletes attributes in Firebase.

import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import type { FirebaseError } from 'firebase-admin'

import { Attribute } from '@/models/attribute'
import { ServerError } from '@/errors'
import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class AttributeProvider implements DataProvider<Attribute> {
	/**
	 * Lists/searches through all attributes.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the attributes.
	 *
	 * @returns {Attribute[]} - Array of attributes matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Attribute>>): Promise<Attribute[]> {
		// Build the query
		const attributesRef = getFirestore().collection('attributes')
		let foundAttributes = attributesRef.orderBy('name')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			foundAttributes = foundAttributes.where(field, operator, value)
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
			attributes.push(plainToInstance(Attribute, data, { excludePrefixes: ['__'] }))
		}

		return attributes
	}

	/**
	 * Retrieves a attribute from the database.
	 *
	 * @param {string} id - The ID of the attribute to retrieve.
	 *
	 * @returns {Attribute} - The requested attribute.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Attribute> {
		// Fetch the attribute from Firestore
		let doc
		try {
			doc = await getFirestore().collection('attributes').doc(id).get()
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

		// Convert the document retrieved into an instance of a `Attribute` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Attribute` class
		return plainToInstance(Attribute, data, { excludePrefixes: ['__'] })
	}

	/**
	 * Stores a attribute in the database.
	 *
	 * @param {Attribute} data - The data to store in the attribute.
	 *
	 * @returns {Attribute} - The created attribute.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Attribute): Promise<Attribute> {
		// Convert the `Attribute` instance to a firebase document and save it
		try {
			// Check if the document exists
			const attributeDocument = await getFirestore()
				.collection('attributes')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (attributeDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedAttribute = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedAttribute.__conversations = {}
			serializedAttribute.__tags = {}
			for (const conversation of Object.keys(serializedAttribute.conversations))
				serializedAttribute.__conversations[conversation] = true
			for (const tag of Object.keys(serializedAttribute.tags))
				serializedAttribute.__tags[tag] = true
			// Add the data into the database
			await getFirestore().collection('attributes').doc(data.id).set(serializedAttribute)

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
	 * @param {Partial<Attribute>} data - A list of properties to update and the value to set.
	 *
	 * @returns {Attribute} - The updated attribute.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Attribute>): Promise<Attribute> {
		// Update given fields for the attribute in Firestore
		try {
			// First retrieve the attribute
			const existingAttributeDoc = await getFirestore()
				.collection('attributes')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingAttributeDoc.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			const serializedAttribute = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedAttribute.__conversations = {}
			serializedAttribute.__tags = {}
			for (const conversation of Object.keys(serializedAttribute.conversations))
				serializedAttribute.__conversations[conversation] = true
			for (const tag of Object.keys(serializedAttribute.tags))
				serializedAttribute.__tags[tag] = true
			// Merge the data with the existing data in the database
			await getFirestore()
				.collection('attributes')
				.doc(data.id!)
				.set(serializedAttribute, { merge: true })

			// If the transaction was successful, return the updated attribute
			return plainToInstance(
				Attribute,
				{
					...existingAttributeDoc.data(),
					...data,
				},
				{ excludePrefixes: ['__'] }
			)
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Deletes a attribute in the database.
	 *
	 * @param {string} id - The ID of the attribute to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await getFirestore().collection('attributes').doc(id).delete()
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

export const provider = new AttributeProvider()
