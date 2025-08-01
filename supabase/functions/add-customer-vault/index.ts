import { createClient } from "npm:@supabase/supabase-js";
import { Resend } from "npm:resend";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ECOM_LIVE_SECURITY_KEY = Deno.env.get("ECOM_LIVE_SECURITY_KEY") ?? "";
const ECOM_TEST_SECURITY_KEY = Deno.env.get("ECOM_TEST_SECURITY_KEY") ?? "";
const NODE_ENV = Deno.env.get("NODE_ENV") ?? "development";
const SECURITY_KEY =
  NODE_ENV === "production" ? ECOM_LIVE_SECURITY_KEY : ECOM_TEST_SECURITY_KEY;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function parseNMIResponse(responseText) {
  const params = new URLSearchParams(responseText);
  const response = {};
  for (const [key, value] of params.entries()) {
    response[key] = value;
  }

  const parsedResponse = {
    success: response.response === "1",
    responseCode: response.response_code,
    responseText: response.responsetext,
    transactionId: response.transactionid,
    customerVaultId: response.customer_vault_id,
  };

  // ENHANCED LOGGING: Log NMI response for customer vault creation
  console.log("🔍 NMI Customer Vault Response Analysis:", {
    rawResponse: responseText,
    parsedFields: {
      response: response.response,
      response_code: response.response_code,
      responsetext: response.responsetext,
      transactionid: response.transactionid,
      customer_vault_id: response.customer_vault_id,
    },
    extractedData: {
      success: parsedResponse.success,
      transactionId: parsedResponse.transactionId,
      customerVaultId: parsedResponse.customerVaultId,
    },
  });

  return parsedResponse;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const requestBody = await req.json();
    const { business_id, payment_method } = requestBody;
    if (!business_id || !payment_method) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Get business and user details
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", business_id)
      .single();
    if (businessError || !business) {
      return new Response(
        JSON.stringify({
          error: "Business not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(
      business.owner_id
    );
    const userEmail = userData?.user?.email || "";
    // Create customer vault with Ecom Payments
    const postData = new URLSearchParams();
    postData.append("security_key", SECURITY_KEY);
    postData.append("type", "sale");
    postData.append("amount", "0.01"); // Small charge to create vault
    postData.append("ccnumber", payment_method.card_number.replace(/\s/g, ""));
    postData.append("ccexp", payment_method.expiry_date);
    postData.append("cvv", payment_method.cvv);
    postData.append("customer_vault", "add_customer");
    postData.append("currency", "USD");
    postData.append(
      "order_description",
      `Customer vault creation for ${business.name}`
    );
    // Add billing information
    if (payment_method.cardholder_name) {
      const nameParts = payment_method.cardholder_name.split(" ");
      postData.append("first_name", nameParts[0] || "");
      postData.append("last_name", nameParts.slice(1).join(" ") || "");
    }
    if (payment_method.billing_zip) {
      postData.append("zip", payment_method.billing_zip);
    }
    if (userEmail) {
      postData.append("email", userEmail);
    }
    // Make request to Ecom Payments
    const paymentResponse = await fetch(
      "https://ecompaymentprocessing.transactiongateway.com/api/transact.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: postData.toString(),
      }
    );
    const responseText = await paymentResponse.text();
    const parsedResponse = parseNMIResponse(responseText);

    // ENHANCED LOGGING: Log customer vault creation result
    console.log("🔍 Customer vault creation result:", {
      success: parsedResponse.success,
      responseCode: parsedResponse.responseCode,
      responseText: parsedResponse.responseText,
      transactionId: parsedResponse.transactionId,
      customerVaultId: parsedResponse.customerVaultId,
      hasCustomerVaultId: !!parsedResponse.customerVaultId,
    });

    if (!parsedResponse.success) {
      console.error("❌ Customer vault creation failed:", {
        responseCode: parsedResponse.responseCode,
        responseText: parsedResponse.responseText,
      });
      return new Response(
        JSON.stringify({
          error: `Failed to create customer vault: ${parsedResponse.responseText}`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ENHANCED LOGGING: Customer vault created successfully
    console.log("✅ Customer vault created successfully:", {
      customerVaultId: parsedResponse.customerVaultId,
      transactionId: parsedResponse.transactionId,
      businessId: business_id,
    });

    // Update business with customer vault ID
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        nmi_customer_vault_id: parsedResponse.customerVaultId,
        payment_method_last_four: payment_method.card_number
          .replace(/\s/g, "")
          .slice(-4),
      })
      .eq("id", business_id);

    if (updateError) {
      console.error(
        "❌ Error updating business with customer vault ID:",
        updateError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to update business record",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("✅ Business updated with customer vault ID:", {
      businessId: business_id,
      customerVaultId: parsedResponse.customerVaultId,
    });

    // Send payment method update email
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(
        business.owner_id
      );
      const userEmail = userData?.user?.email;

      if (userEmail) {
        await fetch(
          `${supabaseUrl}/functions/v1/send-payment-method-update-email`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userEmail,
              businessName: business.name,
              paymentMethodLast4: payment_method.card_number
                .replace(/\s/g, "")
                .slice(-4),
              updateDate: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            }),
          }
        );
      }
    } catch (emailError) {
      console.error("Error sending payment method update email:", emailError);
      // Don't fail the main operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Customer vault created successfully",
        customer_vault_id: parsedResponse.customerVaultId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating customer vault:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
