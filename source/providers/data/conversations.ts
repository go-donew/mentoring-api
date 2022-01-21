// @/providers/data/conversation.ts
// Retrieves, creates, updates and deletes conversations in Firebase.

import { FirebaseError } from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'

import ServerError from '../../utils/errors.js'
import Conversation from '../../models/conversation.js'
import { Query, DataProvider } from '../../types.js'

/**
 * A interface that a data provider must implement.
 */
class ConversationProvider implements DataProvider<Conversation> {
	/**
	 * Lists/searches through all conversations.
	 *
	 * @param {Array<Query>} queries A list of queries to filter the conversations.
	 *
	 * @returns {Conversation[]} Array of conversations matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Conversation>>): Promise<Conversation[]> {
		// Build the query
		const conversationsRef = getFirestore().collection('conversations')
		let foundConversations = conversationsRef.orderBy('name')
		for (const query of queries) {
			let field = query.field as string
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			foundConversations = foundConversations.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundConversations.get())
		} catch (error: unknown) {
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Conversation` class
		const conversations = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			conversations.push(
				plainToInstance(Conversation, data, { excludePrefixes: ['__'] })
			)
		}

		return conversations
	}

	/**
	 * Retrieves a conversation from the database.
	 *
	 * @param {string} id The ID of the conversation to retrieve.
	 *
	 * @returns {Conversation} The requested conversation.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Conversation> {
		// Fetch the conversation from Firestore
		let doc
		try {
			doc = await getFirestore().collection('conversations').doc(id).get()
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

		// Convert the document retrieved into an instance of a `Conversation` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Conversation` class
		return plainToInstance(Conversation, data, { excludePrefixes: ['__'] })
	}

	/**
	 * Stores a conversation in the database.
	 *
	 * @param {string} id The ID of the conversation to create.
	 * @param {Conversation} data The data to store in the conversation.
	 *
	 * @returns {Conversation} The created conversation.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(id: string, data: Conversation): Promise<Conversation> {
		// Convert the `Conversation` instance to a firebase document and save it
		try {
			// Check if the document exists
			const conversationDocument = await getFirestore()
				.collection('conversations')
				.doc(id)
				.get()

			// If it does, then return an 'already-exists' error
			if (conversationDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedConversation = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedConversation.__tags = {}
			for (const tag of serializedConversation.tags)
				serializedConversation.__tags[tag] = true
			// Add the data into the database
			await getFirestore()
				.collection('conversations')
				.doc(id)
				.set(serializedConversation)

			// If the transaction was successful, return the created conversation
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a conversation in the database.
	 *
	 * @param {string} id The ID of the conversation to update.
	 * @param {Partial<Conversation>} data A list of properties to update and the value to set.
	 *
	 * @returns {Conversation} The updated conversation.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(id: string, data: Partial<Conversation>): Promise<Conversation> {
		// Update given fields for the conversation in Firestore
		try {
			// First retrieve the conversation
			const existingConversationDoc = await getFirestore()
				.collection('conversations')
				.doc(id)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingConversationDoc.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			const serializedConversation = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedConversation.__tags = {}
			for (const tag of serializedConversation.tags)
				serializedConversation.__tags[tag] = true
			// Merge the data with the existing data in the database
			await getFirestore()
				.collection('conversations')
				.doc(id)
				.set(serializedConversation, { merge: true })

			// If the transaction was successful, return the updated conversation
			return plainToInstance(
				Conversation,
				{
					...existingConversationDoc.data(),
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
	 * Deletes a conversation in the database.
	 *
	 * @param {string} id The ID of the conversation to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await getFirestore().collection('conversations').doc(id).delete()
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

export default new ConversationProvider()
