import express from 'express'
import cors from 'cors'
import session from 'express-session'
import path, { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
app.use(
	cors({
		origin: ['http://localhost:5173', 'http://localhost:5000'],
		credentials: true,
	})
)

app.use(express.json())

app.use(
	session({
		secret: 'twoj-sekretny-klucz-zmien-na-produkcji',
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: false,
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 7,
		},
	})
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(express.static(join(__dirname, '')))
app.use(express.static(join(__dirname, '../frontend/dist')))

app.use('/api', authRoutes)
app.use('/api', userRoutes)

app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '../frontend/dist/index.html'))
})

const PORT = 5000
app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`))
