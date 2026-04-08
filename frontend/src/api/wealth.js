import request from './request'

// ==================== 理财产品接口 ====================

export function getWealthProducts(params) {
  return request.get('/wealth/products', { params })
}

export function purchaseWealth(data) {
  return request.post('/wealth/orders', data)
}

export function getWealthOrders(params) {
  return request.get('/wealth/orders', { params })
}

export function redeemWealth(orderId, data) {
  return request.put(`/wealth/orders/${orderId}/redeem`, data)
}

// ==================== 基金接口 ====================

export function getFunds(params) {
  return request.get('/wealth/funds', { params })
}

export function purchaseFund(data) {
  return request.post('/wealth/fund-holdings', data)
}

export function getFundHoldings(params) {
  return request.get('/wealth/fund-holdings', { params })
}

export function redeemFund(holdingId, data) {
  return request.put(`/wealth/fund-holdings/${holdingId}/redeem`, data)
}

// ==================== 贵金属接口 ====================

export function getMetals() {
  return request.get('/wealth/metals')
}

export function getMetalQuote(id) {
  return request.get(`/wealth/metals/${id}/quote`)
}

export function purchaseMetal(data) {
  return request.post('/wealth/metal-holdings', data)
}

export function getMetalHoldings(params) {
  return request.get('/wealth/metal-holdings', { params })
}

export function exchangeMetal(holdingId, data) {
  return request.put(`/wealth/metal-holdings/${holdingId}/exchange`, data)
}

export function applyDelivery(holdingId, data) {
  return request.put(`/wealth/metal-holdings/${holdingId}/delivery`, data)
}
