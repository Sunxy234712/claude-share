const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const {
  getAccounts,
  getAccountById,
  openAccount,
  cancelAccount,
  freezeAccount,
  unfreezeAccount,
  updateCustomerInfo,
} = require('../controllers/accountController')

router.use(authMiddleware)

router.get('/', getAccounts)
router.get('/:accountId', getAccountById)
router.post('/open', openAccount)
router.put('/:accountId/cancel', cancelAccount)
router.put('/:accountId/freeze', freezeAccount)
router.put('/:accountId/unfreeze', unfreezeAccount)
router.put('/customers/:customerId/info', updateCustomerInfo)

module.exports = router
