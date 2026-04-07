const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const { searchAccount, getTransactions } = require('../controllers/inquiryController')

router.use(authMiddleware)

router.get('/account', searchAccount)
router.get('/transactions', getTransactions)

module.exports = router
