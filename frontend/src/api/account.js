import request from './request'

// 账户列表查询
export function getAccounts(params) {
  return request.get('/accounts', { params })
}

// 开户
export function openAccount(data) {
  return request.post('/accounts/open', data)
}

// 销户
export function cancelAccount(accountId) {
  return request.put(`/accounts/${accountId}/cancel`)
}

// 挂失
export function freezeAccount(accountId) {
  return request.put(`/accounts/${accountId}/freeze`)
}

// 解挂
export function unfreezeAccount(accountId) {
  return request.put(`/accounts/${accountId}/unfreeze`)
}

// 客户信息维护
export function updateCustomerInfo(customerId, data) {
  return request.put(`/accounts/customers/${customerId}/info`, data)
}
