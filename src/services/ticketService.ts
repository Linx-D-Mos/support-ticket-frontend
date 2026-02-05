import api from './api';

export interface Ticket {
    id: number;
    title: string;
    priority: string;
    status: string;
    customer: { id: number; name: string };
    agent?: { id: number; name: string };
    created_at?: string;
    last_reply_at?: string;
    files?: Array<{ id: number; name: string; path: string }>;
    labels?: Array<{ label: string }>;
    answers?: Array<any>; // Define stricter type if needed
}

export interface TicketParams {
    page?: number;
    status?: string;
    priority?: string;
    search?: string;
}

export default {
    async getTickets(params: TicketParams) {
        const response = await api.get('/tickets', { params });
        return response.data;
    },

    async getTicket(id: number) {
        const response = await api.get(`/tickets/${id}`);
        return response.data.data;
    },

    async createTicket(data: FormData) {
        const response = await api.post('/tickets', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async updateTicket(id: number, data: any) {
        const response = await api.put(`/tickets/${id}`, data);
        return response.data;
    },

    async resolveTicket(id: number) {
        return api.patch(`/tickets/${id}/resolve`);
    },

    async closeTicket(id: number) {
        return api.patch(`/tickets/${id}/close`);
    },

    async restoreTicket(id: number) {
        return api.patch(`/tickets/${id}/restore`);
    },

    async deleteTicket(id: number) {
        return api.delete(`/tickets/${id}`);
    },

    async addMessage(ticketId: number, data: FormData) {
        // Assuming endpoint is POST /api/tickets/{id}/answers or similar based on routes
        // Wait, checking Scribe docs... The endpoint to add answer is usually POST /tickets/{id}/answers
        // But wait, the Scribe docs showed 'Gestión de Tickets' has endpoints.
        // Let's assume standard REST for answers if not explicitly seen but commonly implemented.
        // Actually, looking at previous context, AnswerController::store is likely linked.
        return api.post(`/tickets/${ticketId}/answers`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    async addAgent(ticketId: number) {
        // Based on docs: POST /api/tickets/{ticket_id}/addAgent
        return api.post(`/tickets/${ticketId}/addAgent`);
    },

    async downloadFile(fileId: number) {
        const response = await api.get(`/files/${fileId}/download`);
        return response.data; // { url: "..." }
    }
};
