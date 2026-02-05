<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  HomeIcon,
  TicketIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const router = useRouter();
const sidebarOpen = ref(false);

const navigation = [
  { name: 'Dashboard', href: 'dashboard', icon: HomeIcon },
  { name: 'Tickets', href: 'tickets', icon: TicketIcon },
];

function handleLogout() {
  authStore.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Mobile Sidebar -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-40 lg:hidden">
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="sidebarOpen = false"></div>
      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full">
        <div class="pt-5 pb-4 px-4">
           <div class="flex-shrink-0 flex items-center px-4">
             <h1 class="text-xl font-bold font-sans text-indigo-600">Support System</h1>
           </div>
           <nav class="mt-5 space-y-1">
             <router-link
               v-for="item in navigation"
               :key="item.name"
               :to="{ name: item.href }"
               class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50"
               @click="sidebarOpen = false"
             >
               <component :is="item.icon" class="mr-4 h-6 w-6 text-gray-500" aria-hidden="true" />
               {{ item.name }}
             </router-link>
           </nav>
        </div>
      </div>
    </div>

    <!-- Static Sidebar for Desktop -->
    <div class="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div class="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div class="flex items-center flex-shrink-0 px-4">
             <h1 class="text-xl font-bold font-sans text-indigo-600">Support System</h1>
          </div>
          <nav class="mt-8 flex-1 px-2 space-y-1">
             <router-link
               v-for="item in navigation"
               :key="item.name"
               :to="{ name: item.href }"
               active-class="bg-indigo-50 text-indigo-600"
               class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
             >
               <component :is="item.icon" class="mr-3 h-6 w-6 flex-shrink-0" :class="[ $route.name === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500']" aria-hidden="true" />
               {{ item.name }}
             </router-link>
          </nav>
        </div>
        <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
          <button @click="handleLogout" class="flex-shrink-0 w-full group block">
            <div class="flex items-center">
              <div>
                <ArrowRightOnRectangleIcon class="inline-block h-9 w-9 rounded-full text-gray-400 p-1 bg-gray-100" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {{ authStore.user?.name }}
                </p>
                <p class="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {{ authStore.user?.rol?.name }} - Logout
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="lg:pl-64 flex flex-col min-h-screen">
      <div class="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow lg:hidden">
        <button type="button" class="px-4 border-r border-gray-200 text-gray-500 focus:outline-none lg:hidden" @click="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <Bars3Icon class="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <main class="flex-1">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <router-view></router-view>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
