import axios from "axios";
import { Message } from "@arco-design/web-vue";
import { clearLoginUser } from "@/utils/auth";

const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true,
});

const downloadRequest = axios.create({
  baseURL: "/api",
  timeout: 20000,
  withCredentials: true,
  responseType: "blob",
});

request.interceptors.response.use(
  (response) => {
    const body = response.data;
    
    // 💡 重点修改：兼容普通接口 (code === 0) 和 AI 接口 (带有 reply 字段)
    if (body?.code === 0 || body?.reply !== undefined) {
      // 💡 注意：普通接口返回 body.data，AI 接口因为没有 data 外壳，直接返回 body
      return body?.code === 0 ? body.data : body; 
    }
    
    Message.error(body?.message || "系统开小差了，请稍后重试");
    return Promise.reject(body);
  },
  (error) => {
    // ... 下面的报错代码保持不变
    const message = error.response?.data?.message || "网络异常，请检查后端服务是否启动";
    if (error.response?.data?.code === 40100) {
      clearLoginUser();
    }
    Message.error(message);
    return Promise.reject(error);
  },
);

downloadRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    Message.error("文件导出失败，请稍后重试");
    return Promise.reject(error);
  },
);

const resolveFileName = (response, fallbackName) => {
  const disposition = response.headers["content-disposition"] || "";
  const matched = disposition.match(/filename\*=utf-8''([^;]+)/i);
  if (matched?.[1]) {
    return decodeURIComponent(matched[1]);
  }
  return fallbackName;
};

const triggerDownload = async (url, data, fallbackName) => {
  const response = await downloadRequest.post(url, data ?? {});
  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/octet-stream",
  });
  const fileName = resolveFileName(response, fallbackName);
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
  Message.success("导出成功");
};

export const userApi = {
  login: (data) => request.post("/user/login", data),
  sendEmailCode: (data) => request.post("/user/login/email/code", data),
  emailLogin: (data) => request.post("/user/login/email", data),
  getLoginUser: () => request.get("/user/get/login"),
  logout: () => request.post("/user/logout"),
  listPage: (data) => request.post("/user/list/page", data),
  add: (data) => request.post("/user/add", data),
  update: (data) => request.post("/user/update", data),
  remove: (id) => request.post("/user/delete", { id }),
  resetPassword: (userId) => request.post(`/user/password/reset?userId=${userId}`),
};

export const roleApi = {
  listPage: (data) => request.post("/role/list/page", data),
  save: (data) => request.post("/role/save", data),
  remove: (id) => request.post("/role/delete", { id }),
};

export const logApi = {
  listOperationLog: (data) => request.post("/log/operation/list/page", data),
  listLoginLog: (data) => request.post("/log/login/list/page", data),
  listExceptionLog: (data) => request.post("/log/exception/list/page", data),
};

export const dashboardApi = {
  getSummary: () => request.get("/dashboard/summary"),
  getSalesTrend: () => request.get("/dashboard/salesTrend"),
  getAlerts: () => request.get("/dashboard/alerts"),
  getSalesQuantityRanking: () => request.get("/dashboard/salesQuantityRanking"),
  getGrossProfitRanking: () => request.get("/dashboard/grossProfitRanking"),
};

export const categoryApi = {
  listPage: (data) => request.post("/category/list/page", data),
  save: (data) => request.post("/category/save", data),
  remove: (id) => request.post("/category/delete", { id }),
};

export const medicineApi = {
  listPage: (data) => request.post("/medicine/list/page", data),
  save: (data) => request.post("/medicine/save", data),
  remove: (id) => request.post("/medicine/delete", { id }),
};

export const supplierApi = {
  listPage: (data) => request.post("/supplier/list/page", data),
  save: (data) => request.post("/supplier/save", data),
  remove: (id) => request.post("/supplier/delete", { id }),
};

export const inventoryApi = {
  listPage: (data) => request.post("/inventory/list/page", data),
  stockIn: (data) => request.post("/inventory/in", data),
  stockOut: (data) => request.post("/inventory/out", data),
  getAlerts: () => request.post("/inventory/alerts"),
  listFlowPage: (data) => request.post("/inventory/flow/list/page", data),
  exportFlow: (data) => triggerDownload("/inventory/flow/export", data, "库存流水.xlsx"),
};

export const salesApi = {
  create: (data) => request.post("/sales/create", data),
  returnOrder: (data) => request.post("/sales/return", data),
  listPage: (data) => request.post("/sales/list/page", data),
  exportOrders: (data) => triggerDownload("/sales/export", data, "销售订单.xlsx"),
};

export const chatApi = {
  send: (data) => request.post("/chat", data),
};


export const purchaseApi = {
  // 创建采购订单
  create: (data) => request.post("/purchase/create", data),
  // 分页查询采购订单列表
  listPage: (data) => request.post("/purchase/list/page", data),
  // 获取采购订单详情
  detail: (id) => request.get(`/purchase/detail/${id}`),
  // 审核采购订单
  audit: (data) => request.post("/purchase/audit", data),
  // 删除采购订单
  remove: (id) => request.post(`/purchase/delete/${id}`),
  // 生成智能补货建议
  getSuggestions: () => request.get("/purchase/suggestions"),
  // 一键生成采购单
  generate: (data) => request.post("/purchase/generate", null, { params: data }),
  // 采购入库确认
  confirmInbound: (id, data) => request.post(`/purchase/inbound/${id}`, null, { params: data }),
  // 导出采购订单
  exportOrders: (data) => triggerDownload("/purchase/export", data, "采购订单.xlsx"),
};

export const reportApi = {
  // 获取库存总价值统计（按分类）
  getInventoryValueByCategory: () => request.get("/report/inventory/value"),
  // 获取库存数量分布（按分类）
  getInventoryQuantityByCategory: () => request.get("/report/inventory/quantity"),
  // 获取临期药品统计列表
  getExpiringMedicines: (days = 30) => request.get("/report/inventory/expiring", { params: { days } }),
  // 获取缺货药品统计
  getShortageMedicines: () => request.get("/report/inventory/shortage"),
  // 获取按日销售统计
  getDailySalesStats: (params) => request.get("/report/sales/daily", { params }),
  // 获取按月销售统计
  getMonthlySalesStats: (params) => request.get("/report/sales/monthly", { params }),
  // 获取按年销售统计
  getYearlySalesStats: (year) => request.get("/report/sales/yearly", { params: { year } }),
  // 获取药品销售排行
  getSalesRanking: (params) => request.get("/report/sales/ranking", { params }),
  // 获取首页仪表盘核心指标
  getDashboardMetrics: () => request.get("/report/dashboard/metrics"),
  // 获取销售趋势数据（折线图）
  getSalesTrend: (days = 7) => request.get("/report/chart/sales-trend", { params: { days } }),
  // 获取库存分类占比数据（饼图）
  getCategoryInventoryPieData: () => request.get("/report/chart/category-pie"),
  // 获取出入库流水趋势
  getInOutFlowTrend: (days = 7) => request.get("/report/chart/inout-flow", { params: { days } }),
  // 导出统计报表
  exportReport: (params) => triggerDownload("/report/export", null, "统计报表.xlsx", params),
};
export default request;