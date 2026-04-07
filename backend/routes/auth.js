const express = require('express')
const router = express.Router()
const { register, login, checkTellerNo } = require('../controllers/authController')

router.post('/register', register)
router.post('/login', login)
router.get('/check-teller-no/:tellerNo', checkTellerNo)

module.exports = router
