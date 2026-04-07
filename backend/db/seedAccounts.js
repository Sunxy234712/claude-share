require('dotenv').config()
const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const { customers, accounts, cards } = require('./schema')

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

const testData = [
  {
    customer: { customerNo: 'C00000001', name: '张三', idType: 'id_card', idNo: '110101199001011001', phone: '13800000001', address: '北京市朝阳区建国路1号' },
    account:  { accountNo: '62000000000000001', accountType: 'savings',  balance: '5000.00', status: 'normal'    },
    card:     { cardNo: '622800000000000001', status: 'normal'  },
  },
  {
    customer: { customerNo: 'C00000002', name: '李四', idType: 'id_card', idNo: '110101199002022002', phone: '13800000002', address: '上海市浦东新区陆家嘴环路2号' },
    account:  { accountNo: '62000000000000002', accountType: 'savings',  balance: '12800.50', status: 'normal'    },
    card:     { cardNo: '622800000000000002', status: 'lost'    },
  },
  {
    customer: { customerNo: 'C00000003', name: '王五', idType: 'id_card', idNo: '110101199003033003', phone: '13800000003', address: '广州市天河区珠江新城3号' },
    account:  { accountNo: '62000000000000003', accountType: 'current',  balance: '0.00',    status: 'frozen'    },
    card:     { cardNo: '622800000000000003', status: 'frozen'  },
  },
  {
    customer: { customerNo: 'C00000004', name: '赵六', idType: 'id_card', idNo: '110101199004044004', phone: '13800000004', address: '深圳市南山区科技园4号' },
    account:  { accountNo: '62000000000000004', accountType: 'savings',  balance: '0.00',    status: 'cancelled' },
    card:     { cardNo: '622800000000000004', status: 'frozen'  },
  },
  {
    customer: { customerNo: 'C00000005', name: '孙七', idType: 'passport', idNo: 'E12345678', phone: '13800000005', address: '成都市锦江区春熙路5号' },
    account:  { accountNo: '62000000000000005', accountType: 'current',  balance: '88888.88', status: 'normal'    },
    card:     { cardNo: '622800000000000005', status: 'normal'  },
  },
  {
    customer: { customerNo: 'C00000006', name: '周八', idType: 'id_card', idNo: '110101199006066006', phone: '13800000006', address: '武汉市武昌区中南路6号' },
    account:  { accountNo: '62000000000000006', accountType: 'savings',  balance: '3200.00', status: 'frozen'    },
    card:     { cardNo: '622800000000000006', status: 'lost'    },
  },
  {
    customer: { customerNo: 'C00000007', name: '吴九', idType: 'id_card', idNo: '110101199007077007', phone: '13800000007', address: '杭州市西湖区文三路7号' },
    account:  { accountNo: '62000000000000007', accountType: 'current',  balance: '500.00',  status: 'normal'    },
    card:     { cardNo: '622800000000000007', status: 'frozen'  },
  },
  {
    customer: { customerNo: 'C00000008', name: '郑十', idType: 'id_card', idNo: '110101199008088008', phone: '13800000008', address: '南京市鼓楼区中山路8号' },
    account:  { accountNo: '62000000000000008', accountType: 'savings',  balance: '0.00',    status: 'cancelled' },
    card:     { cardNo: '622800000000000008', status: 'frozen'  },
  },
  {
    customer: { customerNo: 'C00000009', name: '冯十一', idType: 'id_card', idNo: '110101199009099009', phone: '13800000009', address: '西安市雁塔区高新路9号' },
    account:  { accountNo: '62000000000000009', accountType: 'current',  balance: '99999.99', status: 'normal'   },
    card:     { cardNo: '622800000000000009', status: 'normal'  },
  },
  {
    customer: { customerNo: 'C00000010', name: '陈十二', idType: 'other', idNo: 'OT9876543210', phone: '13800000010', address: '重庆市渝中区解放碑10号' },
    account:  { accountNo: '62000000000000010', accountType: 'savings',  balance: '1500.00', status: 'frozen'    },
    card:     { cardNo: '622800000000000010', status: 'normal'  },
  },
]

async function seed() {
  console.log('开始插入测试账户数据...')

  for (const item of testData) {
    // 插入客户
    const insertedCustomer = await db
      .insert(customers)
      .values(item.customer)
      .onConflictDoNothing()
      .returning()

    const customerId = insertedCustomer[0]?.id
    if (!customerId) {
      console.log(`  跳过已存在客户：${item.customer.name}`)
      continue
    }

    // 插入账户
    const insertedAccount = await db
      .insert(accounts)
      .values({ ...item.account, customerId })
      .returning()

    const accountId = insertedAccount[0].id

    // 插入银行卡
    await db.insert(cards).values({ ...item.card, accountId })

    console.log(`  ✓ ${item.customer.name} | 账号：${item.account.accountNo} | 账户状态：${item.account.status} | 卡状态：${item.card.status}`)
  }

  console.log('\n插入完成！各状态分布：')
  console.log('  账户正常(normal)   + 卡正常(normal) ：张三、孙七、吴九')
  console.log('  账户正常(normal)   + 卡挂失(lost)   ：李四')
  console.log('  账户正常(normal)   + 卡冻结(frozen) ：吴九→郑十')
  console.log('  账户冻结(frozen)   + 卡冻结(frozen) ：王五、陈十二')
  console.log('  账户冻结(frozen)   + 卡挂失(lost)   ：周八')
  console.log('  账户冻结(frozen)   + 卡正常(normal) ：陈十二')
  console.log('  账户销户(cancelled)+ 卡冻结(frozen) ：赵六、郑十')
  process.exit(0)
}

seed().catch((err) => {
  console.error('插入失败:', err.message)
  process.exit(1)
})
