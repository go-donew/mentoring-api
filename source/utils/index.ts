// @/utils/index.ts
// Misc utility functions

import { customAlphabet } from 'nanoid'

/**
 * Generates a random 28 long alphanum ID that matches Firebase's IDs.
 *
 * @returns {string}
 */
export const generateId = customAlphabet(
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
	28
)
