import request from './request'

// 登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 注册
export function register(data) {
  return request.post('/auth/register', data)
}

// 检查工号是否已存在
export function checkTellerNo(tellerNo) {
  return request.get(`/auth/check-teller-no/${tellerNo}`)
}
