import React from "react";
import { ExternalLink } from "lucide-react";

interface BillingManagementProps {
  businessId: string;
  businessName?: string;
  subscriptionStatus?: string;
  planName?: string;
  nextBillingDate?: string;
  lastPaymentDate?: string;
  paymentMethodLastFour?: string;
}

const BillingManagement: React.FC<BillingManagementProps> = ({
  businessName,
  planName,
  subscriptionStatus,
}) => {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white">
            {businessName || "Unnamed Business"}
          </h3>
          <p className="text-sm text-gray-400">
            {planName || "No plan"} • {subscriptionStatus || "Inactive"}
          </p>
        </div>
        <button
          onClick={() =>
            window.open(
              "https://billing.stripe.com/p/login/9B600kfvXajQd9Obgpa7C00",
              "_blank"
            )
          }
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Manage
        </button>
      </div>
    </div>
  );
};

export default BillingManagement;
