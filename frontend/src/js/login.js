import { Auth } from './auth.js';
import { fetchGraphQL, GRAPHQL_URLS } from './api.js';

// Redirect if already logged in
Auth.redirectIfAuthenticated();

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const button = e.target.querySelector('button');
    const originalBtnText = button.innerHTML;

    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        button.disabled = true;
        button.innerHTML = 'Memuat...';

        const query = `
            mutation {
                login(username: "${username}", password: "${password}") {
                    token
                    user {
                        id
                        username
                        fullName
                        role
                    }
                }
            }
        `;

        const data = await fetchGraphQL(GRAPHQL_URLS.AUTH, query);

        if (data.login) {
            Auth.login(data.login.token, data.login.user);
        }
    } catch (error) {
        console.error(error);
        alert('Login gagal: ' + error.message);
        button.disabled = false;
        button.innerHTML = originalBtnText;
    }
});
