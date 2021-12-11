// @/helpers/test-data.ts
// Helper functions to get test data

import { readFile } from 'node:fs/promises'

/**
 * Returns the test data for a certain endpoint.
 *
 * @param {string} path - The path to the test data file.
 */
export const testData = async (
	path: string
): Promise<Record<string, unknown>> => {
	// Read the file and return its contents
	return JSON.parse(
		await readFile(
			`test/data/${/\.[json]$/.test(path) ? path : path + '.json'}`,
			'utf-8'
		)
	) as Record<string, unknown>
}
