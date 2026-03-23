<template>
  <div class="page-shell">
    <a-card class="panel-card" :bordered="false">
      <div class="toolbar">
        <a-input-search v-model="query.keyword" placeholder="搜索供应商编号、名称、联系人" allow-clear @search="loadData" />
        <a-select v-model="query.ratingLevel" placeholder="评级筛选" allow-clear style="width: 160px">
          <a-option value="A">A级</a-option>
          <a-option value="B">B级</a-option>
          <a-option value="C">C级</a-option>
        </a-select>
        <a-select v-model="query.isBlacklisted" placeholder="黑名单筛选" allow-clear style="width: 160px">
          <a-option :value="0">正常供应商</a-option>
          <a-option :value="1">黑名单</a-option>
        </a-select>
        <div class="toolbar-actions">
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="openModal()">新增供应商</a-button>
        </div>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
        <template #ratingLevel="{ record }">
          <a-tag :color="record.ratingLevel === 'A' ? 'green' : record.ratingLevel === 'B' ? 'orange' : 'red'">{{ record.ratingLevel }} 级</a-tag>
        </template>
        <template #isBlacklisted="{ record }">
          <a-tag :color="record.isBlacklisted ? 'red' : 'green'">{{ record.isBlacklisted ? '黑名单' : '正常合作' }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button type="text" @click="openModal(record)">编辑</a-button>
            <a-popconfirm content="确认删除该供应商吗？" @ok="removeSupplier(record.id)">
              <a-button type="text" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" :title="form.id ? '编辑供应商' : '新增供应商'" width="720px" @ok="submitForm">
      <a-form :model="form" layout="vertical">
        <div class="form-grid">
          <a-form-item label="供应商编号">
            <a-input v-model="form.supplierCode" placeholder="请输入供应商编号" />
          </a-form-item>
          <a-form-item label="供应商名称">
            <a-input v-model="form.supplierName" placeholder="请输入供应商名称" />
          </a-form-item>
          <a-form-item label="联系人">
            <a-input v-model="form.contactPerson" placeholder="请输入联系人" />
          </a-form-item>
          <a-form-item label="联系电话">
            <a-input v-model="form.contactPhone" placeholder="请输入联系电话" />
          </a-form-item>
          <a-form-item label="资质编号">
            <a-input v-model="form.qualificationNo" placeholder="请输入资质编号" />
          </a-form-item>
          <a-form-item label="资质到期时间">
            <a-date-picker v-model="form.qualificationExpireAt" show-time value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
          </a-form-item>
          <a-form-item label="评级等级">
            <a-select v-model="form.ratingLevel">
              <a-option value="A">A级</a-option>
              <a-option value="B">B级</a-option>
              <a-option value="C">C级</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="结算周期">
            <a-input v-model="form.settlementCycle" placeholder="如 月结30天" />
          </a-form-item>
        </div>
        <a-form-item label="协议说明">
          <a-textarea v-model="form.agreementPriceRemark" placeholder="请输入价格、账期等协议说明" :auto-size="{ minRows: 3, maxRows: 5 }" />
        </a-form-item>
        <a-form-item label="黑名单状态">
          <a-radio-group v-model="form.isBlacklisted">
            <a-radio :value="0">正常合作</a-radio>
            <a-radio :value="1">加入黑名单</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { supplierApi } from "@/api";

const visible = ref(false);
const tableData = ref<any[]>([]);
const query = reactive({ current: 1, pageSize: 10, keyword: "", ratingLevel: undefined as string | undefined, isBlacklisted: undefined as number | undefined });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const createDefaultForm = () => ({
  id: undefined as number | undefined,
  supplierCode: "",
  supplierName: "",
  contactPerson: "",
  contactPhone: "",
  qualificationNo: "",
  qualificationExpireAt: "",
  ratingLevel: "A",
  settlementCycle: "月结30天",
  agreementPriceRemark: "",
  isBlacklisted: 0,
});
const form = reactive(createDefaultForm());

const columns = [
  { title: "供应商编号", dataIndex: "supplierCode" },
  { title: "供应商名称", dataIndex: "supplierName" },
  { title: "联系人", dataIndex: "contactPerson" },
  { title: "联系电话", dataIndex: "contactPhone" },
  { title: "资质到期时间", dataIndex: "qualificationExpireAt" },
  { title: "评级", slotName: "ratingLevel" },
  { title: "黑名单", slotName: "isBlacklisted" },
  { title: "操作", slotName: "actions", width: 140 },
];

const loadData = async () => {
  const result = await supplierApi.listPage(query);
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
  await supplierApi.save(form);
  Message.success(form.id ? "供应商更新成功" : "供应商新增成功");
  visible.value = false;
  loadData();
};

const removeSupplier = async (id: number) => {
  await supplierApi.remove(id);
  Message.success("供应商删除成功");
  loadData();
};

const resetQuery = () => {
  query.current = 1;
  query.keyword = "";
  query.ratingLevel = undefined;
  query.isBlacklisted = undefined;
  loadData();
};

onMounted(loadData);
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
  grid-template-columns: 1.2fr 160px 160px auto;
  gap: 16px;
  margin-bottom: 18px;
}

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
