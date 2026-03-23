<template>
  <div class="page-shell">
    <a-card class="panel-card" :bordered="false">
      <div class="toolbar">
        <a-input-search v-model="query.keyword" placeholder="搜索药品名称、条形码、厂家" allow-clear @search="loadData" />
        <a-select v-model="query.categoryId" placeholder="分类筛选" allow-clear style="width: 220px">
          <a-option v-for="item in categoryOptions" :key="item.id" :value="item.id">{{ item.categoryName }}</a-option>
        </a-select>
        <div class="toolbar-actions">
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="openModal()">新增药品</a-button>
        </div>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
        <template #isPrescription="{ record }">
          <a-tag :color="record.isPrescription ? 'orange' : 'green'">{{ record.isPrescription ? '处方药' : '普通药' }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button type="text" @click="openModal(record)">编辑</a-button>
            <a-popconfirm content="确认删除该药品吗？" @ok="removeMedicine(record.id)">
              <a-button type="text" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" :title="form.id ? '编辑药品' : '新增药品'" width="720px" @ok="submitForm">
      <a-form :model="form" layout="vertical">
        <div class="form-grid">
          <a-form-item field="categoryId" label="药品分类">
            <a-select v-model="form.categoryId" placeholder="请选择分类">
              <a-option v-for="item in categoryOptions" :key="item.id" :value="item.id">{{ item.categoryName }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item field="medicineName" label="药品名称">
            <a-input v-model="form.medicineName" placeholder="请输入药品名称" />
          </a-form-item>
          <a-form-item field="specification" label="规格">
            <a-input v-model="form.specification" placeholder="如 0.5g*24片" />
          </a-form-item>
          <a-form-item field="manufacturer" label="生产厂家">
            <a-input v-model="form.manufacturer" placeholder="请输入生产厂家" />
          </a-form-item>
          <a-form-item field="barcode" label="条形码">
            <a-input v-model="form.barcode" placeholder="请输入 8-18 位数字条形码" />
          </a-form-item>
          <a-form-item field="approvalNumber" label="批准文号">
            <a-input v-model="form.approvalNumber" placeholder="请输入批准文号" />
          </a-form-item>
          <a-form-item field="unitName" label="单位">
            <a-input v-model="form.unitName" placeholder="如 盒、瓶、支" />
          </a-form-item>
          <a-form-item field="salePrice" label="销售单价">
            <a-input-number v-model="form.salePrice" :min="0" :precision="2" style="width: 100%" />
          </a-form-item>
          <a-form-item field="shelfLifeDays" label="保质期（天）">
            <a-input-number v-model="form.shelfLifeDays" :min="1" style="width: 100%" />
          </a-form-item>
          <a-form-item field="safeStockMin" label="安全库存下限">
            <a-input-number v-model="form.safeStockMin" :min="0" style="width: 100%" />
          </a-form-item>
          <a-form-item field="safeStockMax" label="安全库存上限">
            <a-input-number v-model="form.safeStockMax" :min="0" style="width: 100%" />
          </a-form-item>
          <a-form-item field="status" label="状态">
            <a-select v-model="form.status">
              <a-option value="启用">启用</a-option>
              <a-option value="停用">停用</a-option>
            </a-select>
          </a-form-item>
        </div>
        <a-form-item field="isPrescription" label="处方属性">
          <a-radio-group v-model="form.isPrescription">
            <a-radio :value="0">普通药</a-radio>
            <a-radio :value="1">处方药</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { categoryApi, medicineApi } from "@/api";

const visible = ref(false);
const tableData = ref<any[]>([]);
const categoryOptions = ref<any[]>([]);
const query = reactive({ current: 1, pageSize: 10, keyword: "", categoryId: undefined as number | undefined });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const createDefaultForm = () => ({
  id: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  medicineName: "",
  specification: "",
  manufacturer: "",
  barcode: "",
  approvalNumber: "",
  unitName: "盒",
  salePrice: 0,
  shelfLifeDays: 365,
  safeStockMin: 10,
  safeStockMax: 200,
  isPrescription: 0,
  status: "启用",
});
const form = reactive(createDefaultForm());

const columns = [
  { title: "药品名称", dataIndex: "medicineName" },
  { title: "分类", dataIndex: "categoryName" },
  { title: "规格", dataIndex: "specification" },
  { title: "厂家", dataIndex: "manufacturer" },
  { title: "条形码", dataIndex: "barcode" },
  { title: "售价", dataIndex: "salePrice" },
  { title: "库存", dataIndex: "totalStock" },
  { title: "处方属性", slotName: "isPrescription" },
  { title: "操作", slotName: "actions", width: 140 },
];

const loadCategories = async () => {
  const result = await categoryApi.listPage({ current: 1, pageSize: 100 });
  categoryOptions.value = result.records;
};

const loadData = async () => {
  const result = await medicineApi.listPage(query);
  tableData.value = result.records;
  pagination.current = result.current;
  pagination.pageSize = result.size;
  pagination.total = result.total;
};

const handlePageChange = (current: number) => {
  query.current = current;
  loadData();
};

const resetForm = () => {
  Object.assign(form, createDefaultForm());
};

const openModal = (record?: any) => {
  resetForm();
  if (record) {
    Object.assign(form, record);
  }
  visible.value = true;
};

const submitForm = async () => {
  await medicineApi.save(form);
  Message.success(form.id ? "药品更新成功" : "药品新增成功");
  visible.value = false;
  loadData();
};

const removeMedicine = async (id: number) => {
  await medicineApi.remove(id);
  Message.success("药品删除成功");
  loadData();
};

const resetQuery = () => {
  query.current = 1;
  query.keyword = "";
  query.categoryId = undefined;
  loadData();
};

onMounted(async () => {
  await loadCategories();
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
  grid-template-columns: 1.4fr 220px auto;
  gap: 16px;
  margin-bottom: 18px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

@media (max-width: 900px) {
  .toolbar,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
