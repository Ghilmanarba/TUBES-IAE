


export const GRAPHQL_URLS = {
    AUTH: 'http://localhost:8001/graphql',
    TRANSACTION: 'http://localhost:8003/graphql',
    INVENTORY: 'http://localhost:8002/graphql' // Usually not exposed directly to frontend in this architecture, but checking just in case.
};

interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

export async function fetchGraphQL<T>(url: string, query: string, token?: string): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query }),
        });

        const json: GraphQLResponse<T> = await response.json();

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
