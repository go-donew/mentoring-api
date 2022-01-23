// @/models/question.ts
// A class representing a question

import Questions from '../providers/data/questions.js'
import { shuffle } from '../utils/index.js'

/**
 * An object that contains the data about the attribute to set when a user
 * answers a question with a given option.
 *
 * @typedef {object} AttributeToSet
 * @property {string} id.required - The ID of the attribute to set.
 * @property {string | number | boolean} value.string - The value of the attribute to set.
 *
 */

/**
 * An option a user can select to answer a question.
 *
 * @typedef {object} Option
 * @property {number} position.required - The position to show the option in if `randomizeOptionOrder` is `false`.
 * @property {string} type.required - The type of option. If it is `input`, the user can enter text as their answer - enum:select,input
 * @property {string} text.required - The question text. Should be shown as a hint for the textbox if `type` is `input`.
 * @property {AttributeToSet} attribute.required - The attribute to set when a user answers the question with this option.
 * @property {string} nextQuestion - The ID of the question to show the user if they select this option.
 */
export type Option = {
	position: number
	type: 'select' | 'input'
	text: string
	attribute: {
		id: string
		value: string | number | boolean
	}
	nextQuestion?: string
}

/**
 * A class representing a question.
 *
 * @typedef {object} Question
 * @property {string} id.required - The question ID.
 * @property {string} text.required - The question text.
 * @property {array<Option>} options.required - The options to the question.
 * @property {boolean} first.required - Whether this is the first question in the conversation.
 * @property {boolean} last.required - Whether this is the last question in the conversation.
 * @property {boolean} randomizeOptionOrder.required - Whether to randomize the order of the options.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
class Question {
	static fromQuestionId = async (id: string): Promise<Question> => {
		const question = await Questions.get(id)

		if (question.randomizeOptionOrder) {
			// Randomize the order of options if we should
			question.options = shuffle(question.options)
		} else {
			// Else sort the options in ascending order
			question.options = question.options.sort(
				(a, b) => a.position - b.position
			)
		}

		return question
	}

	id: string
	text: string
	options: Option[]
	first: boolean
	last: boolean
	randomizeOptionOrder: boolean
	tags: string[]

	readonly _conversationId: string

	constructor(
		id: string,
		text: string,
		options: Option[],
		first: boolean,
		last: boolean,
		randomizeOptionOrder: boolean,
		tags: string[],
		_conversationId: string
	) {
		this.id = id
		this.text = text
		this.options = options
		this.first = first
		this.last = last
		this.randomizeOptionOrder = randomizeOptionOrder
		this.tags = tags

		this._conversationId = _conversationId
	}
}

export default Question
