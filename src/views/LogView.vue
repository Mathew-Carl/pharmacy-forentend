<template>
  <div class="page-shell">
    <a-card class="panel-card" :bordered="false">
      <a-tabs default-active-key="operation">
        <a-tab-pane key="operation" title="操作日志">
          <a-table :data="operationData" :columns="operationColumns" :pagination="false" />
        </a-tab-pane>
        <a-tab-pane key="login" title="登录日志">
          <a-table :data="loginData" :columns="loginColumns" :pagination="false" />
        </a-tab-pane>
        <a-tab-pane key="exception" title="异常日志">
          <a-table :data="exceptionData" :columns="exceptionColumns" :pagination="false" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { logApi } from "@/api";

const operationData = ref<any[]>([]);
const loginData = ref<any[]>([]);
const exceptionData = ref<any[]>([]);
const operationColumns = [
  { title: "模块", dataIndex: "moduleName" },
  { title: "类型", dataIndex: "operationType" },
  { title: "描述", dataIndex: "description" },
  { title: "操作人", dataIndex: "operatorName" },
  { title: "状态", dataIndex: "executeStatus" },
  { title: "耗时(ms)", dataIndex: "durationMs" },
  { title: "时间", dataIndex: "createTime" },
];
const loginColumns = [
  { title: "用户名", dataIndex: "userAccount" },
  { title: "姓名", dataIndex: "userName" },
  { title: "登录方式", dataIndex: "loginType" },
  { title: "状态", dataIndex: "loginStatus" },
  { title: "失败原因", dataIndex: "failReason" },
  { title: "IP", dataIndex: "ip" },
  { title: "登录时间", dataIndex: "loginTime" },
];
const exceptionColumns = [
  { title: "异常类型", dataIndex: "exceptionType" },
  { title: "异常信息", dataIndex: "exceptionMessage" },
  { title: "请求地址", dataIndex: "requestUrl" },
  { title: "用户", dataIndex: "userName" },
  { title: "状态", dataIndex: "handleStatus" },
  { title: "时间", dataIndex: "createTime" },
];
const loadData = async () => {
  operationData.value = (await logApi.listOperationLog({ current: 1, pageSize: 20 })).records;
  loginData.value = (await logApi.listLoginLog({ current: 1, pageSize: 20 })).records;
  exceptionData.value = (await logApi.listExceptionLog({ current: 1, pageSize: 20 })).records;
};

onMounted(loadData);
</script>

<style scoped>
.page-shell { display: flex; }
.panel-card { width: 100%; border-radius: 24px; background: rgba(255,255,255,.78); box-shadow: 0 18px 36px rgba(19,59,56,.08); }
</style>
