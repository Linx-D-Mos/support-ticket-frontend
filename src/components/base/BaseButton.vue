<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'white';
  loading?: boolean;
}>();

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    case 'white':
      return 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300';
    default: // primary
      return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
  }
});
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="loading"
    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    :class="variantClasses"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot></slot>
  </button>
</template>
