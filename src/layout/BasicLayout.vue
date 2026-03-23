<template>
  <div v-if="!isLoginPage" class="layout-shell-wrap">
    <a-layout class="layout-shell">
      <a-layout-sider class="layout-sider" :width="260" breakpoint="lg" collapsible>
        <SidebarMenu />
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="layout-header">
          <div>
            <div class="header-title">门店经营驾驶舱</div>
            <div class="header-subtitle">聚焦药品、库存、销售、员工与日志协同</div>
          </div>
          <div class="header-actions">
            <a-badge :count="alertCount" dot>
              <a-button type="outline" shape="round">库存预警</a-button>
            </a-badge>
            <a-space>
              <a-tag color="arcoblue">{{ loginUser?.roleName || '未登录' }}</a-tag>
              <a-dropdown>
                <a-button type="text">{{ loginUser?.userName || '访客' }}</a-button>
                <template #content>
                  <a-doption @click="handleLogout">退出登录</a-doption>
                </template>
              </a-dropdown>
            </a-space>
          </div>
        </a-layout-header>
        <a-layout-content class="layout-content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SidebarMenu from "@/components/SidebarMenu.vue";
import { dashboardApi, userApi } from "@/api";
import { clearLoginUser, getLoginUser } from "@/utils/auth";

const route = useRoute();
const router = useRouter();
const alertCount = ref(0);
const loginUser = ref(getLoginUser());

const isLoginPage = computed(() => route.path === "/login");

const loadAlerts = async () => {
  if (isLoginPage.value) return;
  const alerts = await dashboardApi.getAlerts().catch(() => []);
  alertCount.value = alerts.length;
};

watch(
  () => route.path,
  () => {
    loginUser.value = getLoginUser();
    loadAlerts();
  },
  { immediate: true },
);

const handleLogout = async () => {
  await userApi.logout().catch(() => null);
  clearLoginUser();
  router.push("/login");
};

onMounted(loadAlerts);
</script>

<style scoped>
.layout-shell-wrap,
.layout-shell {
  min-height: 100vh;
}

.layout-sider {
  margin: 18px 0 18px 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  border-radius: 28px;
  box-shadow: 0 18px 42px rgba(19, 59, 56, 0.08);
}

.layout-header {
  margin: 18px 18px 0;
  padding: 18px 24px;
  height: auto;
  border-radius: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 42px rgba(19, 59, 56, 0.08);
}

.header-title {
  font-size: 24px;
  font-weight: 700;
}

.header-subtitle {
  margin-top: 4px;
  color: #5e7e7a;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.layout-content {
  padding: 18px;
}

@media (max-width: 768px) {
  .layout-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .layout-sider {
    margin-right: 18px;
  }
}
</style>
