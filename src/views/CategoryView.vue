<template>
  <div class="page-shell">
    <a-card class="panel-card" :bordered="false">
      <div class="toolbar">
        <a-input-search v-model="query.keyword" placeholder="请输入分类名称或描述" allow-clear @search="loadData" />
        <div class="toolbar-actions">
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="openModal()">新增分类</a-button>
        </div>
      </div>
      <a-table :data="tableData" :pagination="pagination" :columns="columns" @page-change="handlePageChange">
        <template #actions="{ record }">
          <a-space>
            <a-button type="text" @click="openModal(record)">编辑</a-button>
            <a-popconfirm content="确认删除该分类吗？" @ok="removeCategory(record.id)">
              <a-button type="text" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" :title="form.id ? '编辑分类' : '新增分类'" @ok="submitForm">
      <a-form :model="form" layout="vertical">
        <a-form-item field="categoryName" label="分类名称">
          <a-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item field="categoryRemark" label="分类描述">
          <a-textarea v-model="form.categoryRemark" placeholder="请输入分类描述" :auto-size="{ minRows: 3, maxRows: 5 }" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { categoryApi } from "@/api";

const visible = ref(false);
const tableData = ref<any[]>([]);
const query = reactive({ current: 1, pageSize: 10, keyword: "" });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const form = reactive({ id: undefined as number | undefined, categoryName: "", categoryRemark: "" });

const columns = [
  { title: "分类名称", dataIndex: "categoryName" },
  { title: "分类描述", dataIndex: "categoryRemark" },
  { title: "创建时间", dataIndex: "createTime" },
  { title: "更新时间", dataIndex: "updateTime" },
  { title: "操作", slotName: "actions", width: 140 },
];

const loadData = async () => {
  const result = await categoryApi.listPage(query);
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
  form.id = undefined;
  form.categoryName = "";
  form.categoryRemark = "";
};

const openModal = (record?: any) => {
  resetForm();
  if (record) {
    Object.assign(form, record);
  }
  visible.value = true;
};

const submitForm = async () => {
  await categoryApi.save(form);
  Message.success(form.id ? "分类更新成功" : "分类新增成功");
  visible.value = false;
  loadData();
};

const removeCategory = async (id: number) => {
  await categoryApi.remove(id);
  Message.success("分类删除成功");
  loadData();
};

const resetQuery = () => {
  query.current = 1;
  query.keyword = "";
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
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
  }
}
</style>
