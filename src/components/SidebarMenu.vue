<template>
  <div class="sidebar-menu">
    <div class="brand-card">
      <div class="brand-badge">药</div>
      <div>
        <div class="brand-title">药店管理系统</div>
        <div class="brand-subtitle">门店、库存、销售、权限一体化</div>
      </div>
    </div>
    <a-menu :selected-keys="selectedKeys" @menu-item-click="handleMenuClick">
      <a-menu-item v-for="route in menuRoutes" :key="route.path">
        {{ route.name }}
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { routes } from "@/router/routes";
import { hasMenuPermission } from "@/utils/auth";

const router = useRouter();
const selectedKeys = ref<string[]>([(router.currentRoute.value.meta?.menuKey as string) || "/dashboard"]);

const menuRoutes = computed(() =>
  routes.filter((route) => !route.meta?.hideInMenu && hasMenuPermission(route.meta?.menuCode as string)),
);

router.afterEach((to) => {
  selectedKeys.value = [(to.meta?.menuKey as string) || to.path];
});

const handleMenuClick = (key: string) => {
  router.push(key);
};
</script>

<style scoped>
.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border-radius: 20px;
  background: linear-gradient(145deg, #0f766e 0%, #1d9a88 65%, #7cc7a5 100%);
  color: #fff;
  box-shadow: 0 18px 38px rgba(15, 118, 110, 0.22);
}

.brand-badge {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.18);
  font-size: 22px;
  font-weight: 700;
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.86;
}
</style>
