import { RouteRecordRaw } from "vue-router";
import DashboardView from "@/views/DashboardView.vue";
import CategoryView from "@/views/CategoryView.vue";
import MedicineView from "@/views/MedicineView.vue";
import InventoryView from "@/views/InventoryView.vue";
import SalesView from "@/views/SalesView.vue";
import SupplierView from "@/views/SupplierView.vue";
import LoginView from "@/views/LoginView.vue";
import EmployeeView from "@/views/EmployeeView.vue";
import RoleView from "@/views/RoleView.vue";
import LogView from "@/views/LogView.vue";

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/dashboard",
    meta: { hideInMenu: true },
  },
  {
    path: "/login",
    name: "登录",
    component: LoginView,
    meta: { hideInMenu: true, public: true },
  },
  {
    path: "/dashboard",
    name: "经营看板",
    component: DashboardView,
    meta: { menuKey: "/dashboard", menuCode: "dashboard" },
  },
  {
    path: "/category",
    name: "药品分类",
    component: CategoryView,
    meta: { menuKey: "/category", menuCode: "category" },
  },
  {
    path: "/medicine",
    name: "药品档案",
    component: MedicineView,
    meta: { menuKey: "/medicine", menuCode: "medicine" },
  },
  {
    path: "/inventory",
    name: "库存管理",
    component: InventoryView,
    meta: { menuKey: "/inventory", menuCode: "inventory" },
  },
  {
    path: "/sales",
    name: "销售收银",
    component: SalesView,
    meta: { menuKey: "/sales", menuCode: "sales" },
  },
  {
    path: "/supplier",
    name: "供应商管理",
    component: SupplierView,
    meta: { menuKey: "/supplier", menuCode: "supplier" },
  },
  {
    path: "/employee",
    name: "员工账号",
    component: EmployeeView,
    meta: { menuKey: "/employee", menuCode: "employee" },
  },
  {
    path: "/role",
    name: "角色权限",
    component: RoleView,
    meta: { menuKey: "/role", menuCode: "role" },
  },
  {
    path: "/log",
    name: "日志监控",
    component: LogView,
    meta: { menuKey: "/log", menuCode: "log" },
  },
];
