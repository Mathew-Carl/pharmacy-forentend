<template>
  <div class="page-shell">
    <!-- 列表模式 -->
    <a-card v-if="mode === 'list'" class="panel-card" :bordered="false">
      <div class="toolbar">
        <a-input-search v-model="query.orderNo" placeholder="搜索采购单号" allow-clear @search="loadData" style="width: 220px" />
        <a-select v-model="query.supplierId" placeholder="选择供应商" allow-clear style="width: 200px" @change="loadData">
          <a-option v-for="item in supplierOptions" :key="item.id" :value="item.id">{{ item.supplierName }}</a-option>
        </a-select>
        <a-select v-model="query.orderStatus" placeholder="订单状态" allow-clear style="width: 160px" @change="loadData">
          <a-option value="待审核">待审核</a-option>
          <a-option value="审核通过">审核通过</a-option>
          <a-option value="审核不通过">审核不通过</a-option>
          <a-option value="已完成">已完成</a-option>
        </a-select>
        <a-range-picker v-model="dateRange" style="width: 240px" @change="handleDateChange" />
        <div class="toolbar-actions">
          <a-button @click="resetQuery">重置</a-button>
          <a-button v-if="canAdd" type="primary" @click="mode = 'create'">新建采购单</a-button>
          <a-button v-if="canExport" type="outline" @click="exportOrders">Excel 导出</a-button>
        </div>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
        <template #orderStatus="{ record }">
          <a-tag :color="getStatusColor(record.orderStatus)">{{ record.orderStatus }}</a-tag>
        </template>
        <template #totalAmount="{ record }">
          <span class="amount-text">¥{{ Number(record.totalAmount || 0).toFixed(2) }}</span>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button type="text" @click="viewDetail(record)">详情</a-button>
            <a-button v-if="record.orderStatus === '待审核' && canAudit" type="text" @click="openAudit(record)">审核</a-button>
            <a-button v-if="record.orderStatus === '审核通过' && canInbound" type="text" @click="openInbound(record)">入库</a-button>
            <a-button v-if="record.orderStatus === '待审核' && canDelete" type="text" status="danger" @click="removeOrder(record.id)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/详情模式 -->
    <a-card v-else class="panel-card" :bordered="false">
      <template #title>
        <a-space>
          <a-button type="text" @click="mode = 'list'">
            <icon-arrow-left />
          </a-button>
          <span>{{ mode === 'create' ? '新建采购单' : '采购订单详情' }}</span>
        </a-space>
      </template>

      <a-form :model="form" layout="vertical">
        <div class="form-header">
          <a-form-item label="供应商" required style="width: 300px">
            <a-select v-model="form.supplierId" placeholder="请选择供应商" :disabled="mode === 'detail'">
              <a-option v-for="item in supplierOptions" :key="item.id" :value="item.id">{{ item.supplierName }}</a-option>
            </a-select>
          </a-form-item>
          <a-button v-if="mode === 'create'" type="primary" @click="openSuggestions">
            <icon-robot-add />
            智能补货
          </a-button>
        </div>

        <a-divider>采购明细</a-divider>

        <a-table :data="form.items" :pagination="false" class="items-table">
          <template #columns>
            <a-table-column title="药品" width="300">
              <template #cell="{ record, rowIndex }">
                <a-select v-model="record.medicineId" placeholder="选择药品" :disabled="mode === 'detail'" @change="handleMedicineChange(rowIndex)">
                  <a-option v-for="item in medicineOptions" :key="item.id" :value="item.id">
                    {{ item.medicineName }} / 库存 {{ item.totalStock }}
                  </a-option>
                </a-select>
              </template>
            </a-table-column>
            <a-table-column title="数量" width="150">
              <template #cell="{ record }">
                <a-input-number v-model="record.quantity" :min="1" style="width: 100%" :disabled="mode === 'detail'" />
              </template>
            </a-table-column>
            <a-table-column title="单价" width="150">
              <template #cell="{ record }">
                <a-input-number v-model="record.purchasePrice" :min="0" :precision="2" style="width: 100%" :disabled="mode === 'detail'" />
              </template>
            </a-table-column>
            <a-table-column title="金额" width="150">
              <template #cell="{ record }">
                <span class="amount-text">¥{{ calculateLineAmount(record) }}</span>
              </template>
            </a-table-column>
            <a-table-column v-if="mode === 'create'" title="操作" width="100">
              <template #cell="{ rowIndex }">
                <a-button type="text" status="danger" @click="removeItem(rowIndex)" :disabled="form.items.length === 1">删除</a-button>
              </template>
            </a-table-column>
          </template>
        </a-table>

        <div v-if="mode === 'create'" class="items-actions">
          <a-button @click="addItem"><icon-plus /> 添加商品</a-button>
        </div>

        <a-divider />

        <div class="form-footer">
          <a-form-item label="备注">
            <a-textarea v-model="form.remark" placeholder="请输入备注信息" :auto-size="{ minRows: 3, maxRows: 5 }" style="width: 500px" :disabled="mode === 'detail'" />
          </a-form-item>
          <a-form-item v-if="mode === 'create'">
            <a-space>
              <a-button type="primary" @click="submitForm">提交订单</a-button>
              <a-button @click="mode = 'list'">取消</a-button>
            </a-space>
          </a-form-item>
        </div>
      </a-form>
    </a-card>

    <!-- 审核对话框 -->
    <a-modal v-model:visible="auditVisible" title="审核采购订单" @ok="submitAudit">
      <a-form :model="auditForm" layout="vertical">
        <a-form-item label="审核结果">
          <a-radio-group v-model="auditForm.auditResult">
            <a-radio value="pass">通过</a-radio>
            <a-radio value="reject">拒绝</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="审核意见">
          <a-textarea v-model="auditForm.auditOpinion" placeholder="请输入审核意见" :auto-size="{ minRows: 3, maxRows: 5 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 入库对话框 -->
    <a-modal v-model:visible="inboundVisible" title="采购入库确认" @ok="submitInbound">
      <a-form :model="inboundForm" layout="vertical">
        <a-form-item label="操作人姓名" required>
          <a-input v-model="inboundForm.operatorName" placeholder="请输入操作人姓名" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model="inboundForm.remark" placeholder="可选" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 智能补货对话框 -->
    <a-modal v-model:visible="suggestionVisible" title="智能补货建议" width="900px" @ok="applySuggestions">
      <a-table :data="suggestionList" :columns="suggestionColumns" :row-selection="{ selectedRowKeys, onChange: onSelectionChange }">
        <template #currentStock="{ record }">
          <a-tag :color="record.currentStock <= record.safeStockMin ? 'red' : 'green'">{{ record.currentStock }}</a-tag>
        </template>
        <template #suggestedQuantity="{ record }">
          <span class="highlight-text">{{ record.suggestedQuantity }}</span>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Message, Modal } from "@arco-design/web-vue";
import { purchaseApi, supplierApi, medicineApi } from "@/api";
import { hasButtonPermission } from "@/utils/auth";

// 页面模式：list | create | detail
const mode = ref<"list" | "create" | "detail">("list");

// 权限控制
const canAdd = computed(() => hasButtonPermission("purchase:add"));
const canAudit = computed(() => hasButtonPermission("purchase:audit"));
const canInbound = computed(() => hasButtonPermission("purchase:inbound"));
const canDelete = computed(() => hasButtonPermission("purchase:delete"));
const canExport = computed(() => hasButtonPermission("purchase:export"));

// 查询参数
const query = reactive({
  current: 1,
  pageSize: 10,
  orderNo: "",
  supplierId: undefined as number | undefined,
  orderStatus: undefined as string | undefined,
  startTime: "",
  endTime: "",
});

const dateRange = ref<[string, string] | null>(null);
const tableData = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const supplierOptions = ref<any[]>([]);
const medicineOptions = ref<any[]>([]);

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  supplierId: undefined as number | undefined,
  items: [{ medicineId: undefined as number | undefined, quantity: 1, purchasePrice: 0 }],
  remark: "",
});

// 对话框
const auditVisible = ref(false);
const auditForm = reactive({ orderId: undefined as number | undefined, auditResult: "pass", auditOpinion: "" });
const inboundVisible = ref(false);
const inboundForm = reactive({ orderId: undefined as number | undefined, operatorName: "", remark: "" });
const suggestionVisible = ref(false);
const suggestionList = ref<any[]>([]);
const selectedRowKeys = ref<number[]>([]);

const columns = [
  { title: "采购单号", dataIndex: "orderNo", width: 180 },
  { title: "供应商", dataIndex: "supplierName", width: 200 },
  { title: "总金额", slotName: "totalAmount", width: 120 },
  { title: "总数量", dataIndex: "totalCount", width: 100 },
  { title: "状态", slotName: "orderStatus", width: 120 },
  { title: "审核人", dataIndex: "auditorName", width: 120 },
  { title: "审核时间", dataIndex: "auditTime", width: 180 },
  { title: "创建时间", dataIndex: "createTime", width: 180 },
  { title: "操作", slotName: "actions", width: 280, fixed: "right" },
];

const suggestionColumns = [
  { title: "药品名称", dataIndex: "medicineName" },
  { title: "规格", dataIndex: "specification", width: 120 },
  { title: "当前库存", slotName: "currentStock", width: 100 },
  { title: "安全库存", dataIndex: "safeStockMin", width: 100 },
  { title: "建议采购量", slotName: "suggestedQuantity", width: 120 },
  { title: "参考单价", dataIndex: "referencePrice", width: 100 },
];

// 加载数据
const loadSuppliers = async () => {
  const result = await supplierApi.listPage({ current: 1, pageSize: 100 });
  supplierOptions.value = result.records || [];
};

const loadMedicines = async () => {
  const result = await medicineApi.listPage({ current: 1, pageSize: 500, status: "启用" });
  medicineOptions.value = result.records || [];
};

const loadData = async () => {
  const result = await purchaseApi.listPage(query);
  tableData.value = result.records || [];
  pagination.current = result.current;
  pagination.pageSize = result.size;
  pagination.total = result.total;
};

const handleDateChange = (value: [string, string] | null) => {
  query.startTime = value?.[0] || "";
  query.endTime = value?.[1] || "";
  query.current = 1;
  loadData();
};

const handlePageChange = (current: number) => {
  query.current = current;
  loadData();
};

const resetQuery = () => {
  query.current = 1;
  query.orderNo = "";
  query.supplierId = undefined;
  query.orderStatus = undefined;
  query.startTime = "";
  query.endTime = "";
  dateRange.value = null;
  loadData();
};

// 表单操作
const addItem = () => {
  form.items.push({ medicineId: undefined, quantity: 1, purchasePrice: 0 });
};

const removeItem = (index: number) => {
  form.items.splice(index, 1);
};

const handleMedicineChange = (index: number) => {
  const item = form.items[index];
  const medicine = medicineOptions.value.find((m) => m.id === item.medicineId);
  if (medicine) {
    item.purchasePrice = Number(medicine.salePrice || 0) * 0.7;
  }
};

const calculateLineAmount = (record: any) => {
  return ((record.quantity || 0) * (record.purchasePrice || 0)).toFixed(2);
};

const resetForm = () => {
  form.id = undefined;
  form.supplierId = undefined;
  form.items = [{ medicineId: undefined, quantity: 1, purchasePrice: 0 }];
  form.remark = "";
};

// 查看详情
const viewDetail = async (record: any) => {
  const result = await purchaseApi.detail(record.id);
  form.id = result.id;
  form.supplierId = result.supplierId;
  form.items = result.items || [];
  form.remark = result.auditOpinion || "";
  mode.value = "detail";
};

// 提交创建
const submitForm = async () => {
  if (!form.supplierId) {
    Message.warning("请选择供应商");
    return;
  }
  const validItems = form.items.filter((item) => item.medicineId && item.quantity > 0);
  if (validItems.length === 0) {
    Message.warning("请添加采购商品");
    return;
  }
  form.items = validItems;
  await purchaseApi.create(form);
  Message.success("采购单创建成功");
  resetForm();
  mode.value = "list";
  loadData();
};

// 审核
const openAudit = (record: any) => {
  auditForm.orderId = record.id;
  auditForm.auditResult = "pass";
  auditForm.auditOpinion = "";
  auditVisible.value = true;
};

const submitAudit = async () => {
  await purchaseApi.audit(auditForm);
  Message.success("审核成功");
  auditVisible.value = false;
  loadData();
};

// 入库
const openInbound = (record: any) => {
  inboundForm.orderId = record.id;
  inboundForm.operatorName = "";
  inboundForm.remark = "";
  inboundVisible.value = true;
};

const submitInbound = async () => {
  if (!inboundForm.operatorName) {
    Message.warning("请输入操作人姓名");
    return;
  }
  await purchaseApi.confirmInbound(inboundForm.orderId!, inboundForm);
  Message.success("入库成功");
  inboundVisible.value = false;
  loadData();
};

// 删除
const removeOrder = (id: number) => {
  Modal.confirm({
    title: "确认删除",
    content: "确定要删除该采购订单吗？",
    onOk: async () => {
      await purchaseApi.remove(id);
      Message.success("删除成功");
      loadData();
    },
  });
};

// 智能补货
const openSuggestions = async () => {
  const result = await purchaseApi.getSuggestions();
  suggestionList.value = result || [];
  if (suggestionList.value.length === 0) {
    Message.info("暂无需要补货的药品");
    return;
  }
  suggestionVisible.value = true;
};

const onSelectionChange = (keys: (number | string)[]) => {
  selectedRowKeys.value = keys as number[];
};

const applySuggestions = () => {
  const selectedMedicines = suggestionList.value.filter((_, index) => selectedRowKeys.value.includes(index + 1));
  if (selectedMedicines.length === 0) {
    Message.warning("请至少选择一种药品");
    return;
  }
  selectedMedicines.forEach((med) => {
    form.items.push({
      medicineId: med.medicineId,
      quantity: med.suggestedQuantity,
      purchasePrice: med.referencePrice,
    });
  });
  suggestionVisible.value = false;
  Message.success(`已添加 ${selectedMedicines.length} 种药品`);
};

// 导出
const exportOrders = () => {
  purchaseApi.exportOrders(query);
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    待审核:"orange",
    审核通过:"green",
    审核不通过:"red",
    已完成:"arcoblue",
  };
  return colorMap[status] || "gray";
};

onMounted(async () => {
  await loadSuppliers();
  await loadMedicines();
  await loadData();
});
</script>

<style scoped>
.page-shell {
  display: flex;
}

.panel-card {
  width: 100%;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 36px rgba(19, 59, 56, 0.08);
}

.toolbar {
  display: grid;
  grid-template-columns: 220px 200px 160px 240px auto;
  gap: 16px;
  margin-bottom: 18px;
  align-items: center;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.items-table {
  margin-bottom: 16px;
}

.items-actions {
  margin-bottom: 24px;
}

.form-footer {
  margin-top: 24px;
}

.amount-text {
  font-weight: 600;
  color: #f53f3f;
}

.highlight-text {
  font-weight: 600;
  color: #165dff;
}

@media (max-width: 1200px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>