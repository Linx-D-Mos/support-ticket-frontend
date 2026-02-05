<script setup lang="ts">
import { ref, onMounted } from 'vue';
import dashboardService, { type DashboardStats } from '@/services/dashboardService';
import { TicketIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';

const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    stats.value = await dashboardService.getStats();
  } catch (error) {
    console.error('Failed to load stats', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate mb-6">
      Dashboard
    </h2>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <div v-else-if="stats" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Total Tickets -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <TicketIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Tickets</dt>
                <dd>
                  <div class="text-lg font-medium text-gray-900">{{ stats.total_tickets }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Open Tickets -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <XCircleIcon class="h-6 w-6 text-yellow-400" aria-hidden="true" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Abiertos</dt>
                <dd>
                  <div class="text-lg font-medium text-gray-900">{{ stats.open_tickets }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Closed Tickets -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-6 w-6 text-green-400" aria-hidden="true" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Cerrados</dt>
                <dd>
                  <div class="text-lg font-medium text-gray-900">{{ stats.closed_tickets }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Distribution -->
      <div class="bg-white overflow-hidden shadow rounded-lg sm:col-span-2 lg:col-span-3">
        <div class="p-5">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Distribución por Prioridad</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div v-for="(count, priority) in stats.priority_distribution" :key="priority" class="bg-gray-50 p-4 rounded-md text-center">
                <span class="block text-sm font-medium text-gray-500 uppercase">{{ priority }}</span>
                <span class="block text-2xl font-bold text-gray-900">{{ count }}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
