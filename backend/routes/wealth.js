const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const {
  getWealthProducts,
  purchaseWealth,
  getWealthOrders,
  redeemWealth,
  getFunds,
  purchaseFund,
  getFundHoldings,
  redeemFund,
  getMetals,
  getMetalQuote,
  purchaseMetal,
  getMetalHoldings,
  exchangeMetal,
  applyDelivery,
} = require('../controllers/wealthController')

// 所有路由均需要认证
router.use(authMiddleware)

// 理财产品接口
router.get('/products', getWealthProducts)
router.post('/orders', purchaseWealth)
router.get('/orders', getWealthOrders)
router.put('/orders/:orderId/redeem', redeemWealth)

// 基金接口
router.get('/funds', getFunds)
router.post('/fund-holdings', purchaseFund)
router.get('/fund-holdings', getFundHoldings)
router.put('/fund-holdings/:holdingId/redeem', redeemFund)

// 贵金属接口
router.get('/metals', getMetals)
router.get('/metals/:id/quote', getMetalQuote)
router.post('/metal-holdings', purchaseMetal)
router.get('/metal-holdings', getMetalHoldings)
router.put('/metal-holdings/:holdingId/exchange', exchangeMetal)
router.put('/metal-holdings/:holdingId/delivery', applyDelivery)

module.exports = router
