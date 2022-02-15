// @/providers/firebase/data/attribute.ts
// Retrieves, creates, updates and deletes attributes in Firebase.

import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import type { FirebaseError } from 'firebase-admin'

import { Attribute } from '@/models/attribute'
import { ServerError } from '@/errors'
import { logger, stringify } from '@/utilities/logger'
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
		logger.info('finding attribute by query')

		// Build the query
		logger.silly('parsing query - %s', stringify(queries))
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

			logger.silly('parsed condition - %s %s %s', field, operator, value)

			foundAttributes = foundAttributes.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			logger.silly('calling get on query ref')
			;({ docs } = await foundAttributes.get())
			logger.silly('received docs from firestore')
		} catch (error: unknown) {
			logger.warn('received error while querying docs - %s', stringify(error))
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Attribute` class
		logger.silly('parsing firestore docs')
		const attributes = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				logger.silly('received empty doc - discarding')
				continue
			}

			// Add it to the array
			attributes.push(plainToInstance(Attribute, data, { excludePrefixes: ['__'] }))

			logger.silly('succesfully parsed a doc')
		}

		logger.info('returning list of found attributes')
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
		logger.info('fetching attribute %s', id)
		let doc
		try {
			logger.silly('calling get on ref')
			doc = await getFirestore().collection('attributes').doc(id).get()
			logger.silly('received doc from firestore')
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError

			logger.info(
				'received error while fetching attribute from firestore - %s',
				stringify(error)
			)
			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				logger.warn('received error while creating attribute - %s', stringify(error))
				throw new ServerError('backend-error')
			}
		}

		// Convert the document retrieved into an instance of a `Attribute` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			logger.info('received empty doc - returning entity-not-found error')

			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Attribute` class
		logger.info('fetched attribute succesfully')
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
		logger.info('create attribute %s', data.id)
		try {
			// Check if the document exists
			logger.silly('checking if a doc with the same id exists')
			const attributeDocument = await getFirestore()
				.collection('attributes')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (attributeDocument.exists) {
				logger.info('an attribute with the same id already exists')

				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			logger.silly('serializing attribute')
			const serializedAttribute = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedAttribute.__conversations = {}
			serializedAttribute.__tags = {}
			for (const conversation of Object.keys(serializedAttribute.conversations))
				serializedAttribute.__conversations[conversation] = true
			for (const tag of Object.keys(serializedAttribute.tags))
				serializedAttribute.__tags[tag] = true
			// Add the data into the database
			logger.silly('calling set on ref')
			await getFirestore().collection('attributes').doc(data.id).set(serializedAttribute)

			// If the transaction was successful, return the created attribute
			logger.info('successfully created attribute')
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			logger.warn('received error while creating attribute - %s', stringify(error))
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
		logger.info('updating attribute %s', data.id)
		// Update given fields for the attribute in Firestore
		try {
			// First retrieve the attribute
			logger.silly('checking if attribute exists in firestore')
			const existingAttributeDoc = await getFirestore()
				.collection('attributes')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingAttributeDoc.exists) {
				logger.info('failed to update non-existent attribute')
				throw new ServerError('entity-not-found')
			}

			logger.silly('found existing attribute in firestore')

			// Else update away!
			logger.silly('serializing attribute')
			const serializedAttribute = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedAttribute.__conversations = {}
			serializedAttribute.__tags = {}
			for (const conversation of Object.keys(serializedAttribute.conversations))
				serializedAttribute.__conversations[conversation] = true
			for (const tag of Object.keys(serializedAttribute.tags))
				serializedAttribute.__tags[tag] = true
			// Merge the data with the existing data in the database
			logger.silly('calling merge set on ref')
			await getFirestore()
				.collection('attributes')
				.doc(data.id!)
				.set(serializedAttribute, { merge: true })

			// If the transaction was successful, return the updated attribute
			logger.info('successfully updated attribute')
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
			logger.warn('received error while updating attribute - %s', stringify(error))
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
		logger.info('deleting attribute %s', id)
		// Delete the document
		try {
			logger.silly('calling delete on ref')
			await getFirestore().collection('attributes').doc(id).delete()
			logger.info('sucessfully deleted attribute')
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				logger.warn('received error while deleting attribute - %s', stringify(error))
				throw new ServerError('backend-error')
			}
		}
	}
}

export const provider = new AttributeProvider()
