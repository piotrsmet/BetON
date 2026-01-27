import express from 'express'
import { getMatches, getMatchDetails, createMatch, updateMatchStatus, updateMatchStats, addTimelineEvent } from '../controllers/matchController.js'

const router = express.Router()

router.get('/matches', getMatches)
router.get('/matches/:id', getMatchDetails)
router.post('/matches', createMatch)
router.put('/matches/:id', updateMatchStatus)
router.put('/matches/:id/stats', updateMatchStats)
router.post('/matches/:id/timeline', addTimelineEvent)

export default router
