<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-title">药店管理系统</div>
      <div class="login-subtitle">支持账号密码登录与邮箱验证码登录</div>
      <a-tabs default-active-key="account">
        <a-tab-pane key="account" title="账号密码登录">
          <a-form :model="accountForm" layout="vertical">
            <a-form-item label="用户名">
              <a-input v-model="accountForm.userAccount" placeholder="请输入用户名" />
            </a-form-item>
            <a-form-item label="密码">
              <a-input-password v-model="accountForm.userPassword" placeholder="请输入密码" />
            </a-form-item>
            <a-button type="primary" long @click="handleAccountLogin">立即登录</a-button>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="email" title="邮箱验证码登录">
          <a-form :model="emailForm" layout="vertical">
            <a-form-item label="邮箱">
              <a-input v-model="emailForm.email" placeholder="请输入企业邮箱" />
            </a-form-item>
            <a-form-item label="验证码">
              <a-input-group>
                <a-input v-model="emailForm.verifyCode" placeholder="请输入6位验证码" />
                <a-button :disabled="countdown > 0" @click="sendCode">
                  {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
                </a-button>
              </a-input-group>
            </a-form-item>
            <a-button type="primary" long @click="handleEmailLogin">验证码登录</a-button>
          </a-form>
        </a-tab-pane>
      </a-tabs>
      <div class="login-tip">默认管理员账号：`admin` / 默认密码：`12345678`</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import { userApi } from "@/api";
import { setLoginUser } from "@/utils/auth";

const router = useRouter();
const countdown = ref(0);
const accountForm = reactive({ userAccount: "admin", userPassword: "12345678" });
const emailForm = reactive({ email: "", verifyCode: "" });
let timer: ReturnType<typeof setInterval> | null = null;

const startCountdown = () => {
  countdown.value = 60;
  timer && clearInterval(timer);
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
};

const loginSuccess = async (user: any) => {
  setLoginUser(user);
  Message.success(`欢迎回来，${user.userName}`);
  await router.push("/dashboard");
};

const handleAccountLogin = async () => {
  const user = await userApi.login(accountForm);
  loginSuccess(user);
};

const sendCode = async () => {
  await userApi.sendEmailCode({ email: emailForm.email });
  Message.success("验证码已发送，请前往邮箱查收");
  startCountdown();
};

const handleEmailLogin = async () => {
  const user = await userApi.emailLogin(emailForm);
  loginSuccess(user);
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.2), transparent 30%),
    radial-gradient(circle at right bottom, rgba(255, 166, 87, 0.2), transparent 30%),
    linear-gradient(180deg, #f5fbfa 0%, #eaf4f6 100%);
}

.login-panel {
  width: min(460px, calc(100vw - 32px));
  padding: 32px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 64px rgba(19, 59, 56, 0.12);
}

.login-title {
  font-size: 30px;
  font-weight: 700;
}

.login-subtitle {
  margin: 8px 0 18px;
  color: #6a8782;
}

.login-tip {
  margin-top: 16px;
  color: #6a8782;
  font-size: 12px;
}
</style>
