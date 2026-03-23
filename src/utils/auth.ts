export const AUTH_USER_KEY = "pharmacy_login_user";

export const getLoginUser = () => {
  const text = localStorage.getItem(AUTH_USER_KEY);
  return text ? JSON.parse(text) : null;
};

export const setLoginUser = (user: any) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearLoginUser = () => {
  localStorage.removeItem(AUTH_USER_KEY);
};

export const hasMenuPermission = (menuCode?: string) => {
  if (!menuCode) return true;
  const user = getLoginUser();
  return Boolean(user?.menuPermissions?.includes(menuCode));
};

export const hasButtonPermission = (buttonCode?: string) => {
  if (!buttonCode) return true;
  const user = getLoginUser();
  return Boolean(user?.buttonPermissions?.includes(buttonCode));
};
