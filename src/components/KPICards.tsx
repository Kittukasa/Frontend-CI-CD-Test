import React from 'react';

interface KPIData {
  totalCustomers: number;
  repeatCustomerRate: number;
  avgTransactionValue: number;
  newCustomersThisMonth: number;
}

interface KPICardsProps {
  data: KPIData | null;
  loading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ data, loading }) => {
  const kpis = [
    {
      label: 'Total Customers',
      value: data?.totalCustomers?.toLocaleString() || '0',
      isPercentage: false,
    },
    {
      label: 'Repeat Customer Rate',
      value: `${data?.repeatCustomerRate || 0}%`,
      isPercentage: true,
    },
    {
      label: 'Avg. Transaction Value',
      value: `₹${data?.avgTransactionValue?.toLocaleString() || '0'}`,
      isPercentage: false,
    },
    {
      label: 'New Customers (This Month)',
      value: data?.newCustomersThisMonth?.toLocaleString() || '0',
      isPercentage: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">{kpi.label}</div>
          <div
            className={`text-2xl font-bold ${
              loading ? 'text-gray-500' : kpi.isPercentage ? 'text-green-400' : 'text-white'
            }`}
          >
            {loading ? '...' : kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
