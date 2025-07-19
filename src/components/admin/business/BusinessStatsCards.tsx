import React from 'react';
import { Building2, CheckCircle, Star, Crown, XCircle, AlertCircle } from 'lucide-react';

interface BusinessStatsProps {
  stats: {
    total: number;
    verified: number;
    featured: number;
    members: number;
    unclaimed: number;
    inactive: number;
  };
}

const BusinessStatsCards: React.FC<BusinessStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <Building2 className="h-6 w-6 text-blue-500" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Verified</p>
            <p className="text-2xl font-bold text-white">{stats.verified}</p>
          </div>
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Featured</p>
            <p className="text-2xl font-bold text-white">{stats.featured}</p>
          </div>
          <Star className="h-6 w-6 text-purple-500" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">VIP</p>
            <p className="text-2xl font-bold text-white">{stats.members}</p>
          </div>
          <Crown className="h-6 w-6 text-yellow-500" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Unclaimed</p>
            <p className="text-2xl font-bold text-white">{stats.unclaimed}</p>
          </div>
          <AlertCircle className="h-6 w-6 text-orange-500" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Inactive</p>
            <p className="text-2xl font-bold text-white">{stats.inactive}</p>
          </div>
          <XCircle className="h-6 w-6 text-red-500" />
        </div>
      </div>
    </div>
  );
};

export default BusinessStatsCards;