import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/auth',
            component: () => import('@/layouts/AuthLayout.vue'),
            children: [
                {
                    path: 'login',
                    name: 'login',
                    component: () => import('@/views/LoginView.vue'),
                },
            ],
        },
        {
            path: '/',
            component: () => import('@/layouts/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/DashboardView.vue'),
                },
                {
                    path: 'tickets',
                    name: 'tickets',
                    component: () => import('@/views/tickets/TicketListView.vue'),
                },
                {
                    path: 'tickets/create',
                    name: 'create-ticket',
                    component: () => import('@/views/tickets/CreateTicketView.vue'),
                },
                {
                    path: 'tickets/:id',
                    name: 'ticket-detail',
                    component: () => import('@/views/tickets/TicketDetailView.vue'),
                },
            ],
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/views/NotFoundView.vue'),
        },
    ],
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Guard 1: Check Authentication
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next({ name: 'login' });
    }

    // Guard 2: Redirect authenticated user from login to dashboard
    if (to.name === 'login' && authStore.isAuthenticated) {
        return next({ name: 'dashboard' });
    }

    next();
});

export default router;
