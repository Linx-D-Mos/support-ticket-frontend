<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ticketService from '@/services/ticketService';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';

const router = useRouter();
const loading = ref(false);

const form = ref<any>({
  title: '',
  priority: 'low',
  labels: [],
  files: null
});

const labelOptions = ['bug', 'feature', 'question', 'incident', 'request'];
const selectedLabels = ref<string[]>([]);
const files = ref<File[]>([]);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    files.value = Array.from(target.files);
  }
}

async function handleSubmit() {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('title', form.value.title);
    formData.append('priority', form.value.priority);
    
    selectedLabels.value.forEach((label, index) => {
      formData.append(`labels[${index}]`, label);
    });
    
    files.value.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    await ticketService.createTicket(formData);
    router.push({ name: 'tickets' });
  } catch (error) {
    console.error('Failed to create ticket', error);
    alert('Error al crear el ticket. Verifique los datos.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
    <div class="md:flex md:items-center md:justify-between mb-6">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Crear Nuevo Ticket
        </h2>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <BaseInput
        id="title"
        label="Asunto"
        v-model="form.title"
        required
        placeholder="Describa brevemente el problema"
      />

      <div>
        <label for="priority" class="block text-sm font-medium text-gray-700">Prioridad</label>
        <select id="priority" v-model="form.priority" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
        <div class="flex flex-wrap gap-3">
          <label v-for="label in labelOptions" :key="label" class="inline-flex items-center">
            <input type="checkbox" :value="label" v-model="selectedLabels" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
            <span class="ml-2 text-sm text-gray-700 capitalize">{{ label }}</span>
          </label>
        </div>
        <p v-if="selectedLabels.length === 0" class="mt-1 text-xs text-red-500">Seleccione al menos una etiqueta.</p>
      </div>

      <div>
         <label class="block text-sm font-medium text-gray-700">Adjuntar Archivos</label>
         <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div class="space-y-1 text-center">
               <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                 <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
               </svg>
               <div class="flex text-sm text-gray-600">
                 <label for="files" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                   <span>Subir archivos</span>
                   <input id="files" name="files" type="file" class="sr-only" multiple @change="handleFileChange">
                 </label>
                 <p class="pl-1">o arrastre y suelte</p>
               </div>
               <p class="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
            </div>
         </div>
         <div v-if="files.length > 0" class="mt-2">
             <h4 class="text-sm font-medium text-gray-700">Archivos seleccionados:</h4>
             <ul class="list-disc pl-5 text-sm text-gray-500">
                 <li v-for="file in files" :key="file.name">{{ file.name }}</li>
             </ul>
         </div>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="white" @click="router.back()">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="loading" :disabled="selectedLabels.length === 0">Crear Ticket</BaseButton>
      </div>
    </form>
  </div>
</template>
