const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const { getMenus } = require('../controllers/menuController')

router.get('/', authMiddleware, getMenus)

module.exports = router
