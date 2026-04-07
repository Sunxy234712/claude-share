import request from './request'

// 账户查询：三个条件均可选，全为空时查所有账户
// params: { accountNo?, cardNo?, idNo? }
export function searchAccount(params) {
  return request.get('/inquiry/account', { params })
}

// 交易明细查询
// params: { accountId, startDate?, endDate?, transactionType?, page, pageSize }
export function getTransactions(params) {
  return request.get('/inquiry/transactions', { params })
}
