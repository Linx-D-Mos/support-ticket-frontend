import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

export interface User {
    id: number;
    name: string;
    email: string;
    rol: {
        name: 'admin' | 'agent' | 'customer';
    };
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'));
    const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
    const router = useRouter();

    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.rol?.name === 'admin');
    const isAgent = computed(() => user.value?.rol?.name === 'agent');
    const isCustomer = computed(() => user.value?.rol?.name === 'customer');

    async function login(credentials: { email: string; password: string }) {
        try {
            const response = await api.post('/login', credentials);
            const { token: newToken, user: newUser } = response.data;

            token.value = newToken;
            user.value = newUser;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return true;
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Use window.location to ensure full state reset or router if available
        if (router) {
            router.push({ name: 'login' });
        } else {
            window.location.href = '/';
        }
    }

    return {
        token,
        user,
        isAuthenticated,
        isAdmin,
        isAgent,
        isCustomer,
        login,
        logout
    };
});
