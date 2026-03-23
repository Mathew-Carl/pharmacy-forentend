<template>
  <div class="page-shell">
    <div class="top-grid">
      <a-card class="panel-card" :bordered="false" title="收银开单">
        <a-form :model="form" layout="vertical">
          <div class="double-grid">
            <a-form-item label="会员姓名">
              <a-input v-model="form.memberName" placeholder="请输入会员姓名" />
            </a-form-item>
            <a-form-item label="会员手机号">
              <a-input v-model="form.memberPhone" placeholder="输入手机号自动识别会员" />
            </a-form-item>
            <a-form-item label="折扣率">
              <a-input-number v-model="form.discountRate" :min="0.1" :max="1" :step="0.05" :precision="2" style="width: 100%" />
            </a-form-item>
            <a-form-item label="收银员">
              <a-input v-model="form.cashierName" placeholder="请输入收银员姓名" />
            </a-form-item>
          </div>
          <a-form-item label="处方药核验">
            <a-checkbox v-model="prescriptionCheckedBoolean">购物车含处方药时，我已完成处方查验</a-checkbox>
          </a-form-item>
          <a-divider>销售明细</a-divider>
          <div v-for="(item, index) in form.items" :key="index" class="sale-item">
            <a-select v-model="item.medicineId" placeholder="请选择药品">
              <a-option v-for="medicine in medicineOptions" :key="medicine.id" :value="medicine.id">
                {{ medicine.medicineName }} / 库存 {{ medicine.totalStock }} / 售价 {{ medicine.salePrice }}
              </a-option>
            </a-select>
            <a-input-number v-model="item.quantity" :min="1" style="width: 120px" />
            <a-button type="text" status="danger" @click="removeItem(index)" :disabled="form.items.length === 1">删除</a-button>
          </div>
          <div class="sale-actions">
            <a-button @click="addItem">继续加购</a-button>
            <a-button type="primary" @click="submitSales">确认收款</a-button>
          </div>
        </a-form>
      </a-card>

      <a-card class="panel-card" :bordered="false" title="收银提示">
        <div class="tips-list">
          <div class="tip-item">支持会员手机号识别，实收金额按折扣自动计算。</div>
          <div class="tip-item">系统按最近有效期批次扣减库存，缺货时会阻止下单。</div>
          <div class="tip-item">处方药必须勾选核验后才可完成支付。</div>
          <div class="tip-item">整单退货支持原批次回库，并同步写入库存流水。</div>
          <div class="tip-item">销售订单支持 Excel 导出，方便对账与留档。</div>
        </div>
      </a-card>
    </div>

    <a-card class="panel-card" :bordered="false" title="销售订单">
      <div class="toolbar">
        <a-input-search v-model="query.keyword" placeholder="搜索订单号、会员姓名、手机号、收银员" allow-clear @search="searchOrders" />
        <div class="toolbar-actions">
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="outline" @click="exportOrders">Excel 导出</a-button>
        </div>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
        <template #orderStatus="{ record }">
          <a-tag :color="record.orderStatus === '已退货' ? 'orange' : 'green'">{{ record.orderStatus }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-button type="text" @click="openReturnModal(record)" :disabled="record.orderStatus === '已退货'">销售退货</a-button>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="returnVisible" title="销售退货" @ok="submitReturn">
      <a-form :model="returnForm" layout="vertical">
        <a-form-item label="订单号">
          <a-input :model-value="returnTarget?.orderNo || ''" disabled />
        </a-form-item>
        <a-form-item label="操作人">
          <a-input v-model="returnForm.operatorName" placeholder="请输入退货操作人" />
        </a-form-item>
        <a-form-item label="退货原因">
          <a-textarea v-model="returnForm.returnReason" :max-length="100" placeholder="请输入退货原因" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { medicineApi, salesApi } from "@/api";

const medicineOptions = ref<any[]>([]);
const tableData = ref<any[]>([]);
const query = reactive({ current: 1, pageSize: 10, keyword: "" });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const returnVisible = ref(false);
const returnTarget = ref<any>(null);
const returnForm = reactive({
  salesOrderId: "",
  operatorName: "当班收银员",
  returnReason: "顾客整单退货",
});

const createDefaultForm = () => ({
  memberName: "",
  memberPhone: "",
  discountRate: 1,
  prescriptionChecked: 0,
  cashierName: "当班收银员",
  items: [{ medicineId: undefined as number | undefined, quantity: 1 }],
});
const form = reactive(createDefaultForm());

const prescriptionCheckedBoolean = computed({
  get: () => form.prescriptionChecked === 1,
  set: (value: boolean) => {
    form.prescriptionChecked = value ? 1 : 0;
  },
});

const columns = [
  { title: "订单号", dataIndex: "orderNo", width: 190 },
  { title: "会员", dataIndex: "memberName", width: 120 },
  { title: "手机号", dataIndex: "memberPhone", width: 140 },
  { title: "实收金额", dataIndex: "actualAmount", width: 110 },
  { title: "优惠金额", dataIndex: "discountAmount", width: 110 },
  { title: "积分", dataIndex: "pointsEarned", width: 80 },
  { title: "收银员", dataIndex: "cashierName", width: 120 },
  { title: "状态", slotName: "orderStatus", width: 100 },
  { title: "销售明细", dataIndex: "itemSummary", ellipsis: true, tooltip: true },
  { title: "创建时间", dataIndex: "createTime", width: 180 },
  { title: "操作", slotName: "actions", width: 100, fixed: "right" },
];

const loadMedicineOptions = async () => {
  const result = await medicineApi.listPage({ current: 1, pageSize: 200, status: "启用" });
  medicineOptions.value = result.records;
};

const loadOrders = async () => {
  const result = await salesApi.listPage(query);
  tableData.value = result.records;
  pagination.current = result.current;
  pagination.pageSize = result.size;
  pagination.total = result.total;
};

const addItem = () => {
  form.items.push({ medicineId: undefined, quantity: 1 });
};

const removeItem = (index: number) => {
  form.items.splice(index, 1);
};

const handlePageChange = (current: number) => {
  query.current = current;
  loadOrders();
};

const searchOrders = () => {
  query.current = 1;
  loadOrders();
};

const resetForm = () => {
  Object.assign(form, createDefaultForm());
};

const resetQuery = () => {
  query.current = 1;
  query.keyword = "";
  loadOrders();
};

const submitSales = async () => {
  await salesApi.create(form);
  Message.success("收银成功，库存与积分已自动同步");
  resetForm();
  await Promise.all([loadOrders(), loadMedicineOptions()]);
};

const openReturnModal = (record: any) => {
  returnTarget.value = record;
  returnForm.salesOrderId = record.id;
  returnForm.operatorName = record.cashierName || "当班收银员";
  returnForm.returnReason = "顾客整单退货";
  returnVisible.value = true;
};

const submitReturn = async () => {
  await salesApi.returnOrder(returnForm);
  Message.success("退货成功，库存已回补到原销售批次");
  returnVisible.value = false;
  await Promise.all([loadOrders(), loadMedicineOptions()]);
};

const exportOrders = async () => {
  await salesApi.exportOrders(query);
};

onMounted(async () => {
  await loadMedicineOptions();
  await loadOrders();
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

.panel-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 36px rgba(19, 59, 56, 0.08);
}

.double-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.sale-item {
  display: grid;
  grid-template-columns: 1fr 120px 72px;
  gap: 12px;
  margin-bottom: 12px;
}

.sale-actions,
.toolbar,
.toolbar-actions {
  display: flex;
  gap: 12px;
}

.sale-actions {
  justify-content: flex-end;
}

.toolbar {
  margin-bottom: 16px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tip-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f6fbfa;
  color: #5f7e79;
}

@media (max-width: 960px) {
  .top-grid,
  .double-grid,
  .sale-item {
    grid-template-columns: 1fr;
  }

  .toolbar {
    align-items: stretch;
  }

  .toolbar-actions {
    width: 100%;
  }
}
</style>
