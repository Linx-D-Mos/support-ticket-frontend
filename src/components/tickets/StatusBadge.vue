<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const config = computed(() => {
  switch (props.status.toLowerCase()) {
    case 'open':
      return { class: 'bg-green-100 text-green-800', label: 'Abierto' };
    case 'closed':
      return { class: 'bg-gray-100 text-gray-800', label: 'Cerrado' };
    case 'resolved':
      return { class: 'bg-blue-100 text-blue-800', label: 'Resuelto' };
    case 'in_progress':
      return { class: 'bg-yellow-100 text-yellow-800', label: 'En Progreso' };
    default:
      return { class: 'bg-gray-100 text-gray-800', label: props.status };
  }
});
</script>

<template>
  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="config.class">
    {{ config.label }}
  </span>
</template>
