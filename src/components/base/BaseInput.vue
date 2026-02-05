<script setup lang="ts">
defineProps<{
  label?: string;
  modelValue: string | number;
  type?: string;
  id: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="mt-1">
      <input
        :id="id"
        :type="type || 'text'"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :required="required"
        :placeholder="placeholder"
        class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
        :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': error }"
      />
    </div>
    <p v-if="error" class="mt-2 text-sm text-red-600" :id="`${id}-error`">{{ error }}</p>
  </div>
</template>
