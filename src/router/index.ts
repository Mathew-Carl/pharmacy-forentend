import { createRouter, createWebHistory } from "vue-router";
import { routes } from "@/router/routes";
import { userApi } from "@/api";
import { clearLoginUser, getLoginUser, hasMenuPermission, setLoginUser } from "@/utils/auth";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.meta?.public) {
    next();
    return;
  }
  let loginUser = getLoginUser();
  if (!loginUser) {
    try {
      loginUser = await userApi.getLoginUser();
      setLoginUser(loginUser);
    } catch (error) {
      clearLoginUser();
      next("/login");
      return;
    }
  }
  if (to.meta?.menuCode && !hasMenuPermission(to.meta.menuCode as string)) {
    next("/dashboard");
    return;
  }
  next();
});

export default router;
