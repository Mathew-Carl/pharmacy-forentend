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
    if (body?.code === 0) {
      return body.data;
    }
    Message.error(body?.message || "系统开小差了，请稍后重试");
    return Promise.reject(body);
  },
  (error) => {
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

export default request;
