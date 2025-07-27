import { supabase } from "./supabase";

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
export const callEdgeFunction = async <T = any>(
  options: EdgeFunctionOptions
): Promise<T> => {
  const { functionName, payload, headers = {} } = options;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get the Supabase URL and key from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
      ...headers,
    };

    // Include authentication token if user is logged in
    if (session?.access_token) {
      requestHeaders["Authorization"] = `Bearer ${session.access_token}`;
    }

    // Use fetch directly to ensure the body is properly sent
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge function error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Edge function failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("Error calling edge function:", error);
    throw error;
  }
};
