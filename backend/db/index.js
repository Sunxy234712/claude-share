const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const schema = require('./schema')

// 从环境变量读取 Neon 连接串
const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql, { schema })

module.exports = db
