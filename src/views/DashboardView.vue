<template>
  <div class="page-shell">
    <div class="hero-grid">
      <a-card
        v-for="card in summaryCards"
        :key="card.title"
        class="hero-card"
        :bordered="false"
        hoverable
        @click="navigate(card.route)"
      >
        <div class="hero-label">{{ card.title }}</div>
        <div class="hero-value">{{ card.value }}</div>
        <div class="hero-desc">{{ card.desc }}</div>
      </a-card>
    </div>

    <div class="chart-grid">
      <a-card title="销售额折线图" class="panel-card" :bordered="false">
        <div class="chart-shell">
          <svg viewBox="0 0 460 240" class="line-chart" aria-hidden="true">
            <defs>
              <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#16a34a" stop-opacity="0.24" />
                <stop offset="100%" stop-color="#16a34a" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <line v-for="line in gridLines" :key="line.y" x1="36" x2="430" :y1="line.y" :y2="line.y" class="grid-line" />
            <path :d="lineAreaPath" fill="url(#trendFill)" />
            <path :d="linePath" class="line-path" />
            <g v-for="point in chartPoints" :key="point.label">
              <circle :cx="point.x" :cy="point.y" r="4.5" class="line-point" />
              <text :x="point.x" y="226" text-anchor="middle" class="axis-text">{{ point.label }}</text>
            </g>
          </svg>
          <div class="chart-legend">
            <div class="legend-title">近 7 天销售额</div>
            <div class="legend-subtitle">金额峰值 {{ formatAmount(maxSalesAmount) }}</div>
          </div>
        </div>
      </a-card>

      <a-card title="订单量柱状图" class="panel-card" :bordered="false">
        <div class="bar-list">
          <div v-for="item in salesTrend" :key="item.label" class="bar-item">
            <div class="bar-meta">
              <span>{{ item.label }}</span>
              <span>{{ item.salesQuantity }} 单</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${resolveOrderPercent(item.salesQuantity)}%` }"></div>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <div class="content-grid">
      <a-card title="销量排行榜" class="panel-card" :bordered="false">
        <div class="ranking-list">
          <div v-for="(item, index) in salesQuantityRanking" :key="`${item.medicineName}-${index}`" class="ranking-item">
            <div class="ranking-name">
              <span class="ranking-index">{{ index + 1 }}</span>
              <span>{{ item.medicineName }}</span>
            </div>
            <div class="ranking-bar">
              <div class="ranking-fill quantity-fill" :style="{ width: `${resolveRankingPercent(item.salesQuantity, quantityMax)}%` }"></div>
            </div>
            <div class="ranking-value">{{ item.salesQuantity }}</div>
          </div>
        </div>
      </a-card>

      <a-card title="毛利排行榜" class="panel-card" :bordered="false">
        <div class="ranking-list">
          <div v-for="(item, index) in grossProfitRanking" :key="`${item.medicineName}-${index}`" class="ranking-item">
            <div class="ranking-name">
              <span class="ranking-index">{{ index + 1 }}</span>
              <span>{{ item.medicineName }}</span>
            </div>
            <div class="ranking-bar">
              <div class="ranking-fill profit-fill" :style="{ width: `${resolveRankingPercent(item.grossProfit, profitMax)}%` }"></div>
            </div>
            <div class="ranking-value">{{ formatAmount(item.grossProfit) }}</div>
          </div>
        </div>
      </a-card>
    </div>

    <a-card title="库存预警" class="panel-card" :bordered="false">
      <a-empty v-if="!alerts.length" description="当前暂无预警" />
      <div v-else class="alert-grid">
        <div v-for="item in alerts" :key="`${item.alertType}-${item.medicineId}-${item.content}`" class="alert-item" @click="navigate('/inventory')">
          <div class="alert-badge" :class="item.levelTag === '高' ? 'danger' : 'warning'">{{ item.alertType }}</div>
          <div class="alert-title">{{ item.medicineName }}</div>
          <div class="alert-desc">{{ item.content }}</div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { dashboardApi } from "@/api";

const router = useRouter();
const summary = ref({
  todaySalesAmount: 0,
  lowStockCount: 0,
  expiringSoonCount: 0,
  todayOrderCount: 0,
});
const salesTrend = ref<any[]>([]);
const alerts = ref<any[]>([]);
const salesQuantityRanking = ref<any[]>([]);
const grossProfitRanking = ref<any[]>([]);

const summaryCards = computed(() => [
  {
    title: "今日销售额",
    value: formatAmount(summary.value.todaySalesAmount),
    desc: `今日已完成 ${summary.value.todayOrderCount} 笔销售订单`,
    route: "/sales",
  },
  {
    title: "缺货预警数量",
    value: `${summary.value.lowStockCount} 种`,
    desc: "点击查看缺货药品并安排补货",
    route: "/inventory",
  },
  {
    title: "近效期药品",
    value: `${summary.value.expiringSoonCount} 批次`,
    desc: "点击查看近 30 天内到期批次",
    route: "/inventory",
  },
]);

const maxSalesAmount = computed(() =>
  Math.max(...salesTrend.value.map((item) => Number(item.salesAmount || 0)), 1),
);
const maxOrderCount = computed(() =>
  Math.max(...salesTrend.value.map((item) => Number(item.salesQuantity || 0)), 1),
);
const quantityMax = computed(() =>
  Math.max(...salesQuantityRanking.value.map((item) => Number(item.salesQuantity || 0)), 1),
);
const profitMax = computed(() =>
  Math.max(...grossProfitRanking.value.map((item) => Number(item.grossProfit || 0)), 1),
);

const chartPoints = computed(() => {
  const list = salesTrend.value;
  if (!list.length) return [];
  const width = 394;
  const height = 150;
  return list.map((item, index) => {
    const x = 36 + (width / Math.max(list.length - 1, 1)) * index;
    const percent = Number(item.salesAmount || 0) / maxSalesAmount.value;
    const y = 28 + (1 - percent) * height;
    return { x, y, label: item.label };
  });
});

const linePath = computed(() => {
  if (!chartPoints.value.length) return "";
  return chartPoints.value
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
});

const lineAreaPath = computed(() => {
  if (!chartPoints.value.length) return "";
  const first = chartPoints.value[0];
  const last = chartPoints.value[chartPoints.value.length - 1];
  return `${linePath.value} L ${last.x} 178 L ${first.x} 178 Z`;
});

const gridLines = computed(() => [28, 78, 128, 178].map((y) => ({ y })));

const formatAmount = (value: number | string) => `¥${Number(value || 0).toFixed(2)}`;

const resolveOrderPercent = (value: number | string) => {
  const percent = (Number(value || 0) / maxOrderCount.value) * 100;
  return Math.max(percent, Number(value || 0) > 0 ? 8 : 0);
};

const resolveRankingPercent = (value: number | string, maxValue: number) => {
  const percent = (Number(value || 0) / Math.max(maxValue, 1)) * 100;
  return Math.max(percent, Number(value || 0) > 0 ? 10 : 0);
};

const navigate = (path: string) => {
  router.push(path);
};

const loadData = async () => {
  const [summaryData, trendData, alertData, quantityRanking, profitRanking] = await Promise.all([
    dashboardApi.getSummary(),
    dashboardApi.getSalesTrend(),
    dashboardApi.getAlerts(),
    dashboardApi.getSalesQuantityRanking(),
    dashboardApi.getGrossProfitRanking(),
  ]);
  summary.value = summaryData;
  salesTrend.value = trendData;
  alerts.value = alertData;
  salesQuantityRanking.value = quantityRanking;
  grossProfitRanking.value = profitRanking;
};

onMounted(loadData);
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.chart-grid,
.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.hero-card,
.panel-card {
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(241, 249, 245, 0.88));
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 36px rgba(19, 59, 56, 0.08);
}

.hero-card {
  cursor: pointer;
}

.hero-label {
  color: #63827d;
}

.hero-value {
  margin-top: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #0f766e;
}

.hero-desc {
  margin-top: 10px;
  color: #6b8784;
}

.chart-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.line-chart {
  width: 100%;
  height: 240px;
}

.grid-line {
  stroke: rgba(17, 24, 39, 0.08);
  stroke-width: 1;
}

.line-path {
  fill: none;
  stroke: #16a34a;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line-point {
  fill: #16a34a;
  stroke: #ffffff;
  stroke-width: 2;
}

.axis-text {
  font-size: 12px;
  fill: #6b8784;
}

.chart-legend {
  display: flex;
  justify-content: space-between;
  color: #59706c;
}

.legend-title {
  font-weight: 700;
}

.bar-list,
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-meta,
.ranking-item,
.ranking-name {
  display: flex;
  align-items: center;
}

.bar-meta,
.ranking-item {
  justify-content: space-between;
  gap: 12px;
}

.bar-item,
.ranking-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f7fbf9;
}

.bar-track,
.ranking-bar {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.08);
  overflow: hidden;
}

.bar-fill,
.ranking-fill {
  height: 100%;
  border-radius: inherit;
}

.bar-fill {
  background: linear-gradient(90deg, #0f766e, #22c55e);
}

.ranking-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e7f7ef;
  color: #15803d;
  font-weight: 700;
  margin-right: 10px;
}

.quantity-fill {
  background: linear-gradient(90deg, #16a34a, #4ade80);
}

.profit-fill {
  background: linear-gradient(90deg, #0f766e, #2dd4bf);
}

.ranking-value {
  min-width: 78px;
  text-align: right;
  color: #3f5753;
}

.alert-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.alert-item {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff7ed, #fff);
  cursor: pointer;
}

.alert-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.danger {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.warning {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.alert-title {
  margin-top: 14px;
  font-weight: 700;
  color: #1f2937;
}

.alert-desc {
  margin-top: 10px;
  color: #6b7280;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .hero-grid,
  .chart-grid,
  .content-grid,
  .alert-grid {
    grid-template-columns: 1fr;
  }

  .chart-legend,
  .ranking-item {
    flex-direction: column;
    align-items: stretch;
  }

  .ranking-value {
    text-align: left;
  }
}
</style>
