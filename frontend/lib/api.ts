const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions extends RequestInit {
    token?: string;
}

async function request<T>(endpoint: string,options:RequestOptions = {}): Promise<T> {
    const {token, headers, ...rest} = options;
    const response = await fetch(`${API_URL}${endpoint}`,{ 
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}`}: {}),
            ...headers,
        },
    });

    if(!response.ok){
        const errorBody = await response.text();
        throw new Error(`API error ${response.status}: ${errorBody}`);
    }
    if (response.status === 204){
        return undefined as T;
    }
    return response.json();
}

export const api = {
    get: <T>(endpoint: string, token?: string)=>
        request<T>(endpoint, {method: "GET", token}),
    post: <T>(endpoint: string, body?: unknown, token?: string)=>
        request<T>(endpoint, {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
            token,
        }),
};