require('dotenv').config()
const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const { menus } = require('./schema')

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

// 所有菜单数据（与前端路由一一对应）
const menuData = [
  // 顶级菜单
  { id: 1,  parentId: null, title: '工作台',     path: '/dashboard',            icon: 'HomeFilled',     sort: 0,  roles: 'teller,supervisor' },
  { id: 2,  parentId: null, title: '个人业务',   path: null,                    icon: 'User',           sort: 1,  roles: 'teller,supervisor' },
  { id: 3,  parentId: null, title: '对公业务',   path: null,                    icon: 'OfficeBuilding', sort: 2,  roles: 'teller,supervisor' },
  { id: 4,  parentId: null, title: '贷款与授信', path: null,                    icon: 'Money',          sort: 3,  roles: 'teller,supervisor' },
  { id: 5,  parentId: null, title: '支付结算',   path: null,                    icon: 'CreditCard',     sort: 4,  roles: 'teller,supervisor' },
  { id: 6,  parentId: null, title: '特殊业务',   path: null,                    icon: 'Star',           sort: 5,  roles: 'teller,supervisor' },
  { id: 7,  parentId: null, title: '内控与管理', path: null,                    icon: 'Setting',        sort: 6,  roles: 'supervisor' },
  { id: 8,  parentId: null, title: '公共辅助',   path: null,                    icon: 'Tools',          sort: 7,  roles: 'teller,supervisor' },

  // 个人业务子菜单
  { id: 10, parentId: 2, title: '账户管理',     path: '/personal/account', icon: null, sort: 0, roles: 'teller,supervisor' },
  { id: 11, parentId: 2, title: '存取款与转账', path: '/personal/deposit', icon: null, sort: 1, roles: 'teller,supervisor' },
  { id: 12, parentId: 2, title: '账户查询',     path: '/personal/inquiry', icon: null, sort: 2, roles: 'teller,supervisor' },
  { id: 13, parentId: 2, title: '银行卡业务',   path: '/personal/card',    icon: null, sort: 3, roles: 'teller,supervisor' },
  { id: 14, parentId: 2, title: '理财与贵金属', path: '/personal/wealth',  icon: null, sort: 4, roles: 'teller,supervisor' },

  // 对公业务子菜单
  { id: 20, parentId: 3, title: '单位账户管理', path: '/corporate/account',    icon: null, sort: 0, roles: 'teller,supervisor' },
  { id: 21, parentId: 3, title: '对公结算',     path: '/corporate/settlement', icon: null, sort: 1, roles: 'teller,supervisor' },
  { id: 22, parentId: 3, title: '代发代扣',     path: '/corporate/batch',      icon: null, sort: 2, roles: 'teller,supervisor' },
  { id: 23, parentId: 3, title: '单位存款',     path: '/corporate/deposit',    icon: null, sort: 3, roles: 'teller,supervisor' },

  // 贷款与授信子菜单
  { id: 30, parentId: 4, title: '个人贷款',     path: '/loan/personal',   icon: null, sort: 0, roles: 'teller,supervisor' },
  { id: 31, parentId: 4, title: '对公贷款',     path: '/loan/corporate',  icon: null, sort: 1, roles: 'teller,supervisor' },
  { id: 32, parentId: 4, title: '抵质押物管理', path: '/loan/collateral', icon: null, sort: 2, roles: 'teller,supervisor' },

  // 支付结算子菜单
  { id: 40, parentId: 5, title: '大小额支付', path: '/payment/cnaps',      icon: null, sort: 0, roles: 'teller,supervisor' },
  { id: 41, parentId: 5, title: '票据交换',   path: '/payment/check',      icon: null, sort: 1, roles: 'teller,supervisor' },
  { id: 42, parentId: 5, title: '票据业务',   path: '/payment/instrument', icon: null, sort: 2, roles: 'teller,supervisor' },

  // 特殊业务子菜单
  { id: 50, parentId: 6, title: '反洗钱与风控', path: '/special/aml',     icon: null, sort: 0, roles: 'teller,supervisor' },
  { id: 51, parentId: 6, title: '外汇业务',     path: '/special/forex',    icon: null, sort: 1, roles: 'teller,supervisor' },
  { id: 52, parentId: 6, title: '社保卡/医保卡',path: '/special/social',   icon: null, sort: 2, roles: 'teller,supervisor' },
  { id: 53, parentId: 6, title: '第三方存管',   path: '/special/custody',  icon: null, sort: 3, roles: 'teller,supervisor' },

  // 内控与管理子菜单（仅主管）
  { id: 60, parentId: 7, title: '柜员管理',     path: '/management/teller', icon: null, sort: 0, roles: 'supervisor' },
  { id: 61, parentId: 7, title: '业务授权复核', path: '/management/auth',   icon: null, sort: 1, roles: 'supervisor' },
  { id: 62, parentId: 7, title: '日终轧账清算', path: '/management/eod',    icon: null, sort: 2, roles: 'supervisor' },

  // 公共辅助子菜单
  { id: 70, parentId: 8, title: '凭证打印',     path: '/auxiliary/print',   icon: null, sort: 0, roles: 'teller,supervisor' },
  { id: 71, parentId: 8, title: '差错处理',     path: '/auxiliary/error',   icon: null, sort: 1, roles: 'teller,supervisor' },
  { id: 72, parentId: 8, title: '系统参数维护', path: '/auxiliary/params',  icon: null, sort: 2, roles: 'supervisor' },
]

async function seed() {
  console.log('正在写入菜单数据...')
  // 清空后重新插入，保证幂等
  await db.delete(menus)
  await db.insert(menus).values(menuData)
  console.log(`已插入 ${menuData.length} 条菜单数据`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('seed 失败:', err)
  process.exit(1)
})
