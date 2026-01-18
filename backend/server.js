import express from 'express'
import cors from 'cors'
import session from 'express-session'
import path, { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { setupSwagger } from './swagger.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import matchRoutes from './routes/matchRoutes.js'
import betRoutes from './routes/betRoutes.js'
import walletRoutes from './routes/walletRoutes.js'

import cron from 'node-cron'
import { importDailyMatches, clearMatchData } from './services/matchImporter.js'
import { settleMatches, settleCoupons, updateMatchStatuses } from './services/settlementService.js'

const app = express()
app.use(
	cors({
		origin: ['http://localhost:5173', 'http://localhost:5000', 'http://localhost:5001'],
		credentials: true,
	})
)

app.use(express.json())

setupSwagger(app)

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
app.use('/api', matchRoutes)
app.use('/api', betRoutes)
app.use('/api', walletRoutes)

app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '../frontend/dist/index.html'))
})

const PORT = 5001
app.listen(PORT, () => {
	console.log(`Server działa na porcie ${PORT}`)
	
	// Harmonogram zadań - uruchamianie raz dziennie o 3:00 rano
	cron.schedule('0 3 * * *', async () => {
		console.log('Uruchamianie planowanego importu meczów...');
		await clearMatchData();
		await importDailyMatches();
	});

    // Rozliczanie kuponów co minutę
    cron.schedule('* * * * *', async () => {
        try { 
            await updateMatchStatuses(); 
            await settleMatches();      
            await settleCoupons();      
        } catch (error) {
            console.error('Błąd w cyklu rozliczeniowym:', error);
        }
    });

	/*
	(async () => {
		await clearMatchData();
		await importDailyMatches();
	})();*/
	
})
