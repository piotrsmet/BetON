import express from 'express'
import cors from 'cors'
import session from 'express-session'
import path, { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import db from './db.js'

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

app.get('/api/uzytkownicy', async (req, res) => {
	try {
		const [rows] = await db.query('SELECT * FROM uzytkownicy')
		res.json(rows)
	} catch (err) {
		console.error('Błąd podczas pobierania gier:', err)
		res.status(500).send('Błąd serwera')
	}
})

app.post('/api/register', async (req, res) => {
	const { username, email, password } = req.body

	try {
		const [usernameCheck] = await db.query(
			'SELECT * FROM uzytkownicy WHERE nazwa = ?',
			[username]
		)

		if (usernameCheck.length > 0) {
			return res
				.status(400)
				.json({ error: 'Nazwa użytkownika jest już zajęta' })
		}

		const [emailCheck] = await db.query(
			'SELECT * FROM uzytkownicy WHERE email = ?',
			[email]
		)

		if (emailCheck.length > 0) {
			return res
				.status(400)
				.json({ error: 'Email jest już zarejestrowany' })
		}

		const saltRounds = 10
		const hashedPassword = await bcrypt.hash(password, saltRounds)

		const [result] = await db.query(
			'INSERT INTO uzytkownicy (nazwa, email, haslo) VALUES (?, ?, ?)',
			[username, email, hashedPassword]
		)

		res.status(201).json({
			message: 'Użytkownik został zarejestrowany pomyślnie',
			userId: result.insertId,
		})
	} catch (err) {
		console.error('Błąd podczas rejestracji:', err)
		res.status(500).json({ error: 'Błąd serwera' })
	}
})

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body
	try {
		const [rows] = await db.query(
			'SELECT * FROM uzytkownicy WHERE nazwa = ?',
			[username]
		)

		if (rows.length === 0) {
			return res
				.status(400)
				.json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' })
		}

		const user = rows[0]
		const passwordMatch = await bcrypt.compare(password, user.haslo)

		if (!passwordMatch) {
			return res
				.status(400)
				.json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' })
		}

		req.session.userId = user.id
		req.session.username = user.nazwa

		res.status(200).json({
			message: 'Zalogowano pomyślnie',
			userId: user.id,
			username: user.nazwa,
			balance: user.saldo
		})
	} catch (err) {
		console.error('Błąd podczas logowania:', err)
		res.status(500).json({ error: 'Błąd serwera' })
	}
})

app.get('/api/check-session', async (req, res) => {
	if (req.session.userId) {
		try {
			const [rows] = await db.query(
				'SELECT id, nazwa, saldo FROM uzytkownicy WHERE id = ?',
				[req.session.userId]
			)
			
			if (rows.length > 0) {
				const user = rows[0];
				res.json({
					isLoggedIn: true,
					userId: user.id,
					username: user.nazwa,
					balance: user.saldo
				})
			} else {
				// User not found in DB (maybe deleted), destroy session
				req.session.destroy();
				res.json({ isLoggedIn: false })
			}
		} catch (err) {
			console.error('Błąd podczas sprawdzania sesji:', err);
			res.status(500).json({ error: 'Błąd serwera' });
		}
	} else {
		res.json({ isLoggedIn: false })
	}
})

app.post('/api/logout', (req, res) => {
	req.session.destroy(err => {
		if (err) {
			return res.status(500).json({ error: 'Błąd podczas wylogowania' })
		}
		res.clearCookie('connect.sid')
		res.json({ message: 'Wylogowano pomyślnie' })
	})
})

app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '../frontend/dist/index.html'))
})

const PORT = 5000
app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`))
