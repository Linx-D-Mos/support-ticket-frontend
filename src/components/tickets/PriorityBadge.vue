<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  priority: string;
}>();

const config = computed(() => {
  switch (props.priority.toLowerCase()) {
    case 'urgent':
      return { class: 'text-red-600 font-bold', label: 'Urgente' };
    case 'high':
      return { class: 'text-orange-600 font-semibold', label: 'Alta' };
    case 'medium':
      return { class: 'text-yellow-600', label: 'Media' };
    case 'low':
      return { class: 'text-green-600', label: 'Baja' };
    default:
      return { class: 'text-gray-600', label: props.priority };
  }
});
</script>

<template>
  <span class="inline-flex items-center text-sm" :class="config.class">
    <svg class="mr-1.5 h-2 w-2 text-current" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
    {{ config.label }}
  </span>
</template>
