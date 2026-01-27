import express from 'express'
import { getTransactions, deposit, withdraw } from '../controllers/walletController.js'

const router = express.Router()

router.get('/transactions', getTransactions)
router.post('/wallet/deposit', deposit)
router.post('/wallet/withdraw', withdraw)

export default router
