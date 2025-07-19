import React, { useEffect, useState } from "react";

const PaymentFormFields = ({ onRetry }: { onRetry?: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    if (!sessionId) {
      setLoading(false);
      setPaymentSuccess(false);
      setErrorMessage("Missing payment session. Please try again.");
      return;
    }
    fetch(`/functions/v1/verify-checkout-session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setPaymentSuccess(data.paid);
        setLoading(false);
        if (!data.paid && data.error) {
          setErrorMessage(data.error);
        }
      })
      .catch((err) => {
        setLoading(false);
        setPaymentSuccess(false);
        setErrorMessage(
          "An error occurred while verifying payment. Please try again."
        );
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!paymentSuccess)
    return (
      <div>
        <div>
          Payment not successful. {errorMessage && <span>{errorMessage}</span>}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Try Again
          </button>
        )}
      </div>
    );

  return <div>{/* Payment form fields will go here */}</div>;
};

export default PaymentFormFields;
