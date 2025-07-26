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
  
  try {
    // Get the current session to include authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Include authentication token if user is logged in
    if (session?.access_token) {
      requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Use supabase.functions.invoke for proper authentication handling
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      headers: requestHeaders
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Edge function call failed');
    }
    
    return data as T;
    
  } catch (error) {
    console.error('Error calling edge function:', error);
    throw error;
  }
};