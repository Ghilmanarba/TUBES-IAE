import { fetchGraphQL, GRAPHQL_URLS } from './api.js';

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const button = e.target.querySelector('button');
    const originalBtnText = button.innerHTML;

    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        button.disabled = true;
        button.innerHTML = 'Mendaftarkan...';

        const query = `
            mutation {
                register(
                    username: "${username}", 
                    email: "${email}",
                    password: "${password}"
                )
            }
        `;

        const data = await fetchGraphQL(GRAPHQL_URLS.AUTH, query);

        if (data.register) {
            alert(data.register); // "Registrasi berhasil (Customer)"
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error(error);
        alert('Registrasi gagal: ' + error.message);
        button.disabled = false;
        button.innerHTML = originalBtnText;
    }
});
