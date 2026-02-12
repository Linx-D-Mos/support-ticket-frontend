import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],

    // ⚡️ EL SECRETO: Usar un authorizer manual para garantizar JSON
    authorizer: (channel: any) => {
        return {
            authorize: (socketId: string, callback: Function) => {
                axios.post(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/broadcasting/auth` : 'http://localhost/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json', // <--- ESTO ES LO QUE FALTABA
                        'Accept': 'application/json'
                    }
                })
                    .then(response => {
                        callback(false, response.data);
                    })
                    .catch(error => {
                        console.error('❌ Error Auth:', error);
                        callback(true, error);
                    });
            }
        };
    },
});

export default echo;