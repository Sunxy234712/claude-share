<template>
  <div class="page-container">
    <div class="page-header">
      <h2>理财与贵金属</h2>
    </div>

    <el-tabs class="wealth-tabs">
      <!-- 理财产品页签 -->
      <el-tab-pane label="理财产品">
        <div class="page-content">
          <!-- 产品列表 -->
          <el-card shadow="never" class="card-section">
            <template #header>
              <div class="card-header">
                <span>理财产品列表</span>
                <div class="search-group">
                  <el-select v-model="wealthFilters.status" placeholder="产品状态" @change="loadWealthProducts" clearable>
                    <el-option label="在售" value="on_sale" />
                    <el-option label="下架" value="off_sale" />
                    <el-option label="已到期" value="matured" />
                  </el-select>
                  <el-select v-model="wealthFilters.productType" placeholder="产品类型" @change="loadWealthProducts" clearable>
                    <el-option label="固定收益" value="fixed_income" />
                    <el-option label="结构性" value="structured" />
                    <el-option label="浮动收益" value="floating_rate" />
                  </el-select>
                  <el-button @click="loadWealthProducts" :icon="Refresh">刷新</el-button>
                </div>
              </div>
            </template>

            <el-skeleton v-if="wealthLoading" :rows="5" animated />
            <el-table v-else :data="wealthProducts" stripe border>
              <el-table-column prop="productCode" label="产品代码" width="120" />
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column prop="productType" label="产品类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getProductTypeColor(row.productType)">
                    {{ getProductTypeName(row.productType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="expectedReturn" label="预期收益" width="100">
                <template #default="{ row }">{{ formatPercent(row.expectedReturn) }}%</template>
              </el-table-column>
              <el-table-column prop="minAmount" label="最低起购" width="100">
                <template #default="{ row }">¥{{ formatAmount(row.minAmount) }}</template>
              </el-table-column>
              <el-table-column prop="termDays" label="期限(天)" width="80" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="getStatusColor(row.status)">
                    {{ getStatusName(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="row.status !== 'on_sale'"
                    @click="openWealthDialog(row)"
                  >
                    购买
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="wealthPage"
              v-model:page-size="wealthPageSize"
              :page-sizes="[10, 20, 50]"
              :total="wealthTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @change="loadWealthProducts"
            />
          </el-card>

          <!-- 我的订单 -->
          <el-card shadow="never" class="card-section">
            <template #header>
              <div class="card-header">
                <span>我的理财订单</span>
              </div>
            </template>

            <el-skeleton v-if="ordersLoading" :rows="5" animated />
            <el-table v-else :data="wealthOrders" stripe border>
              <el-table-column prop="orderNo" label="订单号" width="150" />
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column prop="amount" label="购买金额" width="100">
                <template #default="{ row }">¥{{ formatAmount(row.amount) }}</template>
              </el-table-column>
              <el-table-column prop="expectedIncome" label="预期收益" width="100">
                <template #default="{ row }">¥{{ formatAmount(row.expectedIncome) }}</template>
              </el-table-column>
              <el-table-column prop="purchaseDate" label="购买日期" width="150">
                <template #default="{ row }">{{ formatDate(row.purchaseDate) }}</template>
              </el-table-column>
              <el-table-column prop="maturityDate" label="到期日期" width="150">
                <template #default="{ row }">{{ formatDate(row.maturityDate) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="getOrderStatusColor(row.status)">
                    {{ getOrderStatusName(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    size="small"
                    :disabled="row.status !== 'active'"
                    @click="handleRedeemWealth(row)"
                  >
                    赎回
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="ordersPage"
              v-model:page-size="ordersPageSize"
              :page-sizes="[10, 20, 50]"
              :total="ordersTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @change="loadWealthOrders"
            />
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 基金页签 -->
      <el-tab-pane label="基金">
        <div class="page-content">
          <!-- 基金列表 -->
          <el-card shadow="never" class="card-section">
            <template #header>
              <div class="card-header">
                <span>基金产品</span>
                <div class="search-group">
                  <el-input v-model="fundKeyword" placeholder="搜索基金代码/名称" @keyup.enter="loadFunds" clearable />
                  <el-select v-model="fundFilters.fundType" placeholder="基金类型" @change="loadFunds" clearable>
                    <el-option label="股票基金" value="equity" />
                    <el-option label="债券基金" value="bond" />
                    <el-option label="混合基金" value="mixed" />
                    <el-option label="货币基金" value="money" />
                  </el-select>
                  <el-button @click="loadFunds" :icon="Refresh">刷新</el-button>
                </div>
              </div>
            </template>

            <el-skeleton v-if="fundLoading" :rows="5" animated />
            <el-table v-else :data="fundList" stripe border>
              <el-table-column prop="fundCode" label="基金代码" width="100" />
              <el-table-column prop="fundName" label="基金名称" />
              <el-table-column prop="fundType" label="基金类型" width="100">
                <template #default="{ row }">
                  <el-tag>{{ getFundTypeName(row.fundType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="nav" label="当前净值" width="100" />
              <el-table-column prop="performance1m" label="1月收益" width="100">
                <template #default="{ row }">
                  <span :class="Number(row.performance1m) >= 0 ? 'is-profit' : 'is-loss'">
                    {{ row.performance1m }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="performance1y" label="1年收益" width="100">
                <template #default="{ row }">
                  <span :class="Number(row.performance1y) >= 0 ? 'is-profit' : 'is-loss'">
                    {{ row.performance1y }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="manager" label="基金经理" width="100" />
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="openFundDialog(row)">申购</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="fundPage"
              v-model:page-size="fundPageSize"
              :page-sizes="[10, 20, 50]"
              :total="fundTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @change="loadFunds"
            />
          </el-card>

          <!-- 基金持仓 -->
          <el-card shadow="never" class="card-section">
            <template #header>
              <div class="card-header">
                <span>基金持仓</span>
              </div>
            </template>

            <div v-if="!holdingsLoading && fundHoldings.length > 0" class="stat-cards">
              <div class="stat-card">
                <div class="stat-label">总投入</div>
                <div class="stat-value">¥{{ fundStats.totalInvest }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">当前价值</div>
                <div class="stat-value">¥{{ fundStats.totalValue }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">总盈亏</div>
                <div :class="Number(fundStats.totalProfitLoss) >= 0 ? 'stat-value is-profit' : 'stat-value is-loss'">
                  ¥{{ fundStats.totalProfitLoss }}
                </div>
              </div>
            </div>

            <el-skeleton v-if="holdingsLoading" :rows="5" animated />
            <el-table v-else :data="fundHoldings" stripe border>
              <el-table-column prop="fundName" label="基金名称" />
              <el-table-column prop="shares" label="持仓份额" width="100" />
              <el-table-column prop="purchasePrice" label="持仓成本" width="100">
                <template #default="{ row }">¥{{ row.purchasePrice }}</template>
              </el-table-column>
              <el-table-column prop="currentNav" label="当前净值" width="100" />
              <el-table-column prop="currentValue" label="当前价值" width="100">
                <template #default="{ row }">¥{{ row.currentValue }}</template>
              </el-table-column>
              <el-table-column prop="profitLoss" label="盈亏" width="100">
                <template #default="{ row }">
                  <span :class="Number(row.profitLoss) >= 0 ? 'is-profit' : 'is-loss'">
                    ¥{{ row.profitLoss }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="profitLossRate" label="盈亏率" width="100">
                <template #default="{ row }">
                  <span :class="Number(row.profitLossRate) >= 0 ? 'is-profit' : 'is-loss'">
                    {{ row.profitLossRate }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" size="small" @click="openRedeemFundDialog(row)">赎回</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 贵金属页签 -->
      <el-tab-pane label="贵金属">
        <div class="page-content">
          <!-- 行情卡片 -->
          <div class="metal-quotes">
            <div
              v-for="metal in metalQuotes"
              :key="metal.id"
              class="quote-card"
              @click="showMetalDetail(metal)"
            >
              <div class="metal-name">{{ getMetalTypeName(metal.metalType) }}</div>
              <div class="metal-purity">{{ metal.purity }}</div>
              <div class="metal-price">¥{{ formatAmount(metal.currentPrice) }}/克</div>
              <div :class="Number(metal.dailyChange) >= 0 ? 'change-positive' : 'change-negative'">
                {{ Number(metal.dailyChange) >= 0 ? '+' : '' }}{{ metal.dailyChange }}%
              </div>
              <div class="update-time">{{ formatTime(metal.priceUpdateTime) }}</div>
            </div>
          </div>

          <!-- 贵金属持仓 -->
          <el-card shadow="never" class="card-section">
            <template #header>
              <div class="card-header">
                <span>贵金属持仓</span>
                <el-select v-model="metalFilters.metalType" placeholder="金属类型" style="width: 150px" @change="loadMetalHoldings" clearable>
                  <el-option label="黄金" value="gold" />
                  <el-option label="白银" value="silver" />
                  <el-option label="铂金" value="platinum" />
                  <el-option label="铜" value="copper" />
                </el-select>
              </div>
            </template>

            <el-skeleton v-if="metalHoldingsLoading" :rows="5" animated />
            <el-table v-else :data="metalHoldings" stripe border style="width: 100%">
              <el-table-column prop="metalType" label="金属类型" min-width="90">
                <template #default="{ row }">{{ getMetalTypeName(row.metalType) }}</template>
              </el-table-column>
              <el-table-column prop="purity" label="纯度" min-width="90" />
              <el-table-column prop="amount" label="持仓克数" min-width="100" />
              <el-table-column prop="averageCost" label="平均成本" min-width="120">
                <template #default="{ row }">¥{{ row.averageCost }}/克</template>
              </el-table-column>
              <el-table-column prop="currentValue" label="当前价值" min-width="110">
                <template #default="{ row }">¥{{ row.currentValue }}</template>
              </el-table-column>
              <el-table-column prop="profitLoss" label="盈亏" min-width="100">
                <template #default="{ row }">
                  <span :class="Number(row.profitLoss) >= 0 ? 'is-profit' : 'is-loss'">
                    ¥{{ row.profitLoss }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="210" fixed="right">
                <template #default="{ row }">
                  <div class="action-btns">
                    <el-button type="primary" size="small" @click="openPurchaseMetalDialog()">积存</el-button>
                    <el-button type="warning" size="small" @click="openExchangeDialog(row)">兑换</el-button>
                    <el-button type="info" size="small" @click="openDeliveryDialog(row)">提取</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 理财购买弹窗 -->
    <el-dialog v-model="wealthDialogVisible" title="购买理财产品" width="500px" @close="resetWealthForm">
      <div v-if="selectedProduct" class="dialog-content">
        <div class="info-row">
          <span class="label">产品名称：</span>
          <span>{{ selectedProduct.productName }}</span>
        </div>
        <div class="info-row">
          <span class="label">最低起购：</span>
          <span>¥{{ formatAmount(selectedProduct.minAmount) }}</span>
        </div>
        <div class="info-row">
          <span class="label">最高上限：</span>
          <span>¥{{ formatAmount(selectedProduct.maxAmount) }}</span>
        </div>
        <div class="info-row">
          <span class="label">账户余额：</span>
          <span>¥{{ formatAmount(currentBalance) }}</span>
        </div>
        <el-form :model="wealthForm" label-width="100px">
          <el-form-item label="购买金额" required>
            <el-input-number
              v-model.number="wealthForm.amount"
              :min="Number(selectedProduct.minAmount)"
              :max="Number(selectedProduct.maxAmount)"
              controls-position="right"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="wealthDialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handlePurchaseWealth">确认购买</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 基金申购弹窗 -->
    <el-dialog v-model="fundDialogVisible" title="基金申购" width="500px" @close="resetFundForm">
      <div v-if="selectedFund" class="dialog-content">
        <div class="info-row">
          <span class="label">基金名称：</span>
          <span>{{ selectedFund.fundName }}</span>
        </div>
        <div class="info-row">
          <span class="label">当前净值：</span>
          <span>¥{{ selectedFund.nav }}</span>
        </div>
        <div class="info-row">
          <span class="label">预计份额：</span>
          <span>{{ fundEstimatedShares }} 份</span>
        </div>
        <div class="info-row">
          <span class="label">账户余额：</span>
          <span>¥{{ formatAmount(currentBalance) }}</span>
        </div>
        <el-form :model="fundForm" label-width="100px">
          <el-form-item label="申购金额" required>
            <el-input-number
              v-model.number="fundForm.amount"
              :min="1000"
              :max="Number(currentBalance)"
              controls-position="right"
              @change="updateEstimatedShares"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fundDialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handlePurchaseFund">确认申购</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 基金赎回弹窗 -->
    <el-dialog v-model="redeemFundDialogVisible" title="基金赎回" width="500px" @close="resetRedeemFundForm">
      <div v-if="selectedHolding" class="dialog-content">
        <div class="info-row">
          <span class="label">基金名称：</span>
          <span>{{ selectedHolding.fundName }}</span>
        </div>
        <div class="info-row">
          <span class="label">持仓份额：</span>
          <span>{{ selectedHolding.shares }} 份</span>
        </div>
        <div class="info-row">
          <span class="label">当前净值：</span>
          <span>¥{{ selectedHolding.currentNav }}</span>
        </div>
        <div class="info-row">
          <span class="label">预计赎回金额：</span>
          <span>¥{{ redeemEstimatedAmount }}</span>
        </div>
        <el-form :model="redeemFundForm" label-width="100px">
          <el-form-item label="赎回份额" required>
            <el-input-number
              v-model.number="redeemFundForm.shares"
              :min="0.0001"
              :max="Number(selectedHolding.shares)"
              controls-position="right"
              @change="updateRedeemAmount"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="redeemFundDialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleRedeemFund">确认赎回</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 贵金属积存弹窗 -->
    <el-dialog v-model="purchaseMetalDialogVisible" title="贵金属积存" width="500px" @close="resetPurchaseMetalForm">
      <el-form :model="purchaseMetalForm" label-width="100px">
        <el-form-item label="金属类型" required>
          <el-select v-model="purchaseMetalForm.metalId" placeholder="选择金属">
            <el-option
              v-for="metal in metalQuotes"
              :key="metal.id"
              :label="`${getMetalTypeName(metal.metalType)} - ¥${formatAmount(metal.currentPrice)}/克`"
              :value="metal.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="克数" required>
          <el-input-number
            v-model.number="purchaseMetalForm.amount"
            :min="0.01"
            controls-position="right"
            @change="updateMetalCost"
          />
        </el-form-item>
        <el-form-item v-if="selectedMetalForPurchase" label="当前价格">
          <span>¥{{ formatAmount(selectedMetalForPurchase.currentPrice) }}/克</span>
        </el-form-item>
        <el-form-item v-if="selectedMetalForPurchase" label="总成本">
          <span>¥{{ metalPurchaseCost }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="purchaseMetalDialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handlePurchaseMetal">确认积存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 贵金属兑换弹窗 -->
    <el-dialog v-model="exchangeMetalDialogVisible" title="贵金属兑换" width="500px" @close="resetExchangeForm">
      <div v-if="selectedExchangeHolding" class="dialog-content">
        <div class="info-row">
          <span class="label">原金属：</span>
          <span>{{ getMetalTypeName(selectedExchangeHolding.metalType) }}</span>
        </div>
        <div class="info-row">
          <span class="label">持仓克数：</span>
          <span>{{ selectedExchangeHolding.amount }}</span>
        </div>
        <el-form :model="exchangeForm" label-width="100px">
          <el-form-item label="目标金属" required>
            <el-select v-model="exchangeForm.toMetalId" placeholder="选择目标金属">
              <el-option
                v-for="metal in metalQuotes.filter((m) => m.id !== selectedExchangeHolding.metalId)"
                :key="metal.id"
                :label="getMetalTypeName(metal.metalType)"
                :value="metal.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="兑换克数" required>
            <el-input-number
              v-model.number="exchangeForm.amount"
              :min="0.01"
              :max="Number(selectedExchangeHolding.amount)"
              controls-position="right"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exchangeMetalDialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleExchangeMetal">确认兑换</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 贵金属实物提取弹窗 -->
    <el-dialog v-model="deliveryDialogVisible" title="实物提取申请" width="500px" @close="resetDeliveryForm">
      <div v-if="selectedDeliveryHolding" class="dialog-content">
        <div class="info-row">
          <span class="label">金属类型：</span>
          <span>{{ getMetalTypeName(selectedDeliveryHolding.metalType) }}</span>
        </div>
        <div class="info-row">
          <span class="label">持仓克数：</span>
          <span>{{ selectedDeliveryHolding.amount }}</span>
        </div>
        <el-form :model="deliveryForm" label-width="100px">
          <el-form-item label="提取克数" required>
            <el-input-number
              v-model.number="deliveryForm.amount"
              :min="0.01"
              :max="Number(selectedDeliveryHolding.amount)"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="收货地址" required>
            <el-input v-model="deliveryForm.address" type="textarea" rows="3" placeholder="请填写详细地址" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deliveryDialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleApplyDelivery">提交申请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getWealthProducts,
  purchaseWealth,
  getWealthOrders,
  redeemWealth,
  getFunds,
  purchaseFund,
  getFundHoldings,
  redeemFund,
  getMetals,
  purchaseMetal,
  getMetalHoldings,
  exchangeMetal,
  applyDelivery,
} from '../../api/wealth'
import { useUserStore } from '../../store/user'
import { getAccountById } from '../../api/account'

const userStore = useUserStore()
const currentBalance = ref('0')
const submitting = ref(false)

// ==================== 理财产品数据 ====================
const wealthProducts = ref([])
const wealthLoading = ref(false)
const wealthPage = ref(1)
const wealthPageSize = ref(10)
const wealthTotal = ref(0)
const wealthFilters = ref({ status: null, productType: null })
const wealthDialogVisible = ref(false)
const selectedProduct = ref(null)
const wealthForm = ref({ amount: null })

// ==================== 理财订单数据 ====================
const wealthOrders = ref([])
const ordersLoading = ref(false)
const ordersPage = ref(1)
const ordersPageSize = ref(10)
const ordersTotal = ref(0)

// ==================== 基金数据 ====================
const fundList = ref([])
const fundLoading = ref(false)
const fundPage = ref(1)
const fundPageSize = ref(10)
const fundTotal = ref(0)
const fundKeyword = ref('')
const fundFilters = ref({ fundType: null })
const fundDialogVisible = ref(false)
const selectedFund = ref(null)
const fundForm = ref({ amount: 1000 })
const fundEstimatedShares = ref('0')

// ==================== 基金持仓数据 ====================
const fundHoldings = ref([])
const holdingsLoading = ref(false)
const redeemFundDialogVisible = ref(false)
const selectedHolding = ref(null)
const redeemFundForm = ref({ shares: null })
const redeemEstimatedAmount = ref('0')

const fundStats = computed(() => {
  const holdings = fundHoldings.value
  if (holdings.length === 0) {
    return {
      totalInvest: '0.00',
      totalValue: '0.00',
      totalProfitLoss: '0.00',
    }
  }
  const invest = holdings.reduce((sum, h) => sum + Number(h.shares) * Number(h.purchasePrice), 0)
  const value = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0)
  const profitLoss = value - invest
  return {
    totalInvest: invest.toFixed(2),
    totalValue: value.toFixed(2),
    totalProfitLoss: profitLoss.toFixed(2),
  }
})

// ==================== 贵金属数据 ====================
const metalQuotes = ref([])
const metalHoldings = ref([])
const metalHoldingsLoading = ref(false)
const metalFilters = ref({ metalType: null })
const purchaseMetalDialogVisible = ref(false)
const purchaseMetalForm = ref({ metalId: null, amount: 0 })
const selectedMetalForPurchase = computed(() => {
  const id = purchaseMetalForm.value.metalId
  return metalQuotes.value.find((m) => m.id === id)
})
const metalPurchaseCost = computed(() => {
  if (!selectedMetalForPurchase.value) return '0.00'
  const cost = Number(selectedMetalForPurchase.value.currentPrice) * purchaseMetalForm.value.amount
  return cost.toFixed(2)
})

const exchangeMetalDialogVisible = ref(false)
const selectedExchangeHolding = ref(null)
const exchangeForm = ref({ toMetalId: null, amount: 0 })

const deliveryDialogVisible = ref(false)
const selectedDeliveryHolding = ref(null)
const deliveryForm = ref({ amount: 0, address: '' })

// ==================== 时间格式化 ====================
function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function formatAmount(amount) {
  return Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPercent(percent) {
  return Number(percent).toFixed(2)
}

// ==================== 类型转换 ====================
function getProductTypeName(type) {
  const map = { fixed_income: '固定收益', structured: '结构性', floating_rate: '浮动收益' }
  return map[type] || type
}

function getProductTypeColor(type) {
  const map = { fixed_income: 'success', structured: 'warning', floating_rate: 'info' }
  return map[type] || 'info'
}

function getStatusName(status) {
  const map = { on_sale: '在售', off_sale: '下架', matured: '已到期' }
  return map[status] || status
}

function getStatusColor(status) {
  const map = { on_sale: 'success', off_sale: 'info', matured: 'danger' }
  return map[status] || 'info'
}

function getOrderStatusName(status) {
  const map = { active: '持仓', redeemed: '已赎回', matured: '已到期' }
  return map[status] || status
}

function getOrderStatusColor(status) {
  const map = { active: 'success', redeemed: 'info', matured: 'warning' }
  return map[status] || 'info'
}

function getFundTypeName(type) {
  const map = { equity: '股票基金', bond: '债券基金', mixed: '混合基金', money: '货币基金' }
  return map[type] || type
}

function getMetalTypeName(type) {
  const map = { gold: '黄金', silver: '白银', platinum: '铂金', copper: '铜' }
  return map[type] || type
}

// ==================== 账户余额 ====================
async function loadAccountBalance() {
  const accountId = userStore.user?.accountId || 1
  try {
    const res = await getAccountById(accountId)
    currentBalance.value = res.data.balance
  } catch {
    // 静默失败，余额显示保持原值
  }
}

// ==================== 理财产品接口 ====================
async function loadWealthProducts() {
  try {
    wealthLoading.value = true
    const res = await getWealthProducts({
      page: wealthPage.value,
      pageSize: wealthPageSize.value,
      ...wealthFilters.value,
    })
    wealthProducts.value = res.data.list
    wealthTotal.value = res.data.total
  } catch (error) {
    ElMessage.error('加载理财产品失败')
  } finally {
    wealthLoading.value = false
  }
}

function openWealthDialog(product) {
  selectedProduct.value = product
  wealthForm.value = { amount: Number(product.minAmount) }
  wealthDialogVisible.value = true
}

function resetWealthForm() {
  selectedProduct.value = null
  wealthForm.value = { amount: null }
}

async function handlePurchaseWealth() {
  if (!wealthForm.value.amount) {
    ElMessage.warning('请输入购买金额')
    return
  }
  submitting.value = true
  try {
    await purchaseWealth({
      accountId: userStore.user.accountId || 1,
      productId: selectedProduct.value.id,
      amount: wealthForm.value.amount,
    })
    ElMessage.success('购买成功')
    wealthDialogVisible.value = false
    await Promise.all([loadWealthProducts(), loadWealthOrders(), loadAccountBalance()])
  } catch (error) {
    ElMessage.error(error.message || '购买失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 理财订单接口 ====================
async function loadWealthOrders() {
  try {
    ordersLoading.value = true
    const res = await getWealthOrders({
      accountId: userStore.user.accountId || 1,
      page: ordersPage.value,
      pageSize: ordersPageSize.value,
    })
    wealthOrders.value = res.data.list
    ordersTotal.value = res.data.total
  } catch (error) {
    ElMessage.error('加载理财订单失败')
  } finally {
    ordersLoading.value = false
  }
}

async function handleRedeemWealth(order) {
  try {
    await ElMessageBox.confirm(`确认赎回订单 ${order.orderNo}？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await redeemWealth(order.id, { accountId: userStore.user.accountId || 1 })
    ElMessage.success('赎回成功')
    await Promise.all([loadWealthOrders(), loadAccountBalance()])
  } catch (error) {
    ElMessage.error(error.message || '赎回失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 基金接口 ====================
async function loadFunds() {
  try {
    fundLoading.value = true
    const res = await getFunds({
      page: fundPage.value,
      pageSize: fundPageSize.value,
      keyword: fundKeyword.value || undefined,
      ...fundFilters.value,
    })
    fundList.value = res.data.list
    fundTotal.value = res.data.total
  } catch (error) {
    ElMessage.error('加载基金列表失败')
  } finally {
    fundLoading.value = false
  }
}

function openFundDialog(fund) {
  selectedFund.value = fund
  fundForm.value = { amount: 1000 }
  fundEstimatedShares.value = (1000 / Number(fund.nav)).toFixed(4)
  fundDialogVisible.value = true
}

function resetFundForm() {
  selectedFund.value = null
  fundForm.value = { amount: 1000 }
  fundEstimatedShares.value = '0'
}

function updateEstimatedShares() {
  if (selectedFund.value) {
    const shares = fundForm.value.amount / Number(selectedFund.value.nav)
    fundEstimatedShares.value = shares.toFixed(4)
  }
}

async function handlePurchaseFund() {
  if (!fundForm.value.amount || fundForm.value.amount < 1000) {
    ElMessage.warning('申购金额需要至少 1000 元')
    return
  }
  submitting.value = true
  try {
    await purchaseFund({
      accountId: userStore.user.accountId || 1,
      fundId: selectedFund.value.id,
      amount: fundForm.value.amount,
    })
    ElMessage.success('申购成功')
    fundDialogVisible.value = false
    await Promise.all([loadFunds(), loadFundHoldings(), loadAccountBalance()])
  } catch (error) {
    ElMessage.error(error.message || '申购失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 基金持仓接口 ====================
async function loadFundHoldings() {
  try {
    holdingsLoading.value = true
    const res = await getFundHoldings({
      accountId: userStore.user.accountId || 1,
    })
    fundHoldings.value = res.data
  } catch (error) {
    ElMessage.error('加载基金持仓失败')
  } finally {
    holdingsLoading.value = false
  }
}

function openRedeemFundDialog(holding) {
  selectedHolding.value = holding
  redeemFundForm.value = { shares: Number(holding.shares) / 2 }
  updateRedeemAmount()
  redeemFundDialogVisible.value = true
}

function resetRedeemFundForm() {
  selectedHolding.value = null
  redeemFundForm.value = { shares: null }
  redeemEstimatedAmount.value = '0'
}

function updateRedeemAmount() {
  if (selectedHolding.value) {
    const amount = redeemFundForm.value.shares * Number(selectedHolding.value.currentNav)
    redeemEstimatedAmount.value = amount.toFixed(2)
  }
}

async function handleRedeemFund() {
  if (!redeemFundForm.value.shares || redeemFundForm.value.shares <= 0) {
    ElMessage.warning('请输入赎回份额')
    return
  }
  submitting.value = true
  try {
    await redeemFund(selectedHolding.value.id, { shares: redeemFundForm.value.shares })
    ElMessage.success('赎回成功')
    redeemFundDialogVisible.value = false
    await Promise.all([loadFundHoldings(), loadAccountBalance()])
  } catch (error) {
    ElMessage.error(error.message || '赎回失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 贵金属接口 ====================
async function loadMetals() {
  try {
    const res = await getMetals()
    metalQuotes.value = res.data
  } catch (error) {
    ElMessage.error('加载贵金属行情失败')
  }
}

function showMetalDetail(metal) {
  // 可以展示详细信息，这里暂时只展示 toast
  ElMessage.info(`${getMetalTypeName(metal.metalType)} ${metal.purity}：¥${metal.currentPrice}/克`)
}

async function loadMetalHoldings() {
  try {
    metalHoldingsLoading.value = true
    let res = await getMetalHoldings({
      accountId: userStore.user.accountId || 1,
    })

    if (metalFilters.value.metalType) {
      res = {
        data: res.data.filter((h) => h.metalType === metalFilters.value.metalType),
      }
    }

    metalHoldings.value = res.data
  } catch (error) {
    ElMessage.error('加载贵金属持仓失败')
  } finally {
    metalHoldingsLoading.value = false
  }
}

function openPurchaseMetalDialog() {
  purchaseMetalForm.value = { metalId: null, amount: 0 }
  purchaseMetalDialogVisible.value = true
}

function resetPurchaseMetalForm() {
  purchaseMetalForm.value = { metalId: null, amount: 0 }
}

function updateMetalCost() {
  // cost 通过 computed 自动更新
}

async function handlePurchaseMetal() {
  if (!purchaseMetalForm.value.metalId || !purchaseMetalForm.value.amount) {
    ElMessage.warning('请选择金属类型和克数')
    return
  }
  submitting.value = true
  try {
    await purchaseMetal({
      accountId: userStore.user.accountId || 1,
      metalId: purchaseMetalForm.value.metalId,
      amount: purchaseMetalForm.value.amount,
    })
    ElMessage.success('积存成功')
    purchaseMetalDialogVisible.value = false
    await Promise.all([loadMetalHoldings(), loadAccountBalance()])
  } catch (error) {
    ElMessage.error(error.message || '积存失败')
  } finally {
    submitting.value = false
  }
}

function openExchangeDialog(holding) {
  selectedExchangeHolding.value = holding
  exchangeForm.value = { toMetalId: null, amount: 0 }
  exchangeMetalDialogVisible.value = true
}

function resetExchangeForm() {
  selectedExchangeHolding.value = null
  exchangeForm.value = { toMetalId: null, amount: 0 }
}

async function handleExchangeMetal() {
  if (!exchangeForm.value.toMetalId || !exchangeForm.value.amount) {
    ElMessage.warning('请选择目标金属和兑换克数')
    return
  }
  submitting.value = true
  try {
    await exchangeMetal(selectedExchangeHolding.value.id, {
      fromMetalId: selectedExchangeHolding.value.metalId,
      toMetalId: exchangeForm.value.toMetalId,
      amount: exchangeForm.value.amount,
    })
    ElMessage.success('兑换成功')
    exchangeMetalDialogVisible.value = false
    await loadMetalHoldings()
  } catch (error) {
    ElMessage.error(error.message || '兑换失败')
  } finally {
    submitting.value = false
  }
}

function openDeliveryDialog(holding) {
  selectedDeliveryHolding.value = holding
  deliveryForm.value = { amount: Number(holding.amount), address: '' }
  deliveryDialogVisible.value = true
}

function resetDeliveryForm() {
  selectedDeliveryHolding.value = null
  deliveryForm.value = { amount: 0, address: '' }
}

async function handleApplyDelivery() {
  if (!deliveryForm.value.amount || !deliveryForm.value.address) {
    ElMessage.warning('请填写提取克数和地址')
    return
  }
  submitting.value = true
  try {
    await applyDelivery(selectedDeliveryHolding.value.id, {
      amount: deliveryForm.value.amount,
      address: deliveryForm.value.address,
    })
    ElMessage.success('提取申请已提交')
    deliveryDialogVisible.value = false
    await loadMetalHoldings()
  } catch (error) {
    ElMessage.error(error.message || '提取申请失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 初始化 ====================
let metalRefreshInterval = null

onMounted(async () => {
  await Promise.all([
    loadAccountBalance(),
    loadWealthProducts(),
    loadWealthOrders(),
    loadFunds(),
    loadFundHoldings(),
    loadMetals(),
    loadMetalHoldings(),
  ])

  // 贵金属行情每 60 秒刷新一次
  metalRefreshInterval = setInterval(() => {
    loadMetals()
  }, 60000)
})

onBeforeUnmount(() => {
  if (metalRefreshInterval) {
    clearInterval(metalRefreshInterval)
  }
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #0a2463;
  margin: 0;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-section {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.search-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-group .el-input {
  width: 150px;
}

.search-group .el-select {
  width: 120px;
}

.action-btns {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  align-items: center;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #0a2463;
}

.stat-value.is-profit {
  color: #67c23a;
}

.stat-value.is-loss {
  color: #f56c6c;
}

.metal-quotes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.quote-card {
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quote-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.metal-name {
  font-size: 16px;
  font-weight: bold;
  color: #0a2463;
  margin-bottom: 4px;
}

.metal-purity {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.metal-price {
  font-size: 18px;
  color: #0a2463;
  margin-bottom: 8px;
}

.change-positive {
  font-size: 14px;
  color: #67c23a;
  font-weight: bold;
}

.change-negative {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.update-time {
  font-size: 10px;
  color: #909399;
  margin-top: 8px;
}

.dialog-content {
  padding: 16px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row .label {
  font-weight: bold;
  color: #606266;
  width: 100px;
}

.is-profit {
  color: #67c23a;
}

.is-loss {
  color: #f56c6c;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-pagination) {
  margin-top: 16px;
  text-align: right;
}
</style>
