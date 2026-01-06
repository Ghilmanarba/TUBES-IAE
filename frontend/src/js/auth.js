export const Auth = {
    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    login(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/';
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
        }
    },

    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = '/';
        }
    }
};
