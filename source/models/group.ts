// @/models/group.ts
// A class representing a group

import Groups from '../providers/data/groups.js'
import { ParticipantList, ConversationsList, ReportsList } from '../types.js'

/**
 * A class representing a group.
 *
 * @typedef {object} Group
 * @property {string} id.required - The group ID.
 * @property {string} name.required - The group's name.
 * @property {ParticipantList} participants - The group's participants.
 * @property {ConversationsList} conversations - The conversations the group's participants are allowed to take part in.
 * @property {ReportsList} reports - The reports the group's participants can view.
 */
class Group {
	static fromGroupId = async (id: string): Promise<Group> => Groups.get(id)

	id: string
	name: string
	participants: ParticipantList
	conversations: ConversationsList
	reports: ReportsList

	constructor(
		id: string,
		name: string,
		participants: ParticipantList,
		conversations: ConversationsList,
		reports: ReportsList
	) {
		this.id = id
		this.name = name
		this.participants = participants
		this.conversations = conversations
		this.reports = reports
	}
}

export default Group
