// @/models/user.ts
// A class representing a user

import Users from '../providers/data/user.js'

/**
 * A class representing a user.
 *
 * @typedef {object} User
 * @property {string} id.required - The user ID.
 * @property {string} name.required - The user's name.
 * @property {string} email - The user's email address. - email
 * @property {string} phone - The user's phone number.
 * @property {string} lastSignedIn.required - The time the user last signed in to their account. - date
 */
class User {
	static async fromUserId(id: string): Promise<User> {
		return Users.get(id)
	}

	id: string
	name: string
	email?: string
	phone?: string
	lastSignedIn: Date

	constructor(
		id: string,
		name: string,
		email: string | undefined,
		phone: string | undefined,
		lastSignedIn: Date
	) {
		this.id = id
		this.name = name
		this.email = email
		this.phone = phone
		this.lastSignedIn = lastSignedIn
	}
}

export default User
