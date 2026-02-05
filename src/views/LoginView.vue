<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleSubmit() {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });
    router.push({ name: 'dashboard' });
  } catch (err: any) {
    if (err.response?.status === 401) {
      errorMsg.value = 'Credenciales incorrectas. Verifique su email y contraseña.';
    } else {
      errorMsg.value = 'Error al conectar con el servidor. Intente nuevamente.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Iniciar Sesión
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Sistema de Tickets de Soporte
      </p>
    </div>
    <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
      <div class="rounded-md shadow-sm -space-y-px">
        <BaseInput
          id="email-address"
          label="Email"
          type="email"
          v-model="email"
          required
          placeholder="admin@example.com"
          class="mb-4"
        />
        <BaseInput
          id="password"
          label="Contraseña"
          type="password"
          v-model="password"
          required
          placeholder="••••••••"
        />
      </div>

      <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{{ errorMsg }}</h3>
          </div>
        </div>
      </div>

      <div>
        <BaseButton type="submit" :loading="loading" class="w-full">
          Ingresar
        </BaseButton>
      </div>
    </form>
  </div>
</template>
