// @/providers/data/question.ts
// Retrieves, creates, updates and deletes questions in Firebase.

import type { FirebaseError } from 'firebase-admin'

import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import type { Query, DataProvider } from '@/types'

import { Question } from '@/models/question'
import { ServerError } from '@/errors'

/**
 * A interface that a data provider must implement.
 */
class QuestionProvider implements DataProvider<Question> {
	/**
	 * Questions are specific to a certain conversation.
	 */
	conversationId?: string

	/**
	 * Lists/searches through all questions.
	 *
	 * @param {Array<Query>} queries A list of queries to filter the questions.
	 *
	 * @returns {Question[]} Array of questions matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Question>>): Promise<Question[]> {
		if (!this.conversationId)
			throw new Error('Finding a question can only be done for a certain conversation.')

		// Build the query
		const questionsRef = getFirestore()
			.collection('conversations')
			.doc(this.conversationId)
			.collection('questions')
		let foundQuestions = questionsRef.orderBy('id')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			foundQuestions = foundQuestions.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundQuestions.get())
		} catch (error: unknown) {
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Question` class
		const questions = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			questions.push(plainToInstance(Question, data, { excludePrefixes: ['__'] }))
		}

		return questions
	}

	/**
	 * Retrieves a question from the database.
	 *
	 * @param {string} id The ID of the question to retrieve.
	 *
	 * @returns {Question} The requested question.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Question> {
		if (!this.conversationId)
			throw new Error(
				'Retrieving a question can only be done for a certain conversation.'
			)

		// Fetch the question from Firestore
		let doc
		try {
			doc = await getFirestore()
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
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

		// Convert the document retrieved into an instance of a `Question` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Question` class
		return plainToInstance(Question, data, { excludePrefixes: ['__'] })
	}

	/**
	 * Stores a question in the database.
	 *
	 * @param {Question} data The data to store in the question.
	 *
	 * @returns {Question} The created question.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Question): Promise<Question> {
		if (!this.conversationId)
			throw new Error('Creating a question can only be done for a certain conversation.')

		// Convert the `Question` instance to a firebase document and save it
		try {
			// Check if the document exists
			const questionDocument = await getFirestore()
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (questionDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedQuestion = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedQuestion._conversationId = this.conversationId
			serializedQuestion.__tags = {}
			for (const tag of serializedQuestion.tags) serializedQuestion.__tags[tag] = true
			// Add the data into the database
			await getFirestore()
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id)
				.set(serializedQuestion)

			// If the transaction was successful, return the created question
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(JSON.stringify(error))
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a question in the database.
	 *
	 * @param {Partial<Question>} data A list of properties to update and the value to set.
	 *
	 * @returns {Question} The updated question.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Question>): Promise<Question> {
		if (!this.conversationId)
			throw new Error('Updating a question can only be done for a certain conversation.')

		// Update given fields for the question in Firestore
		try {
			// First retrieve the question
			const existingQuestionDoc = await getFirestore()
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingQuestionDoc.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			const serializedQuestion = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedQuestion._conversationId = this.conversationId
			serializedQuestion.__tags = {}
			for (const tag of serializedQuestion.tags) serializedQuestion.__tags[tag] = true
			// Merge the data with the existing data in the database
			await getFirestore()
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id!)
				.set(serializedQuestion, { merge: true })

			// If the transaction was successful, return the updated question
			return plainToInstance(
				Question,
				{
					...existingQuestionDoc.data(),
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
	 * Deletes a question in the database.
	 *
	 * @param {string} id The ID of the question to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		if (!this.conversationId)
			throw new Error('Deleting a question can only be done for a certain conversation.')

		// Delete the document
		try {
			await getFirestore()
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(id)
				.delete()
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

export const provider = new QuestionProvider()
