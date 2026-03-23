<template>
  <div class="page-shell">
    <div class="top-grid">
      <a-card class="panel-card" :bordered="false" title="库存查询">
        <div class="toolbar">
          <a-input-search v-model="query.keyword" placeholder="搜索药品名称或条形码" allow-clear @search="searchInventory" />
          <div class="toolbar-actions">
            <a-button @click="resetQuery">重置</a-button>
          </div>
        </div>
        <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
          <template #stockStatus="{ record }">
            <a-tag :color="resolveStatusColor(record.stockStatus)">{{ record.stockStatus }}</a-tag>
          </template>
        </a-table>
      </a-card>

      <a-card class="panel-card" :bordered="false" title="库存预警">
        <a-empty v-if="!alerts.length" description="暂无预警" />
        <div v-else class="alert-list">
          <div v-for="item in alerts" :key="`${item.alertType}-${item.medicineId}-${item.content}`" class="alert-item">
            <div>
              <div class="alert-title">{{ item.medicineName }}</div>
              <div class="alert-desc">{{ item.content }}</div>
            </div>
            <a-tag :color="item.levelTag === '高' ? 'red' : 'orange'">{{ item.alertType }}</a-tag>
          </div>
        </div>
      </a-card>
    </div>

    <div class="top-grid form-grid">
      <a-card class="panel-card" :bordered="false" title="入库处理">
        <a-form :model="stockInForm" layout="vertical">
          <a-form-item label="药品">
            <a-select v-model="stockInForm.medicineId" placeholder="请选择药品">
              <a-option v-for="item in medicineOptions" :key="item.id" :value="item.id">{{ item.medicineName }}</a-option>
            </a-select>
          </a-form-item>
          <div class="double-grid">
            <a-form-item label="供应商">
              <a-select v-model="stockInForm.supplierId" placeholder="请选择供应商" allow-clear>
                <a-option v-for="item in supplierOptions" :key="item.id" :value="item.id">{{ item.supplierName }}</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="业务类型">
              <a-select v-model="stockInForm.bizType">
                <a-option value="采购入库">采购入库</a-option>
                <a-option value="生产入库">生产入库</a-option>
                <a-option value="其他入库">其他入库</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="批次号">
              <a-input v-model="stockInForm.batchNo" placeholder="请输入批次号" />
            </a-form-item>
            <a-form-item label="存放位置">
              <a-input v-model="stockInForm.storageLocation" placeholder="如 A-01-03" />
            </a-form-item>
            <a-form-item label="生产日期">
              <a-date-picker v-model="stockInForm.productionDate" value-format="YYYY-MM-DD" style="width: 100%" />
            </a-form-item>
            <a-form-item label="有效期">
              <a-date-picker v-model="stockInForm.expiryDate" value-format="YYYY-MM-DD" style="width: 100%" />
            </a-form-item>
            <a-form-item label="数量">
              <a-input-number v-model="stockInForm.quantity" :min="1" style="width: 100%" />
            </a-form-item>
            <a-form-item label="进货价">
              <a-input-number v-model="stockInForm.purchasePrice" :min="0" :precision="2" style="width: 100%" />
            </a-form-item>
          </div>
          <a-form-item label="备注">
            <a-input v-model="stockInForm.remark" placeholder="请输入备注" />
          </a-form-item>
          <a-button type="primary" long @click="submitStockIn">确认入库</a-button>
        </a-form>
      </a-card>

      <a-card class="panel-card" :bordered="false" title="出库处理">
        <a-form :model="stockOutForm" layout="vertical">
          <a-form-item label="药品">
            <a-select v-model="stockOutForm.medicineId" placeholder="请选择药品">
              <a-option v-for="item in medicineOptions" :key="item.id" :value="item.id">{{ item.medicineName }}</a-option>
            </a-select>
          </a-form-item>
          <div class="double-grid">
            <a-form-item label="业务类型">
              <a-select v-model="stockOutForm.bizType">
                <a-option value="销售出库">销售出库</a-option>
                <a-option value="领用出库">领用出库</a-option>
                <a-option value="报损出库">报损出库</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="出库数量">
              <a-input-number v-model="stockOutForm.quantity" :min="1" style="width: 100%" />
            </a-form-item>
            <a-form-item label="关联单号">
              <a-input v-model="stockOutForm.documentNo" placeholder="如 SO202603190001" />
            </a-form-item>
            <a-form-item label="操作人">
              <a-input v-model="stockOutForm.operatorName" placeholder="请输入操作人" />
            </a-form-item>
          </div>
          <a-form-item label="备注">
            <a-input v-model="stockOutForm.remark" placeholder="请输入备注" />
          </a-form-item>
          <a-button type="primary" status="warning" long @click="submitStockOut">确认出库</a-button>
        </a-form>
      </a-card>
    </div>

    <a-card class="panel-card" :bordered="false" title="库存流水">
      <div class="flow-filters">
        <a-input v-model="flowQuery.keyword" allow-clear placeholder="搜索药品、单号、备注、操作人" />
        <a-select v-model="flowQuery.bizType" allow-clear placeholder="业务类型">
          <a-option value="采购入库">采购入库</a-option>
          <a-option value="生产入库">生产入库</a-option>
          <a-option value="其他入库">其他入库</a-option>
          <a-option value="销售出库">销售出库</a-option>
          <a-option value="领用出库">领用出库</a-option>
          <a-option value="报损出库">报损出库</a-option>
          <a-option value="销售退货回库">销售退货回库</a-option>
        </a-select>
        <a-select v-model="flowQuery.changeType" allow-clear placeholder="变动方向">
          <a-option value="入库">入库</a-option>
          <a-option value="出库">出库</a-option>
        </a-select>
        <a-input v-model="flowQuery.operatorName" allow-clear placeholder="操作人" />
        <a-range-picker v-model="flowDateRange" value-format="YYYY-MM-DD HH:mm:ss" show-time style="width: 320px" />
        <div class="toolbar-actions">
          <a-button type="primary" @click="searchFlow">查询流水</a-button>
          <a-button @click="resetFlowQuery">重置</a-button>
          <a-button type="outline" @click="exportFlow">Excel 导出</a-button>
        </div>
      </div>
      <a-table :data="flowData" :columns="flowColumns" :pagination="flowPagination" @page-change="handleFlowPageChange">
        <template #changeType="{ record }">
          <a-tag :color="record.changeType === '入库' ? 'green' : 'red'">{{ record.changeType }}</a-tag>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { inventoryApi, medicineApi, supplierApi } from "@/api";

const tableData = ref<any[]>([]);
const alerts = ref<any[]>([]);
const medicineOptions = ref<any[]>([]);
const supplierOptions = ref<any[]>([]);
const flowData = ref<any[]>([]);
const flowDateRange = ref<string[]>([]);

const query = reactive({ current: 1, pageSize: 10, keyword: "" });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const flowQuery = reactive({
  current: 1,
  pageSize: 10,
  keyword: "",
  bizType: "",
  changeType: "",
  operatorName: "",
  startTime: "",
  endTime: "",
});
const flowPagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });

const stockInForm = reactive({
  medicineId: undefined as number | undefined,
  supplierId: undefined as number | undefined,
  batchNo: "",
  productionDate: "",
  expiryDate: "",
  storageLocation: "",
  quantity: 1,
  purchasePrice: 0,
  bizType: "采购入库",
  operatorName: "库管员",
  remark: "",
});

const stockOutForm = reactive({
  medicineId: undefined as number | undefined,
  quantity: 1,
  bizType: "销售出库",
  operatorName: "库管员",
  documentNo: "",
  remark: "",
});

const columns = [
  { title: "药品名称", dataIndex: "medicineName" },
  { title: "分类", dataIndex: "categoryName" },
  { title: "条形码", dataIndex: "barcode" },
  { title: "当前库存", dataIndex: "totalStock" },
  { title: "安全下限", dataIndex: "safeStockMin" },
  { title: "批次数", dataIndex: "batchCount" },
  { title: "近效期批次", dataIndex: "nearExpiryCount" },
  { title: "状态", slotName: "stockStatus" },
];

const flowColumns = [
  { title: "药品名称", dataIndex: "medicineName", width: 160 },
  { title: "批次号", dataIndex: "batchNo", width: 120 },
  { title: "业务类型", dataIndex: "bizType", width: 130 },
  { title: "方向", slotName: "changeType", width: 90 },
  { title: "数量", dataIndex: "quantity", width: 80 },
  { title: "单价", dataIndex: "unitPrice", width: 90 },
  { title: "关联单号", dataIndex: "documentNo", width: 180 },
  { title: "操作人", dataIndex: "operatorName", width: 120 },
  { title: "备注", dataIndex: "remark", ellipsis: true, tooltip: true },
  { title: "创建时间", dataIndex: "createTime", width: 180 },
];

const resolveStatusColor = (status: string) => {
  if (status === "缺货预警") return "red";
  if (status === "近效期预警") return "orange";
  return "green";
};

const loadOptions = async () => {
  const [medicineResult, supplierResult] = await Promise.all([
    medicineApi.listPage({ current: 1, pageSize: 200 }),
    supplierApi.listPage({ current: 1, pageSize: 200 }),
  ]);
  medicineOptions.value = medicineResult.records;
  supplierOptions.value = supplierResult.records;
};

const loadInventory = async () => {
  const result = await inventoryApi.listPage(query);
  tableData.value = result.records;
  pagination.current = result.current;
  pagination.pageSize = result.size;
  pagination.total = result.total;
};

const loadAlerts = async () => {
  alerts.value = await inventoryApi.getAlerts();
};

const syncFlowTime = () => {
  flowQuery.startTime = flowDateRange.value?.[0] || "";
  flowQuery.endTime = flowDateRange.value?.[1] || "";
};

const loadFlow = async () => {
  syncFlowTime();
  const result = await inventoryApi.listFlowPage(flowQuery);
  flowData.value = result.records;
  flowPagination.current = result.current;
  flowPagination.pageSize = result.size;
  flowPagination.total = result.total;
};

const handlePageChange = (current: number) => {
  query.current = current;
  loadInventory();
};

const handleFlowPageChange = (current: number) => {
  flowQuery.current = current;
  loadFlow();
};

const searchInventory = () => {
  query.current = 1;
  loadInventory();
};

const resetQuery = () => {
  query.current = 1;
  query.keyword = "";
  loadInventory();
};

const searchFlow = () => {
  flowQuery.current = 1;
  loadFlow();
};

const resetFlowQuery = () => {
  flowQuery.current = 1;
  flowQuery.keyword = "";
  flowQuery.bizType = "";
  flowQuery.changeType = "";
  flowQuery.operatorName = "";
  flowQuery.startTime = "";
  flowQuery.endTime = "";
  flowDateRange.value = [];
  loadFlow();
};

const submitStockIn = async () => {
  await inventoryApi.stockIn(stockInForm);
  Message.success("入库成功");
  await Promise.all([loadInventory(), loadAlerts(), loadFlow()]);
};

const submitStockOut = async () => {
  await inventoryApi.stockOut(stockOutForm);
  Message.success("出库成功");
  await Promise.all([loadInventory(), loadAlerts(), loadFlow()]);
};

const exportFlow = async () => {
  syncFlowTime();
  await inventoryApi.exportFlow(flowQuery);
};

onMounted(async () => {
  await loadOptions();
  await Promise.all([loadInventory(), loadAlerts(), loadFlow()]);
});
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.top-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 36px rgba(19, 59, 56, 0.08);
}

.toolbar,
.toolbar-actions,
.flow-filters {
  display: flex;
  gap: 12px;
}

.toolbar {
  margin-bottom: 16px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.flow-filters {
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.double-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f6fbfa;
  align-items: center;
}

.alert-title {
  font-weight: 700;
}

.alert-desc {
  margin-top: 6px;
  color: #6b8784;
}

@media (max-width: 960px) {
  .top-grid,
  .form-grid,
  .double-grid {
    grid-template-columns: 1fr;
  }

  .toolbar,
  .flow-filters {
    align-items: stretch;
  }
}
</style>
