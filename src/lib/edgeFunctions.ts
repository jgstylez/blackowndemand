import { supabase } from './supabase';

/**
 * Interface for Edge Function call options
 */
interface EdgeFunctionOptions {
  /** The name of the edge function to call */
  functionName: string;
  /** The payload to send to the edge function */
  payload: any;
  /** Optional custom headers to include in the request */
  headers?: Record<string, string>;
}

/**
 * Calls a Supabase Edge Function with the provided options
 * 
 * @param options - The options for the edge function call
 * @returns A promise that resolves to the response from the edge function
 */
export const callEdgeFunction = async <T = any>(options: EdgeFunctionOptions): Promise<T> => {
  const { functionName, payload, headers = {} } = options;
  
  // Get the Supabase URL and anon key from environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or anon key not found in environment variables');
  }
  
  try {
    // Make the request to the edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        ...headers
      },
      body: JSON.stringify(payload),
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to call edge function: ${response.statusText}`);
    }
    
    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error(`Error calling edge function ${functionName}:`, error);
    throw error;
  }
};

/**
 * Utility function to check if a user is authenticated before calling an edge function
 * 
 * @param options - The options for the edge function call
 * @returns A promise that resolves to the response from the edge function
 */
export const callAuthenticatedEdgeFunction = async <T = any>(options: EdgeFunctionOptions): Promise<T> => {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User is not authenticated');
  }
  
  // Call the edge function with the session token
  return callEdgeFunction<T>({
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`
    }
  });
};