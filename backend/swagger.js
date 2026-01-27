import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path, { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const swaggerDocument = YAML.load(join(__dirname, './swagger.yaml'))

export const setupSwagger = app => {
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}
