<template>
  <div class="page-shell">
    <!-- 核心指标卡片 -->
    <div class="metrics-grid">
      <a-card v-for="item in metricsCards" :key="item.title" class="metric-card" :bordered="false">
        <div class="metric-label">{{ item.title }}</div>
        <div class="metric-value">{{ item.value }}</div>
        <div class="metric-desc">{{ item.desc }}</div>
      </a-card>
    </div>

    <!-- 图表区域 -->
    <div class="chart-grid">
      <a-card title="销售趋势" class="panel-card" :bordered="false">
        <div class="chart-toolbar">
          <a-radio-group v-model="trendDays" @change="loadSalesTrend">
            <a-radio :value="7">近 7 天</a-radio>
            <a-radio :value="30">近 30 天</a-radio>
          </a-radio-group>
        </div>
        <div ref="salesTrendChart" class="chart-container"></div>
      </a-card>

      <a-card title="库存分类占比" class="panel-card" :bordered="false">
        <div ref="categoryPieChart" class="chart-container"></div>
      </a-card>
    </div>

    <div class="chart-grid">
      <a-card title="出入库流水趋势" class="panel-card" :bordered="false">
        <div class="chart-toolbar">
          <a-radio-group v-model="flowDays" @change="loadInOutFlow">
            <a-radio :value="7">近 7 天</a-radio>
            <a-radio :value="30">近 30 天</a-radio>
          </a-radio-group>
        </div>
        <div ref="inoutFlowChart" class="chart-container"></div>
      </a-card>

      <a-card title="销售排行 TOP10" class="panel-card" :bordered="false">
        <a-table :data="salesRanking" :pagination="false" :columns="rankingColumns">
          <template #totalAmount="{ record }">
            <span class="amount-text">¥{{ Number(record.totalAmount || 0).toFixed(2) }}</span>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 预警信息 -->
    <a-card title="库存预警" class="panel-card" :bordered="false">
      <a-grid :cols="2" :col-gap="16" :row-gap="16">
        <a-grid-item>
          <a-alert type="warning">
            缺货药品 {{ shortageCount }} 种，请及时补货
          </a-alert>
        </a-grid-item>
        <a-grid-item>
          <a-alert type="error">
            临期药品 {{ expiringCount }} 批次，请优先处理
          </a-alert>
        </a-grid-item>
      </a-grid>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from "vue";
import * as echarts from "echarts";
import { reportApi } from "@/api";

const metricsCards = ref<any[]>([]);
const salesTrendChart = ref<HTMLElement | null>(null);
const categoryPieChart = ref<HTMLElement | null>(null);
const inoutFlowChart = ref<HTMLElement | null>(null);
const salesRanking = ref<any[]>([]);
const trendDays = ref(7);
const flowDays = ref(7);
const shortageCount = ref(0);
const expiringCount = ref(0);

let chartInstances: echarts.ECharts[] = [];

const rankingColumns = [
  { title: "排名", dataIndex: "index", width: 80 },
  { title: "药品名称", dataIndex: "medicineName" },
  { title: "销售量", dataIndex: "totalQuantity", width: 120 },
  { title: "销售额", slotName: "totalAmount", width: 140 },
];

// 加载仪表盘指标
const loadMetrics = async () => {
  const result = await reportApi.getDashboardMetrics();
  metricsCards.value = [
    {
      title: "今日销售额",
      value: `¥${Number(result.todaySalesAmount || 0).toFixed(2)}`,
      desc: `今日订单 ${result.todayOrderCount || 0} 笔`,
    },
    {
      title: "库存总价值",
      value: `¥${Number(result.totalInventoryValue || 0).toFixed(2)}`,
      desc: "当前库存商品总价值",
    },
    {
      title: "缺货预警",
      value: `${result.lowStockCount || 0} 种`,
      desc: "低于安全库存的药品",
    },
    {
      title: "临期预警",
      value: `${result.expiringSoonCount || 0} 批次`,
      desc: "30 天内到期批次",
    },
  ];
  shortageCount.value = result.lowStockCount || 0;
  expiringCount.value = result.expiringSoonCount || 0;
};

// 加载销售趋势
const loadSalesTrend = async () => {
  const result = await reportApi.getSalesTrend(trendDays.value);
  renderSalesTrendChart(result);
};

// 加载库存分类占比
const loadCategoryPie = async () => {
  const result = await reportApi.getCategoryInventoryPieData();
  renderCategoryPieChart(result);
};

// 加载出入库流水
const loadInOutFlow = async () => {
  const result = await reportApi.getInOutFlowTrend(flowDays.value);
  renderInOutFlowChart(result);
};

// 加载销售排行
const loadSalesRanking = async () => {
  const result = await reportApi.getSalesRanking({ limit: 10, sortBy: "quantity" });
  salesRanking.value = (result || []).map((item: any, index: number) => ({
    ...item,
    index: index + 1,
  }));
};

// 渲染销售趋势图表
const renderSalesTrendChart = (data: any[]) => {
  if (!salesTrendChart.value) return;
  const chart = echarts.init(salesTrendChart.value);
  chartInstances.push(chart);
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((item: any) => item.date),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "销售额",
        type: "line",
        smooth: true,
        data: data.map((item: any) => Number(item.salesAmount || 0).toFixed(2)),
        itemStyle: { color: "#16a34a" },
      },
      {
        name: "销售量",
        type: "bar",
        data: data.map((item: any) => item.salesQuantity || 0),
        itemStyle: { color: "#0f766e" },
      },
    ],
  };
  chart.setOption(option);
};

// 渲染库存分类占比图表
const renderCategoryPieChart = (data: any[]) => {
  if (!categoryPieChart.value) return;
  const chart = echarts.init(categoryPieChart.value);
  chartInstances.push(chart);
  const option = {
    tooltip: { trigger: "item", formatter: "{b}: ¥{c} ({d}%)" },
    series: [
      {
        name: "库存占比",
        type: "pie",
        radius: ["40%", "70%"],
        data: data.map((item: any) => ({
          name: item.categoryName,
          value: Number(item.value || 0).toFixed(2),
        })),
        label: { formatter: "{b}\n{d}%" },
      },
    ],
  };
  chart.setOption(option);
};

// 渲染出入库流水图表
const renderInOutFlowChart = (data: any[]) => {
  if (!inoutFlowChart.value) return;
  const chart = echarts.init(inoutFlowChart.value);
  chartInstances.push(chart);
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((item: any) => item.date),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "入库",
        type: "bar",
        stack: "total",
        data: data.map((item: any) => item.inQuantity || 0),
        itemStyle: { color: "#16a34a" },
      },
      {
        name: "出库",
        type: "bar",
        stack: "total",
        data: data.map((item: any) => item.outQuantity || 0),
        itemStyle: { color: "#f53f3f" },
      },
    ],
  };
  chart.setOption(option);
};

// 窗口大小变更时重绘图表
const handleResize = () => {
  chartInstances.forEach((chart) => chart.resize());
};

onMounted(async () => {
  await loadMetrics();
  await loadSalesTrend();
  await loadCategoryPie();
  await loadInOutFlow();
  await loadSalesRanking();
  nextTick(() => {
    window.addEventListener("resize", handleResize);
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstances.forEach((chart) => chart.dispose());
  chartInstances = [];
});
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(241, 249, 245, 0.88));
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 36px rgba(19, 59, 56, 0.08);
  text-align: center;
  padding: 24px;
}

.metric-label {
  color: #63827d;
  font-size: 14px;
}

.metric-value {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #0f766e;
}

.metric-desc {
  margin-top: 8px;
  color: #6b8784;
  font-size: 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.panel-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 36px rgba(19, 59, 56, 0.08);
}

.chart-toolbar {
  margin-bottom: 16px;
}

.chart-container {
  height: 300px;
}

.amount-text {
  font-weight: 600;
  color: #f53f3f;
}

@media (max-width: 1200px) {
  .metrics-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>