// @/models/attribute.ts
// A class representing a attribute

import Attributes from '../providers/data/attributes.js'

/**
 * Where this change was observed or what triggered the change. Could be the ID
 * of a message or a question, answering which, the value of the attribute was
 * changed.
 *
 * @typedef {object} BlamedMessage
 * @property {string} in.required - Whether the change was observed in a message or question. - enum:question,message
 * @property {string} id.required - The ID of the message/question.
 */

/**
 * A snapshot of an an attribute when a certain change was made and the metadata
 * related to that change.
 *
 * @typedef {object} AttributeSnapshot
 * @property {string | number | boolean} value.required - The attribute's value.
 * @property {string} observer.required - The ID of the user who made this change.
 * @property {string} timestamp.required - When the change occurred. - date
 * @property {BlamedMessage} message - Where this change was observed or what triggered the change.
 */
export type AttributeSnapshot = {
	value: string | number | boolean
	observer: string | 'bot'
	timestamp: Date
	message?: {
		in: 'question' | 'message'
		id: string
	}
}

/**
 * A class representing a attribute.
 *
 * @typedef {object} Attribute
 * @property {string} id.required - The attribute ID.
 * @property {string | number | boolean} value.required - The attribute's value.
 * @property {array<AttributeSnapshot>} history - A list of changes that have been made to the attribute's value.
 */
class Attribute {
	static fromAttributeId = async (
		id: string,
		userId: string
	): Promise<Attribute> => {
		Attributes.context({ userId })

		return Attributes.get(id)
	}

	id: string
	value: string | number | boolean
	history: AttributeSnapshot[]

	readonly _userId: string

	constructor(
		id: string,
		value: string | number | boolean,
		history: AttributeSnapshot[],
		userId: string
	) {
		this.id = id
		this.value = value
		this.history = history

		this._userId = userId
	}
}

export default Attribute
