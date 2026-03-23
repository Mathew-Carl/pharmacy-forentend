<template>
  <div class="page-shell">
    <a-card class="panel-card" :bordered="false">
      <div class="toolbar">
        <a-input-search v-model="query.keyword" placeholder="搜索角色名称、编码、描述" allow-clear @search="loadData" />
        <div class="toolbar-actions">
          <a-button @click="loadData">查询</a-button>
          <a-button v-if="canAdd" type="primary" @click="openModal()">新增角色</a-button>
        </div>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
        <template #menuPermissions="{ record }">{{ record.menuPermissions?.join('、') }}</template>
        <template #buttonPermissions="{ record }">{{ record.buttonPermissions?.join('、') }}</template>
        <template #actions="{ record }">
          <a-space>
            <a-button v-if="canEdit" type="text" @click="openModal(record)">编辑</a-button>
            <a-popconfirm v-if="canDelete && !record.isSystem" content="确认删除该角色吗？" @ok="removeRole(record.id)">
              <a-button type="text" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" :title="form.id ? '编辑角色' : '新增角色'" width="760px" @ok="submitForm">
      <a-form :model="form" layout="vertical">
        <div class="form-grid">
          <a-form-item label="角色名称"><a-input v-model="form.roleName" /></a-form-item>
          <a-form-item label="角色编码"><a-input v-model="form.roleCode" :disabled="!!form.id" /></a-form-item>
        </div>
        <a-form-item label="角色描述"><a-input v-model="form.roleDesc" /></a-form-item>
        <a-form-item label="菜单权限">
          <a-checkbox-group v-model="form.menuPermissions" :options="menuOptions" />
        </a-form-item>
        <a-form-item label="按钮权限">
          <a-checkbox-group v-model="form.buttonPermissions" :options="buttonOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { roleApi } from "@/api";
import { hasButtonPermission } from "@/utils/auth";

const canAdd = computed(() => hasButtonPermission("role:add"));
const canEdit = computed(() => hasButtonPermission("role:edit"));
const canDelete = computed(() => hasButtonPermission("role:delete"));
const menuOptions = ["dashboard", "category", "medicine", "inventory", "sales", "supplier", "employee", "role", "log"];
const buttonOptions = ["category:add", "category:edit", "category:delete", "medicine:add", "medicine:edit", "medicine:delete", "inventory:in", "inventory:out", "sales:create", "supplier:add", "supplier:edit", "supplier:delete", "employee:add", "employee:edit", "employee:delete", "role:add", "role:edit", "role:delete", "log:view"];
const visible = ref(false);
const tableData = ref<any[]>([]);
const query = reactive({ current: 1, pageSize: 10, keyword: "" });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const createDefaultForm = () => ({ id: undefined as number | undefined, roleName: "", roleCode: "", roleDesc: "", menuPermissions: [] as string[], buttonPermissions: [] as string[] });
const form = reactive(createDefaultForm());
const columns = [
  { title: "角色名称", dataIndex: "roleName" },
  { title: "角色编码", dataIndex: "roleCode" },
  { title: "角色描述", dataIndex: "roleDesc" },
  { title: "菜单权限", slotName: "menuPermissions" },
  { title: "按钮权限", slotName: "buttonPermissions" },
  { title: "操作", slotName: "actions", width: 140 },
];
const loadData = async () => {
  const result = await roleApi.listPage(query);
  tableData.value = result.records;
  Object.assign(pagination, { current: result.current, pageSize: result.size, total: result.total });
};
const handlePageChange = (current: number) => { query.current = current; loadData(); };
const openModal = (record?: any) => { Object.assign(form, createDefaultForm(), record || {}); visible.value = true; };
const submitForm = async () => { await roleApi.save(form); Message.success(form.id ? "角色更新成功" : "角色新增成功"); visible.value = false; loadData(); };
const removeRole = async (id: number) => { await roleApi.remove(id); Message.success("角色删除成功"); loadData(); };

onMounted(loadData);
</script>

<style scoped>
.page-shell { display: flex; }
.panel-card { width: 100%; border-radius: 24px; background: rgba(255,255,255,.78); box-shadow: 0 18px 36px rgba(19,59,56,.08); }
.toolbar { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.toolbar-actions { display: flex; gap: 12px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
@media (max-width: 900px) { .toolbar, .form-grid { flex-direction: column; grid-template-columns: 1fr; } }
</style>
