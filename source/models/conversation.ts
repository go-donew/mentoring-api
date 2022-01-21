// @/models/conversation.ts
// A class representing a conversation

import Conversations from '../providers/data/conversations.js'

/**
 * A class representing a conversation.
 *
 * @typedef {object} Conversation
 * @property {string} id.required - The conversation ID.
 * @property {string} name.required - The conversation's name.
 * @property {string} description.required - The conversation's description.
 * @property {boolean} once.required - Whether a user can go through the conversation again.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
class Conversation {
	static fromConversationId = async (id: string): Promise<Conversation> =>
		Conversations.get(id)

	id: string
	name: string
	description: string
	once: boolean
	tags: string[]

	constructor(
		id: string,
		name: string,
		description: string,
		once: boolean,
		tags: string[]
	) {
		this.id = id
		this.name = name
		this.description = description
		this.once = once
		this.tags = tags
	}
}

export default Conversation
