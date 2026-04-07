const { asc, isNull, eq } = require('drizzle-orm')
const db = require('../db')
const { menus } = require('../db/schema')

// 将平铺列表转换为树形结构
function buildTree(list, parentId = null) {
  return list
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .map((item) => {
      const children = buildTree(list, item.id)
      return children.length > 0
        ? { ...item, children }
        : { ...item }
    })
}

// 获取菜单列表（根据用户角色过滤）
async function getMenus(req, res) {
  const { role } = req.user

  // 查询所有可见菜单
  const allMenus = await db
    .select()
    .from(menus)
    .where(eq(menus.isVisible, true))
    .orderBy(asc(menus.sort))

  // 过滤当前角色有权限的菜单
  const filtered = allMenus.filter((m) =>
    m.roles.split(',').map((r) => r.trim()).includes(role)
  )

  // 构建树形结构
  const tree = buildTree(filtered)

  return res.json({ success: true, data: tree })
}

module.exports = { getMenus }
