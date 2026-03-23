<template>
  <div class="page-shell">
    <a-card class="panel-card" :bordered="false">
      <div class="toolbar">
        <a-input-search v-model="query.keyword" placeholder="搜索姓名、用户名、工号、邮箱" allow-clear @search="loadData" />
        <a-select v-model="query.roleId" allow-clear placeholder="角色筛选" style="width: 180px">
          <a-option v-for="role in roleOptions" :key="role.id" :value="role.id">{{ role.roleName }}</a-option>
        </a-select>
        <div class="toolbar-actions">
          <a-button @click="loadData">查询</a-button>
          <a-button v-if="canAdd" type="primary" @click="openModal()">新增员工</a-button>
        </div>
      </div>
      <a-table :data="tableData" :columns="columns" :pagination="pagination" @page-change="handlePageChange">
        <template #actions="{ record }">
          <a-space>
            <a-button v-if="canEdit" type="text" @click="openModal(record)">编辑</a-button>
            <a-button v-if="canEdit" type="text" @click="resetPassword(record.id)">重置密码</a-button>
            <a-popconfirm v-if="canDelete" content="确认删除该员工吗？" @ok="removeUser(record.id)">
              <a-button type="text" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" :title="form.id ? '编辑员工' : '新增员工'" width="720px" @ok="submitForm">
      <a-form :model="form" layout="vertical">
        <div class="form-grid">
          <a-form-item label="姓名"><a-input v-model="form.userName" /></a-form-item>
          <a-form-item label="用户名"><a-input v-model="form.userAccount" :disabled="!!form.id" /></a-form-item>
          <a-form-item label="工号"><a-input v-model="form.employeeNo" :disabled="!!form.id" /></a-form-item>
          <a-form-item label="手机号"><a-input v-model="form.phone" /></a-form-item>
          <a-form-item label="邮箱"><a-input v-model="form.email" /></a-form-item>
          <a-form-item label="部门"><a-input v-model="form.department" /></a-form-item>
          <a-form-item label="角色">
            <a-select v-model="form.roleId"><a-option v-for="role in roleOptions" :key="role.id" :value="role.id">{{ role.roleName }}</a-option></a-select>
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model="form.userStatus"><a-option value="启用">启用</a-option><a-option value="停用">停用</a-option></a-select>
          </a-form-item>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { roleApi, userApi } from "@/api";
import { hasButtonPermission } from "@/utils/auth";

const canAdd = computed(() => hasButtonPermission("employee:add"));
const canEdit = computed(() => hasButtonPermission("employee:edit"));
const canDelete = computed(() => hasButtonPermission("employee:delete"));
const visible = ref(false);
const tableData = ref<any[]>([]);
const roleOptions = ref<any[]>([]);
const query = reactive({ current: 1, pageSize: 10, keyword: "", roleId: undefined as number | undefined });
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });
const createDefaultForm = () => ({ id: undefined as number | undefined, userName: "", userAccount: "", employeeNo: "", phone: "", email: "", department: "", roleId: undefined as number | undefined, userStatus: "启用" });
const form = reactive(createDefaultForm());
const columns = [
  { title: "姓名", dataIndex: "userName" },
  { title: "用户名", dataIndex: "userAccount" },
  { title: "工号", dataIndex: "employeeNo" },
  { title: "手机号", dataIndex: "phone" },
  { title: "邮箱", dataIndex: "email" },
  { title: "角色", dataIndex: "roleName" },
  { title: "状态", dataIndex: "userStatus" },
  { title: "操作", slotName: "actions", width: 220 },
];

const loadRoles = async () => {
  const result = await roleApi.listPage({ current: 1, pageSize: 100 });
  roleOptions.value = result.records;
};
const loadData = async () => {
  const result = await userApi.listPage(query);
  tableData.value = result.records;
  Object.assign(pagination, { current: result.current, pageSize: result.size, total: result.total });
};
const handlePageChange = (current: number) => { query.current = current; loadData(); };
const openModal = (record?: any) => { Object.assign(form, createDefaultForm(), record || {}); visible.value = true; };
const submitForm = async () => {
  if (form.id) await userApi.update(form); else await userApi.add(form);
  Message.success(form.id ? "员工更新成功" : "员工新增成功，初始密码为 12345678");
  visible.value = false; loadData();
};
const removeUser = async (id: number) => { await userApi.remove(id); Message.success("员工删除成功"); loadData(); };
const resetPassword = async (id: number) => { await userApi.resetPassword(id); Message.success("密码已重置为 12345678"); };

onMounted(async () => { await loadRoles(); await loadData(); });
</script>

<style scoped>
.page-shell { display: flex; }
.panel-card { width: 100%; border-radius: 24px; background: rgba(255,255,255,.78); box-shadow: 0 18px 36px rgba(19,59,56,.08); }
.toolbar { display: grid; grid-template-columns: 1fr 180px auto; gap: 16px; margin-bottom: 18px; }
.toolbar-actions { display: flex; justify-content: flex-end; gap: 12px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
@media (max-width: 900px) { .toolbar, .form-grid { grid-template-columns: 1fr; } }
</style>
