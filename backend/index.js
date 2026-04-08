require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const menuRoutes = require('./routes/menus')
const accountRoutes = require('./routes/accounts')
const inquiryRoutes = require('./routes/inquiry')
const wealthRoutes = require('./routes/wealth')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/menus', menuRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/inquiry', inquiryRoutes)
app.use('/api/wealth', wealthRoutes)

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// 统一错误处理（放在最后）
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`)
})
