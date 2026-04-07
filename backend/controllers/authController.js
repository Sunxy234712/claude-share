const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { eq } = require('drizzle-orm')
const db = require('../db')
const { tellers } = require('../db/schema')

// 注册
async function register(req, res) {
  const { name, tellerNo, password, role } = req.body

  if (!name || !tellerNo || !password || !role) {
    return res.status(400).json({ success: false, message: '所有字段均为必填项' })
  }

  // 检查工号是否已存在
  const existing = await db.select().from(tellers).where(eq(tellers.tellerNo, tellerNo))
  if (existing.length > 0) {
    return res.status(409).json({ success: false, message: '工号已存在' })
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10)

  await db.insert(tellers).values({ tellerNo, name, passwordHash, role })

  return res.status(201).json({ success: true, message: '注册成功' })
}

// 登录
async function login(req, res) {
  const { tellerNo, password } = req.body

  if (!tellerNo || !password) {
    return res.status(400).json({ success: false, message: '工号和密码不能为空' })
  }

  // 查找柜员
  const rows = await db.select().from(tellers).where(eq(tellers.tellerNo, tellerNo))
  if (rows.length === 0) {
    return res.status(401).json({ success: false, message: '账号不存在' })
  }

  const teller = rows[0]

  // 检查账号状态
  if (teller.status === 'inactive') {
    return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' })
  }

  // 校验密码
  const valid = await bcrypt.compare(password, teller.passwordHash)
  if (!valid) {
    return res.status(401).json({ success: false, message: '密码错误' })
  }

  // 签发 JWT
  const token = jwt.sign(
    { id: teller.id, tellerNo: teller.tellerNo, name: teller.name, role: teller.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  return res.json({
    success: true,
    token,
    user: { id: teller.id, tellerNo: teller.tellerNo, name: teller.name, role: teller.role },
  })
}

// 检查工号是否已存在
async function checkTellerNo(req, res) {
  const { tellerNo } = req.params
  const rows = await db.select().from(tellers).where(eq(tellers.tellerNo, tellerNo))
  return res.json({ exists: rows.length > 0 })
}

module.exports = { register, login, checkTellerNo }
