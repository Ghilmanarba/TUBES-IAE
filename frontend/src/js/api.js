export const GRAPHQL_URLS = {
    AUTH: '/api/auth',
    TRANSACTION: '/api/transaction',
    INVENTORY: '/api/inventory'
};

export async function fetchGraphQL(url, query, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    // If token passed explicitly or found in storage
    const authToken = token || localStorage.getItem('token');
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query }),
        });

        const json = await response.json();

        if (json.errors) {
            throw new Error(json.errors[0].message);
        }

        if (!json.data) {
            throw new Error("No data returned");
        }

        return json.data;
    } catch (error) {
        console.error("GraphQL Error:", error);
        throw error;
    }
}
