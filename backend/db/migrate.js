require('dotenv').config()
const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const { migrate } = require('drizzle-orm/neon-http/migrator')
const path = require('path')

async function main() {
  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql)
  console.log('正在执行数据库迁移...')
  await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') })
  console.log('迁移完成')
  process.exit(0)
}

main().catch((err) => {
  console.error('迁移失败:', err)
  process.exit(1)
})
