import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
})

// 请求拦截器：自动附加 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理 401 自动跳转登录
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const msg = error.response?.data?.message || '登录已过期，请重新登录'
      ElMessage.error(msg)
      router.push('/login')
    } else {
      const msg = error.response?.data?.message || '请求失败，请稍后重试'
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

export default request
