// @/loaders/express/documentation.ts
// Parses the comments and generates the OpenAPI documentation for the API.

import { dirname, resolve as getAbsolutePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Application } from 'express'
import generateOpenApiSpec from 'express-jsdoc-swagger'
import { middleware as validate } from 'express-openapi-validator'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Parses the comments and generates the OpenAPI documentation for the API.
 * Exposes the generated spec with the /docs/spec.json endpoint.
 *
 * @param {Application} app - The Express application instance.
 */
const load = async (app: Application): Promise<void> => {
	// Generate the documentation
	const spec = await new Promise((resolve) => {
		generateOpenApiSpec(app)({
			// Basic information about the API to include in the spec
			info: {
				title: 'The DoNew Today API',
				version: '0.1.0',
				description: 'The OpenAPI specification for the DoNew Today API.',
			},

			// Extract comments from the following compiled files
			baseDir: getAbsolutePath(__dirname, '../../../build/'),
			filesPattern: [
				'routes/**/*.js',
				'models/**/*.js',
				'utils/errors.js',
				'types.d.ts',
			],

			// Expose the swagger UI as the /docs endpoint
			exposeSwaggerUI: true, // eslint-disable-line @typescript-eslint/naming-convention
			swaggerUIPath: '/docs', // eslint-disable-line @typescript-eslint/naming-convention
			// Expose the generated JSON spec as /docs/spec.json
			exposeApiDocs: true,
			apiDocsPath: '/docs/spec.json',

			// Tell swagger UI where the spec is
			swaggerUiOptions: {
				swaggerUrl: '/docs/spec.json',
			},
		}).on('finish', resolve)
	})

	// Use the validation middleware
	app.use(
		validate({
			apiSpec: spec as any,
		})
	)
}

export default load
