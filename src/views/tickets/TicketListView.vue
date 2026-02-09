<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import ticketService, { type Ticket, type TicketParams } from '@/services/ticketService';
import echo from '@/echo';
import StatusBadge from '@/components/tickets/StatusBadge.vue';
import PriorityBadge from '@/components/tickets/PriorityBadge.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';

const router = useRouter();
const tickets = ref<Ticket[]>([]);
const loading = ref(true);
const meta = ref<any>({});

// Filters
const filters = ref({
  page: 1,
  status: '',
  priority: '',
  search: '',
});

async function loadTickets() {
  loading.value = true;
  try {
    const response = await ticketService.getTickets(filters.value);
    tickets.value = response.data;
    meta.value = response.meta;
  } catch (error) {
    console.error('Failed to load tickets', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.value.page = 1;
  loadTickets();
}

function changePage(page: number) {
  if (page < 1 || page > meta.value.last_page) return;
  filters.value.page = page;
  loadTickets();
}

watch(() => filters.value.status, () => {
  filters.value.page = 1;
  loadTickets();
});

watch(() => filters.value.priority, () => {
  filters.value.page = 1;
  loadTickets();
});

onMounted(() => {
  loadTickets();

  echo.private('admins')
      .listen('.TicketCreated', (event: any) => {
          console.log('Ticket Created Event:', event);
          // Assuming the event payload contains the ticket object directly or in a 'ticket' property
          // Standard Laravel BroadcastWith or public property
          const newTicket = event.ticket || event;
          
          // Verify it matches Ticket interface roughly or just push it
          // Ideally we should check if it matches current filters but for now request says "prepend to array"
          tickets.value.unshift(newTicket);
          
          // Optional: Update meta total if we want to be precise, but usually for infinite scroll or live lists we just prepend
      });
});

onUnmounted(() => {
    echo.leave('admins');
});
</script>

<template>
  <div>
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-gray-900">Tickets</h1>
        <p class="mt-2 text-sm text-gray-700">Lista completa de tickets de soporte.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <BaseButton @click="router.push({ name: 'create-ticket' })">
          Nuevo Ticket
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-6 flex gap-4 flex-wrap">
       <BaseInput 
          id="search" 
          v-model="filters.search" 
          placeholder="Buscar tickets..." 
          class="w-full sm:w-64"
          @keyup.enter="handleSearch"
       />
       
       <select v-model="filters.status" class="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
         <option value="">Estado (Todos)</option>
         <option value="open">Abierto</option>
         <option value="in progress">En Progreso</option>
         <option value="pending">Pendiente</option>
         <option value="resolved">Resuelto</option>
         <option value="closed">Cerrado</option>
       </select>

       <select v-model="filters.priority" class="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
         <option value="">Prioridad (Todos)</option>
         <option value="low">Baja</option>
         <option value="medium">Media</option>
         <option value="high">Alta</option>
         <option value="urgent">Urgente</option>
       </select>
    </div>

    <!-- Table -->
    <div class="mt-8 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Asunto</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prioridad</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Solicitante</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Agente</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Ver</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="loading">
                   <td colspan="7" class="text-center py-4 text-gray-500">Cargando tickets...</td>
                </tr>
                <tr v-else-if="tickets.length === 0">
                    <td colspan="7" class="text-center py-4 text-gray-500">No se encontraron tickets.</td>
                </tr>
                <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-gray-50">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">#{{ ticket.id }}</td>
                  <td class="px-3 py-4 text-sm text-gray-500">{{ ticket.title }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <StatusBadge :status="ticket.status" />
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                     <PriorityBadge :priority="ticket.priority" />
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ ticket.customer.name }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ ticket.agent?.name || 'No asignado'}}</td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <router-link :to="{ name: 'ticket-detail', params: { id: ticket.id } }" class="text-indigo-600 hover:text-indigo-900">
                      Ver<span class="sr-only">, {{ ticket.title }}</span>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
       <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
           <div>
              <p class="text-sm text-gray-700">
                 Mostrando <span class="font-medium">{{ meta.from }}</span> a <span class="font-medium">{{ meta.to }}</span> de <span class="font-medium">{{ meta.total }}</span> resultados
              </p>
           </div>
           <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                   <button 
                     @click="changePage(meta.current_page - 1)" 
                     :disabled="meta.current_page === 1"
                     class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                   >
                       Anterior
                   </button>
                   <button
                     v-for="page in meta.last_page"
                     :key="page"
                     @click="changePage(page)"
                     class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                     :class="{ 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600': page === meta.current_page, 'text-gray-500': page !== meta.current_page }"
                   >
                     {{ page }}
                   </button>
                   <button 
                     @click="changePage(meta.current_page + 1)"
                     :disabled="meta.current_page === meta.last_page"
                     class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                   >
                       Siguiente
                   </button>
              </nav>
           </div>
       </div>
    </div>
  </div>
</template>
