// @/utils/index.ts
// Misc utility functions

import {
	ClassConstructor,
	instanceToPlain,
	plainToInstance,
} from 'class-transformer'
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

/**
 * A wrapper around the `instanceToPlain` method.
 *
 * @param {T} data The class to serialize to JSON.
 *
 * @returns {any} A JSON representation of the class.
 */
export const classToPlain = <T>({ data }: { data: T }): any => {
	return instanceToPlain(data)
}

/**
 * A wrapper around the `plainToInstance` method.
 *
 * @param {T} data The JSON to convert to a class.
 * @param {ClassConstructor<V>} to The class to convert the JSON to.
 *
 * @returns {T} An instance of the class created from the JSON.
 */
export const plainToClass = <T, V>({
	data,
	to,
}: {
	data: V
	to: ClassConstructor<T>
}): T => {
	return plainToInstance(to, data, {
		excludePrefixes: ['__'],
		excludeExtraneousValues: true,
		enableImplicitConversion: true,
	})
}
