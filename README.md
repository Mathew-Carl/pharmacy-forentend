# 药店管理系统前端

基于 `Vue 3 + Composition API + <script setup> + Arco Design Vue` 的药店管理系统前端项目，当前版本已经覆盖经营看板图表可视化、药品、库存、库存流水查询与导出、销售、销售退货、供应商、角色权限、员工账号、登录与日志监控等业务页面。

## 1. 项目概览

本项目是药店管理系统的前端管理后台，适用于课程设计、毕业设计、原型系统与业务二次开发。当前支持：

- 账号密码登录
- 邮箱验证码登录
- 登录态缓存与路由鉴权
- 基于角色的动态菜单显示
- 基于按钮权限的页面操作控制
- 经营看板
- 首页图表可视化
- 药品分类管理
- 药品档案管理
- 库存管理
- 库存流水查询与 Excel 导出
- 销售收银
- 销售退货与销售订单 Excel 导出
- 供应商管理
- 员工账号管理
- 角色权限管理
- 日志监控页面

## 2. 技术栈与版本

### 2.1 核心技术栈

- Node.js：建议 `20.x`
- npm：建议 `10.x`
- Vue：`3.2.13`
- Vue Router：`4.6.4`
- Arco Design Vue：`2.57.0`
- Axios：`1.13.3`
- Vue CLI：`5.0.8`
- TypeScript：`5.4.x`

### 2.2 开发特性

- Vue 3 Composition API
- `<script setup>` 单文件组件语法
- Axios 请求统一封装
- 路由守卫控制登录态与菜单权限
- 本地缓存当前登录用户权限信息
- Arco Design Vue 业务后台风格界面

## 3. 目录结构

```text
pharmacy-warehouse-frontend
├─ public
├─ src
│  ├─ api                  接口封装
│  ├─ components           通用组件
│  ├─ layout               系统布局
│  ├─ router               路由配置与守卫
│  ├─ utils                登录态与权限工具
│  ├─ views                页面视图
│  ├─ App.vue
│  └─ main.ts
├─ package.json
└─ vue.config.js
```

## 4. 部署教程

### 4.1 环境要求

请安装：

- `Node.js 20.x`
- `npm 10.x`

检查命令：

```bash
node -v
npm -v
```

### 4.2 安装依赖

```bash
cd pharmacy-warehouse-frontend
npm install
```

### 4.3 本地开发启动

```bash
npm run serve
```

启动后访问：

- 前端地址：`http://localhost:8080`

### 4.4 本地联调要求

请确保后端已经启动，默认代理配置为：

```js
proxy: {
  "/api": {
    target: "http://127.0.0.1:8101",
    changeOrigin: true,
  },
}
```

也就是说：

- 前端本地运行在 `8080`
- 后端本地运行在 `8101`
- 前端请求 `/api/**` 会自动转发到后端

### 4.5 生产构建

```bash
npm run build
```

构建产物目录：

- `dist`

## 5. 生产部署建议

### 5.1 推荐方式

- 前端：Nginx 托管静态资源
- 后端：Spring Boot Jar
- 接口：通过 Nginx 统一转发 `/api`

### 5.2 Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /data/www/pharmacy-warehouse-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8101/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 6. 模块介绍

### 6.1 登录模块

页面文件：`src/views/LoginView.vue`

已实现功能：

- 账号密码登录
- 邮箱验证码登录
- 验证码发送倒计时
- 登录成功后缓存当前用户权限
- 登录后自动跳转经营看板

### 6.2 经营看板模块

页面文件：`src/views/DashboardView.vue`

已实现功能：

- 今日销售额
- 今日订单数
- 缺货数量
- 近效期批次数量
- 销售额折线图
- 订单量柱状图
- 库存预警展示
- 销量排行与毛利排行

### 6.3 药品分类管理

页面文件：`src/views/CategoryView.vue`

功能包括：

- 分类查询
- 分类新增
- 分类编辑
- 分类删除

### 6.4 药品档案管理

页面文件：`src/views/MedicineView.vue`

功能包括：

- 药品列表查询
- 分类筛选
- 新增药品
- 编辑药品
- 删除药品
- 处方药标识展示

### 6.5 库存管理

页面文件：`src/views/InventoryView.vue`

功能包括：

- 库存分页查询
- 缺货 / 近效期展示
- 入库操作
- 出库操作
- 库存预警提示
- 库存流水多条件查询
- 库存流水 Excel 导出

### 6.6 销售收银

页面文件：`src/views/SalesView.vue`

功能包括：

- 收银开单
- 折扣率输入
- 处方药核验
- 动态添加销售明细
- 销售订单列表
- 销售退货弹窗回库
- 销售订单 Excel 导出

### 6.7 供应商管理

页面文件：`src/views/SupplierView.vue`

功能包括：

- 供应商查询
- 黑名单筛选
- 新增供应商
- 编辑供应商
- 删除供应商

### 6.8 员工账号管理

页面文件：`src/views/EmployeeView.vue`

功能包括：

- 员工列表查询
- 按角色筛选
- 新增员工
- 编辑员工
- 删除员工
- 重置密码

### 6.9 角色权限管理

页面文件：`src/views/RoleView.vue`

功能包括：

- 角色列表查询
- 新增角色
- 编辑角色
- 菜单权限配置
- 按钮权限配置

### 6.10 日志监控模块

页面文件：`src/views/LogView.vue`

功能包括：

- 操作日志查看
- 登录日志查看
- 异常日志查看

## 7. 路由与权限说明

主要路由：

- `/login`：登录页
- `/dashboard`：经营看板
- `/category`：药品分类
- `/medicine`：药品档案
- `/inventory`：库存管理
- `/sales`：销售收银
- `/supplier`：供应商管理
- `/employee`：员工账号
- `/role`：角色权限
- `/log`：日志监控

核心实现位置：

- 路由配置：`src/router/routes.ts`
- 路由守卫：`src/router/index.ts`
- 权限工具：`src/utils/auth.ts`
- 动态菜单：`src/components/SidebarMenu.vue`

权限机制说明：

1. 登录后将当前用户信息写入本地缓存
2. 路由守卫优先检查是否已登录
3. 若路由配置了 `menuCode`，则根据 `menuPermissions` 判定是否可访问
4. 页面按钮根据 `buttonPermissions` 决定是否展示

## 8. 接口封装说明

统一请求文件：`src/api/index.js`

当前已封装：

- `userApi`
- `roleApi`
- `logApi`
- `dashboardApi`
- `categoryApi`
- `medicineApi`
- `inventoryApi`
- `salesApi`
- `supplierApi`

响应处理约定：

- 成功：后端返回 `code = 0`
- 失败：统一由 Axios 拦截器弹出中文错误提示
- 登录失效：自动清空本地用户缓存

## 9. 默认账号与登录方式

数据库初始化后，默认提供：

- 管理员账号：`admin`
- 默认密码：`12345678`

邮箱验证码登录需要满足两个条件：

1. 该员工账号已绑定邮箱
2. 后端已经配置邮件服务，或处于验证码模拟发送模式

## 10. 本地构建验证

当前已经完成本地构建验证：

```bash
npm run build
```

构建可以成功完成，但仍存在前端包体积告警，主要原因是：

- Arco Design Vue 组件体积较大
- 当前仍是整体打包模式

如果后续要优化，可以考虑：

- 路由懒加载
- 按需引入组件
- 把大页面拆分为异步模块

## 11. 常见问题

### 11.1 登录后还是跳回登录页

请检查：

- 后端是否已经启动
- 浏览器是否允许 Cookie
- 后端会话是否正常建立
- `withCredentials` 是否被保留

### 11.2 菜单没有显示

请检查当前登录用户的角色是否配置了对应 `menuPermissions`。

### 11.3 按钮不显示

请检查当前角色是否配置了对应 `buttonPermissions`。

### 11.4 邮箱验证码登录失败

请检查：

- 员工账号是否绑定邮箱
- 邮箱格式是否正确
- 验证码是否过期
- 后端邮件发送或模拟模式是否正常

## 12. 联调顺序建议

推荐按以下顺序启动项目：

1. 初始化 MySQL 数据库
2. 启动后端 `pharmacy-warehouse-backend`
3. 启动前端 `pharmacy-warehouse-frontend`
4. 使用管理员账号登录进入系统
5. 先配置员工和角色，再按角色测试动态菜单与按钮权限
