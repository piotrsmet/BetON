import db from '../db.js'

export const getUsers = async (req, res) => {
	try {
		const [rows] = await db.query('SELECT * FROM uzytkownicy')
		res.json(rows)
	} catch (err) {
		console.error('Błąd podczas pobierania gier:', err)
		res.status(500).send('Błąd serwera')
	}
}
