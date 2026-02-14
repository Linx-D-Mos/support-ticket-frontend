<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { useAuthStore } from '@/stores/auth';
import ticketService, { type Ticket } from '@/services/ticketService';
import StatusBadge from '@/components/tickets/StatusBadge.vue';
import PriorityBadge from '@/components/tickets/PriorityBadge.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import { PaperClipIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import echo from '@/echo';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const ticket = ref<Ticket | null>(null);
const loading = ref(true);
const newAnswer = ref('');
const answerFiles = ref<File[]>([]);
const sendingAnswer = ref(false);
const isEditing = ref(false);
const updatingTicket = ref(false);
const activeUsers = ref<any[]>([]);
const typingUser = ref<string | null>(null);
let typingTimer: any = null;
const chatContainer = ref<HTMLElement | null>(null);

const editForm = ref({
    title: '',
    priority: ''
});

const ticketId = Number(route.params.id);

// Agent Loading
const agents = ref<{ id: number, name: string }[]>([]);
const loadingAgents = ref(false);

// --- Computed Logic for ACL & Lifecycle ---

const canEdit = computed(() => {
    if (!ticket.value) return false;
    if (authStore.isAdmin) return true;
    if (authStore.isCustomer && Number(ticket.value.customer.id) === Number(authStore.user?.id)) {
        if (!ticket.value.created_at) return false;
        // Usamos UTC para evitar desfases de zona horaria entre servidor y cliente
        const diff = dayjs.utc().diff(dayjs.utc(ticket.value.created_at), 'minute');
        return diff <= 10;
    }
    return false;
});

const canResolve = computed(() => {
    if (!ticket.value) return false;
    if (ticket.value.status === 'closed' || ticket.value.status === 'resolved' || ticket.value.status === 'open') return false;
    if (ticket.value.agent?.id !== authStore.user?.id && authStore.isAgent) return false;

    return authStore.isAgent || authStore.isAdmin;
});

const canClose = computed(() => {
    // Usually same as resolve, or specifically from resolved -> closed
    if (!ticket.value) return false;
    return (authStore.isCustomer || authStore.isAdmin) && ticket.value.status !== 'closed';
});

const canRestore = computed(() => {
    // Only Admin can restore and if it's logically deleted (requires deleted_at check which might be status 'closed' or separate field)
    // The API returns deleted tickets only via specific endpoints usually, but if we are viewing a "soft deleted" ticket (if possible), button shows.
    // For this MVP, let's assume 'restore' is for closed tickets re-opening OR actual soft delete restoration.
    // Based on user request: "Only show Restore button if the ticket is soft-deleted".
    // We need to know if it is soft deleted. The typical API response might not show deleted tickets unless explicitly asked.
    // If the standard 'show' endpoint returns it, we check 'deleted_at'.
    // Since our interface definition didn't include 'deleted_at', let's check safety.
    return authStore.isAdmin && (ticket.value as any).deleted_at;
});

const canAssignSelf = computed(() => {
    return authStore.isAgent && !ticket.value?.agent;
});

// --- Actions ---

async function loadTicket(showLoading = true) {
    if (showLoading) loading.value = true;
    try {
        ticket.value = await ticketService.getTicket(ticketId);
    } catch (error) {
        console.error('Failed to load ticket', error);
    } finally {
        if (showLoading) loading.value = false;
    }
}

async function loadAgents() {
    if (!authStore.isAgent && !authStore.isAdmin) return;
    loadingAgents.value = true;
    try {
        agents.value = await ticketService.getAgents();
    } catch (error) {
        console.error('Error loading agents', error);
    } finally {
        loadingAgents.value = false;
    }
}

async function handleDownload(fileId: number) {
    try {
        const response = await ticketService.downloadFile(fileId);
        if (response.url) {
            window.open(response.url, '_blank');
        }
    } catch (error) {
        console.error('Download failed', error);
        alert('Error al descargar el archivo.');
    }
}

async function handleResolve() {
    if (!confirm('¿Marcar ticket como resuelto?')) return;
    await ticketService.resolveTicket(ticketId);
    await loadTicket(false);
}

async function handleClose() {
    if (!confirm('¿Cerrar ticket definitivamente?')) return;
    await ticketService.closeTicket(ticketId);
    await loadTicket(false);
}

async function handleRestore() {
    if (!confirm('¿Restaurar ticket?')) return;
    await ticketService.restoreTicket(ticketId);
    await loadTicket(false);
}

function startEdit() {
    if (!ticket.value) return;
    editForm.value.title = ticket.value.title;
    editForm.value.priority = ticket.value.priority;
    isEditing.value = true;
}

async function handleUpdate() {
    updatingTicket.value = true;
    try {
        await ticketService.updateTicket(ticketId, editForm.value);
        isEditing.value = false;
        await loadTicket(false);
    } catch (error) {
        console.error('Error updating ticket', error);
        alert('Error al actualizar el ticket.');
    } finally {
        updatingTicket.value = false;
    }
}

// ... importaciones ...

async function handleAssignFromDropdown(event: Event) {
    const target = event.target as HTMLSelectElement;
    const agentId = target.value;

    if (!agentId) return;

    try {
        // ADMIN: Usa PUT /assign
        await ticketService.assignAgent(ticketId, Number(agentId));
        await loadTicket(false);
    } catch (error) {
        console.error('Error assigning agent', error);
        alert('Error al asignar el agente.');
    }
}

async function handleAssignSelf() {
    if (!authStore.user?.id) return;
    try {
        // AGENTE: Usa POST /addAgent (Corregido para usar el método correcto)
        // Nota: Pasamos el ID del usuario actual
        await ticketService.addAgent(ticketId);
        await loadTicket(false);
    } catch (error) {
        console.error('Error auto-assigning', error);
        alert('Error al tomar el ticket.');
    }
}


function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        answerFiles.value = Array.from(target.files);
    }
}

const scrollToTop = async () => {
    // Esperamos a que Vue termine de renderizar el nuevo mensaje en el DOM
    await nextTick();

    if (chatContainer.value) {
        chatContainer.value.scrollTo({
            top: 0,
            behavior: 'smooth' // Movimiento fluido
        });
    }
};

const handleTyping = () => {
    echo.join(`ticket.${ticketId}`)
        .whisper('typing', {
            name: authStore.user?.name
        });
};

async function submitAnswer() {
    if (!newAnswer.value.trim()) return;
    sendingAnswer.value = true;
    try {
        const formData = new FormData();
        formData.append('body', newAnswer.value);
        answerFiles.value.forEach((file) => {
            formData.append('files[]', file);
        });

        await ticketService.addMessage(ticketId, formData);
        newAnswer.value = '';
        answerFiles.value = [];
        await loadTicket(false);
        scrollToTop();
    } catch (error) {
        console.error('Failed to post answer', error);
        alert('Error al enviar respuesta.');
    } finally {
        sendingAnswer.value = false;
    }
}



// onMounted(async () => {
//     // 1. Cargamos el ticket primero para asegurar que tenemos el ID
//     await loadTicket();

//     if (authStore.isAgent || authStore.isAdmin) {
//         loadAgents();
//     }

//     // 2. UNA SOLA CONEXIÓN al canal de presencia
//     echo.join(`ticket.${ticketId}`)
//         .here((users: any[]) => {
//             activeUsers.value = users;
//         })
//         .joining((user: any) => {
//             if (!activeUsers.value.find(u => u.id === user.id)) activeUsers.value.push(user);
//         })
//         .leaving((user: any) => {
//             activeUsers.value = activeUsers.value.filter((u: any) => u.id !== user.id);
//         })
//         // Escuchamos Mensajes de Chat
//         .listen('.App\\Events\\TicketMessageSent', (e: any) => {
//             console.log('📨 Mensaje recibido');
//             const newMessage = {
//                 id: e.id,
//                 body: e.body,
//                 created_at: e.created_at,
//                 user: { id: e.sender_id, name: e.sender_name, rol: { name: e.sender_rol } },
//                 files: e.files || []
//             };
//             const exists = ticket.value?.answers.some((a: any) => a.id === newMessage.id);
//             if (!exists) {
//                 ticket.value?.answers.unshift(newMessage);
//                 scrollToTop();
//             }
//         })
//         // Escuchamos Cambios de Estado/Agente (Badge)
//         .listen('.App\\Events\\TicketUpdated', (e: any) => {
//             console.log('🔄 Update recibido:', e.ticket);
//             // Esto actualizará el StatusBadge y el Agente automáticamente
//             ticket.value = { ...ticket.value, ...e.ticket };
//         })
//         // Escuchamos el "Escribiendo..."
//         .listenForWhisper('typing', (e: any) => {
//             typingUser.value = e.name;
//             if (typingTimer) clearTimeout(typingTimer);
//             typingTimer = setTimeout(() => { typingUser.value = null; }, 3000);
//         });
// });

// onUnmounted(() => {
//     // Al salir, cerramos la conexión única
//     echo.leave(`ticket.${ticketId}`);
// });
onMounted(() => {
    loadTicket();
    // Always try to load agents if allowed, to populate the dropdown for Admin or potentially map names later
    if (authStore.isAgent || authStore.isAdmin) {
        loadAgents();
    }

    if(authStore.isAgent){
        echo.private(`App.Models.User.${authStore.user?.id}`)
        .listen(`App\\Events\\TicketAgentRevoke`, (e: any) =>{
            console.log('Evento de revocación recibido:', e);
            if(ticket.value?.id === e.ticket_id){
                alert("Tu asignacion a este ticket ha sido revocada.");
                router.push({name : 'dashboard'});
            } 
        });
    }
    // 1. Canal Privado: Escuchar mensajes nuevos (Backend: PrivateChannel)
    echo.private(`ticket.${ticketId}`)
        .listen('.App\\Events\\TicketMessageSent', (e: any) => {

            if (!ticket.value) return;
            if (!ticket.value.answers) ticket.value.answers = [];

            const newMessage = {
                id: e.id,
                body: e.body,
                created_at: e.created_at,
                user: {
                    id: e.sender_id,
                    name: e.sender_name,
                    rol: e.sender_rol,
                },
                files: e.files || []
            };
            console.log('📨 ¡Mensaje de chat recibido!', newMessage);
            const exists = ticket.value.answers.some((a: any) => a.id === newMessage.id);
            if (!exists) {
                ticket.value.answers.unshift(newMessage);
                scrollToTop();
            }
        })
        .listen('.App\\Events\\TicketUpdated', (e: any) => {
            // console.log('¡El ticket ha sufrido un cambio!', e);
            ticket.value = { ...ticket.value, ...e.ticket };
        });
    // 2. Canal de Presencia: Usuarios online y Typing (Backend: PresenceChannel)
    echo.join(`ticket.${ticketId}`)
        .here((users: any[]) => {
            activeUsers.value = users;
        })
        .joining((user: any) => {
            activeUsers.value.push(user);
        })
        .leaving((user: any) => {
            activeUsers.value = activeUsers.value.filter((u: any) => u.id !== user.id);
        })
        .listenForWhisper('typing', (e: any) => {
            typingUser.value = e.name;
            if (typingTimer) clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                typingUser.value = null;
            }, 3000);
        });
});

onUnmounted(() => {
    // Desconectar de ambos canales explícitamente
    echo.leave(`private-ticket.${ticketId}`);
    echo.leave(`presence-ticket.${ticketId}`);
    echo.leave(`ticket.${ticketId}`);
});
</script>

<template>
    <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <div v-else-if="ticket" class="space-y-6">
        <!-- Header -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6 flex justify-between items-start">
                <div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        #{{ ticket.id }} - {{ ticket.title }}
                    </h3>
                    <p class="mt-1 max-w-2xl text-sm text-gray-500">
                        Reportado el {{ dayjs(ticket.created_at).format('DD/MM/YYYY HH:mm') }}
                    </p>
                    <div v-if="activeUsers.length > 0" class="mt-2 flex items-center">
                        <span class="text-xs text-gray-500 mr-2">En línea:</span>
                        <div class="flex -space-x-1 overflow-hidden">
                            <div v-for="user in activeUsers" :key="user.id"
                                class="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-indigo-100"
                                :title="user.name">
                                <span class="text-xs font-medium text-indigo-800">{{ user.name ?
                                    user.name.charAt(0).toUpperCase() : '?' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <StatusBadge :status="ticket.status" />
                    <PriorityBadge :priority="ticket.priority" />
                </div>
            </div>

            <!-- Actions Bar -->
            <div class="border-t border-gray-200 px-4 py-3 bg-gray-50 text-right space-x-3 sm:px-6">
                <BaseButton v-if="canEdit" @click="router.push({ name: 'edit-ticket', params: { id: ticket.id } })"
                    variant="white" size="sm">Editar</BaseButton>
                <BaseButton v-if="canAssignSelf" @click="handleAssignSelf" variant="secondary" size="sm">Tomar Ticket
                </BaseButton>
                <BaseButton v-if="canResolve" @click="handleResolve" variant="primary" size="sm">Resolver</BaseButton>
                <BaseButton v-if="canClose" @click="handleClose" variant="danger" size="sm">Cerrar</BaseButton>
                <BaseButton v-if="canRestore" @click="handleRestore" variant="secondary" size="sm">Restaurar
                </BaseButton>
            </div>



            <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div v-if="isEditing" class="sm:col-span-2 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Título</label>
                            <BaseInput id="edit-title" v-model="editForm.title" class="mt-1" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Prioridad</label>
                            <select v-model="editForm.priority"
                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border">
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>
                    <div class="sm:col-span-1">
                        <dt class="text-sm font-medium text-gray-500">Solicitante</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ ticket.customer.name }}</dd>
                    </div>
                    <div class="sm:col-span-1">
                        <dt class="text-sm font-medium text-gray-500 self-center">Agente Asignado</dt>
                        <dd class="mt-1 text-sm text-gray-900">
                            <!-- Business Rule: Admins always have full control (Dropdown) -->
                            <div v-if="authStore.isAdmin" class="flex items-center space-x-2">
                                <select :value="ticket.agent?.id || ''" @change="handleAssignFromDropdown($event)"
                                    class="block w-full text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md h-8 p-1 border bg-white">
                                    <option value="">Sin Asignar</option>
                                    <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                                        {{ agent.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Business Rule: Agents can only 'Take' unassigned tickets (Button) -->
                            <div v-else-if="authStore.isAgent && !ticket.agent" class="flex items-center">
                                <span class="mr-2 text-gray-500 italic">Sin asignar</span>
                                <button @click="handleAssignSelf"
                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm">
                                    Tomar Ticket
                                </button>
                            </div>

                            <!-- Default: Static Text (Assigned to self/other or Customer view) -->
                            <span v-else class="flex items-center font-medium">
                                <UserCircleIcon class="h-5 w-5 text-gray-400 mr-2" />
                                {{ ticket.agent?.name || 'Sin asignar' }}
                            </span>
                        </dd>
                    </div>

                    <div class="sm:col-span-2">
                        <dt class="text-sm font-medium text-gray-500">Archivos Adjuntos</dt>
                        <dd class="mt-1 text-sm text-gray-900">
                            <ul v-if="ticket.files && ticket.files.length"
                                class="border border-gray-200 rounded-md divide-y divide-gray-200">
                                <li v-for="file in ticket.files" :key="file.id"
                                    class="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                    <div class="w-0 flex-1 flex items-center">
                                        <PaperClipIcon class="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                        <span class="ml-2 flex-1 w-0 truncate">{{ file.name }}</span>
                                    </div>
                                    <div class="ml-4 flex-shrink-0">
                                        <button @click="handleDownload(file.id)"
                                            class="font-medium text-indigo-600 hover:text-indigo-500">
                                            Descargar
                                        </button>
                                    </div>
                                </li>
                            </ul>
                            <span v-else class="text-gray-500 italic">No hay archivos.</span>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>

        <!-- Answers Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Respuestas</h4>
            <div v-if="typingUser" class="text-sm text-gray-500 italic mb-2 px-1">
                <span class="animate-pulse">...</span> {{ typingUser }} está escribiendo
            </div>

            <div ref="chatContainer" class="answers-container space-y-4 max-h-[600px] overflow-y-auto p-4">
                <div v-if="!ticket.answers || ticket.answers.length === 0" class="text-center text-gray-500 py-4">
                    No hay respuestas aún.
                </div>

                <div v-for="answer in ticket.answers" :key="answer.id" class="bg-white shadow rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <UserCircleIcon class="h-8 w-8 text-gray-400 mr-2" />
                            <div>
                                <p class="text-sm font-medium text-gray-900">
                                    {{ answer.user?.name || 'Usuario' }}
                                    <span class="text-xs text-gray-500 ml-1">({{ answer.user?.rol ||
                                        answer.user?.['user rol'] }})</span>
                                </p>
                                <p class="text-xs text-gray-500">{{ dayjs(answer.created_at).fromNow() }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="text-sm text-gray-800 whitespace-pre-line pl-10">
                        {{ answer.body }}
                    </div>
                    <!-- Answer Files -->
                    <div v-if="answer.files && answer.files.length" class="mt-3 pl-10">
                        <p class="text-xs text-gray-500 font-medium mb-1">Adjuntos:</p>
                        <ul class="flex gap-2 flex-wrap">
                            <li v-for="file in answer.files" :key="file.id">
                                <button @click="handleDownload(file.id)"
                                    class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                    <PaperClipIcon class="h-3 w-3 mr-1" />
                                    {{ file.name || 'Archivo' }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Add Answer Form -->
            <div v-if="ticket.status !== 'closed'" class="mt-6 bg-white shadow rounded-lg p-4">
                <h5 class="text-sm font-medium text-gray-900 mb-2">Agregar Respuesta</h5>
                <form @submit.prevent="submitAnswer">
                    <textarea v-model="newAnswer" rows="3"
                        class="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="Escribe tu respuesta..." required @input="handleTyping"></textarea>

                    <div class="mt-3 flex items-center justify-between">
                        <label class="cursor-pointer flex items-center text-sm text-gray-600 hover:text-indigo-600">
                            <PaperClipIcon class="h-5 w-5 mr-1" />
                            <span>Adjuntar archivos</span>
                            <input type="file" multiple class="hidden" @change="handleFileChange">
                        </label>

                        <BaseButton type="submit" :loading="sendingAnswer" :disabled="!newAnswer.trim()">
                            Responder
                        </BaseButton>
                    </div>
                    <div v-if="answerFiles.length" class="mt-2 text-xs text-gray-500">
                        {{ answerFiles.length }} archivos seleccionados.
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
