<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { BellIcon } from '@heroicons/vue/24/outline';
import echo from '@/echo';
import fileApi from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

interface NotificationData {
    message: string;
    ticket_id?: number;
    [key: string]: any;
}

interface Notification {
  id: string;
  data: NotificationData;
  created_at: string;
  read_at: string | null;
}

const notifications = ref<Notification[]>([]);
const unreadCount = ref(0);
const isOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const loadNotifications = async () => {
  try {
    const response = await fileApi.get('/notifications');
    notifications.value = response.data;
    countUnread();
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
};

const countUnread = () => {
  unreadCount.value = notifications.value.filter(n => !n.read_at).length;
};

const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
        try {
            await fileApi.patch(`/notifications/${notification.id}/read`);
            notification.read_at = new Date().toISOString();
            countUnread();
        } catch (error) {
            console.error('Error marking as read', error);
        }
    }
    
    if (notification.data.ticket_id) {
        router.push({ name: 'ticket-detail', params: { id: notification.data.ticket_id } });
    } else if (notification.data.link) {
        if (notification.data.link.startsWith('http')) {
            window.location.href = notification.data.link;
        } else {
            router.push(notification.data.link);
        }
    }

    closeDropdown();
};

const showToast = (message: string) => {
    // Simple toast implementation or use a library
    // For now, let's just log it or maybe a browser alert if desired, 
    // but the requirement says "Show a Toast". 
    // Given no toast library is pre-installed, I'll create a simple fixed element for now 
    // or assume we can just increment the counter and the user sees the bell ring.
    
    // Minimal custom toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 animate-bounce';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

onMounted(() => {
  loadNotifications();

  if (authStore.user?.id) {
    echo.private(`App.Models.User.${authStore.user.id}`)
    .notification((notification: any) => {
      // Si la notificación fue generada por el mismo usuario, la ignoramos
      const senderId = notification.sender_id || notification.data?.sender_id;
      if (senderId && Number(senderId) === Number(authStore.user?.id)) {
        return;
      }

      // Normalizamos la extracción de datos ya que Laravel puede enviarlos en la raíz o en .data
      const newNotification: Notification = {
        id: notification.id || notification.data?.id,
        data: {
          title: notification.title || notification.data?.title,
          message: notification.message || notification.data?.message,
          link: notification.link || notification.data?.link,
          ticket_id: notification.ticket_id || notification.data?.ticket_id
        },
        created_at: notification.created_at || new Date().toISOString(),
        read_at: null
      };
      notifications.value.unshift(newNotification);
      countUnread();
      showToast(newNotification.data.title);
    });
  }
});

onUnmounted(() => {
    if(authStore.user?.id) {
        echo.leave(`App.Models.User.${authStore.user.id}`);
    }
});
</script>

<template>
  <div class="relative">
    <button @click="toggleDropdown" class="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative">
      <span class="sr-only">View notifications</span>
      <BellIcon class="h-6 w-6" aria-hidden="true" />
      <span v-if="unreadCount > 0" class="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400"></span>
    </button>

    <div v-if="isOpen" class="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
      <div v-if="notifications.length === 0" class="px-4 py-2 text-sm text-gray-500">
        No notifications
      </div>
      <div v-else class="max-h-96 overflow-y-auto">
        <a 
            v-for="notification in notifications" 
            :key="notification.id" 
            href="#" 
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            :class="{ 'bg-gray-50': !notification.read_at }"
            @click.prevent="handleNotificationClick(notification)"
        >
            <p :class="{ 'font-semibold': !notification.read_at }">{{ notification.data.message || 'Notification' }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ new Date(notification.created_at).toLocaleString() }}</p>
        </a>
      </div>
    </div>
    
    <!-- Backdrop to close -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeDropdown"></div>
  </div>
</template>
