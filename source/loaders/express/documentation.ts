// @/loaders/express/documentation.ts
// Parses the comments and generates the OpenAPI documentation for the API.

import { dirname, resolve as getAbsolutePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Application, Response, static as serve } from 'express'
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
				description:
					'This is the documentation for the DoNew Today API. Pick an endpoint from the sidebar on the left to know more about it.',
			},
			servers: [
				{
					url: 'http://today.godonew.com',
					description: 'Public facing API server',
				},
				{
					url: 'http://localhost:5000',
					description: 'For local development only',
				},
			],
			security: {
				bearer: {
					type: 'http',
					scheme: 'bearer',
				},
			},

			// Extract comments from the following compiled files
			baseDir: getAbsolutePath(__dirname, '../../../build/'),
			filesPattern: [
				'routes/**/*.js',
				'models/**/*.js',
				'utils/errors.js',
				'types.d.ts',
			],
			// Expose the generated JSON spec as /docs/spec.json
			exposeApiDocs: true,
			apiDocsPath: '/docs/spec.json',
		}).on('finish', resolve)
	})
	// Render documentation using Elements
	app.use(
		'/docs',
		serve(getAbsolutePath(__dirname, '../../../assets/docs.html'), {
			setHeaders: (response: Response) =>
				response.setHeader('content-security-policy', ''),
		})
	)

	// Use the validation middleware
	app.use(
		validate({
			apiSpec: spec as any,
		})
	)
}

export default load
