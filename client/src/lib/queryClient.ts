import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`);
  
  try {
    // For GET requests, we should never include a body
    const options: RequestInit = {
      method,
      credentials: "include",
    };
    
    // Only add Content-Type header and body for non-GET requests with data
    if (method !== "GET" && data) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    }
    
    const res = await fetch(url, options);
    
    console.log(`API Response: ${res.status} ${res.statusText} for ${method} ${url}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Error for ${method} ${url}:`, error);
    
    // Enhanced error handling to differentiate between network errors and other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Failed to connect to server. Please check your connection and try again.`);
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
