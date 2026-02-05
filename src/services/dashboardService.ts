import api from './api';

export interface DashboardStats {
    total_tickets: number;
    open_tickets: number;
    closed_tickets: number;
    priority_distribution: {
        low: number;
        medium: number;
        high: number;
        urgent: number;
    };
}

export default {
    async getStats(): Promise<DashboardStats> {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
};
