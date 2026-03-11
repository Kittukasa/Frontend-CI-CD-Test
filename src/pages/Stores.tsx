import React from 'react';
import {
  Building,
  DollarSign,
  Eye,
  GripVertical,
  MapPin,
  MessageSquare,
  Phone,
  Pin,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import type { StoreCard, StoreDetailsData } from './analyticsTypes';

interface StoresProps {
  storeCards: StoreCard[];
  selectedStoreDetails: string | null;
  storeDetailsData: StoreDetailsData | null;
  onStoreDragStart: (event: React.DragEvent, storeId: string) => void;
  onStoreDragEnd: (event: React.DragEvent) => void;
  onStoreDragOver: (event: React.DragEvent) => void;
  onStoreDrop: (event: React.DragEvent, storeId: string) => void;
  onTogglePin: (storeId: string) => void;
  onViewDetails: (storeId: string) => void;
  onCloseDetails: () => void;
}

const Stores: React.FC<StoresProps> = ({
  storeCards,
  selectedStoreDetails,
  storeDetailsData,
  onStoreDragStart,
  onStoreDragEnd,
  onStoreDragOver,
  onStoreDrop,
  onTogglePin,
  onViewDetails,
  onCloseDetails,
}) => {
  const sortedStores = [...storeCards].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.priority - b.priority;
  });

  const selectedStoreName = selectedStoreDetails
    ? storeCards.find(store => store.id === selectedStoreDetails)?.name
    : '';

  const campaignClickRate = storeDetailsData?.campaignResults.sent
    ? Math.round(
        (storeDetailsData.campaignResults.clicked / storeDetailsData.campaignResults.sent) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg shadow-xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Store Management</h3>
            <p className="text-blue-200">Manage and prioritize your stores/franchises</p>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedStores.map(store => (
          <div
            key={store.id}
            draggable
            onDragStart={event => onStoreDragStart(event, store.id)}
            onDragEnd={onStoreDragEnd}
            onDragOver={onStoreDragOver}
            onDrop={event => onStoreDrop(event, store.id)}
            className={`bg-white rounded-xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 cursor-move group relative ${
              store.isPinned
                ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-white'
                : 'border-gray-200'
            }`}
          >
            <div
              className={`absolute -top-2 -left-2 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10 ${
                store.isPinned ? 'bg-yellow-500' : 'bg-blue-600'
              }`}
            >
              {store.priority}
            </div>

            <button
              onClick={() => onTogglePin(store.id)}
              className={`absolute top-3 right-10 p-1 rounded-full transition-colors ${
                store.isPinned
                  ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={store.isPinned ? 'Unpin store' : 'Pin store'}
            >
              <Pin className={`w-4 h-4 ${store.isPinned ? 'fill-current' : ''}`} />
            </button>

            <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 transition-colors">
              <GripVertical className="w-5 h-5" />
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{store.name}</h4>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="line-clamp-2">{store.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>{store.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                        Revenue
                      </p>
                      <p className="text-lg font-bold text-green-900">
                        ₹{store.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        Orders
                      </p>
                      <p className="text-lg font-bold text-blue-900">{store.ordersCount}</p>
                    </div>
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onViewDetails(store.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedStoreDetails && storeDetailsData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={event => {
            if (event.target === event.currentTarget) {
              onCloseDetails();
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Store Details</h3>
                  <p className="text-gray-600">{selectedStoreName}</p>
                </div>
                <button
                  onClick={onCloseDetails}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">
                      TODAY
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-green-900 mb-1">
                    ₹{storeDetailsData.dailySales.toLocaleString()}
                  </h4>
                  <p className="text-sm text-green-700">Daily Sales</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                      TODAY
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-blue-900 mb-1">
                    {storeDetailsData.dailyCustomers}
                  </h4>
                  <p className="text-sm text-blue-700">Daily Customers</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                      7 DAYS
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-purple-900 mb-1">
                    ₹{storeDetailsData.weeklySales.toLocaleString()}
                  </h4>
                  <p className="text-sm text-purple-700">Weekly Sales</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">
                      7 DAYS
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-orange-900 mb-1">
                    {storeDetailsData.weeklyCustomers}
                  </h4>
                  <p className="text-sm text-orange-700">Weekly Customers</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gray-600 p-2 rounded-lg mr-3">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Campaign Results</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {storeDetailsData.campaignResults.sent}
                    </div>
                    <div className="text-sm text-gray-600">Messages Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {storeDetailsData.campaignResults.delivered}
                    </div>
                    <div className="text-sm text-gray-600">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {storeDetailsData.campaignResults.opened}
                    </div>
                    <div className="text-sm text-gray-600">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {storeDetailsData.campaignResults.clicked}
                    </div>
                    <div className="text-sm text-gray-600">Clicked</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Campaign Performance</span>
                    <span>{campaignClickRate}% Click Rate</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${campaignClickRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={onCloseDetails}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start">
          <div className="bg-blue-100 p-2 rounded-lg mr-4">
            <GripVertical className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Store Management & Prioritization
            </h4>
            <p className="text-gray-600 mb-3">
              Manage your stores with drag-and-drop reordering and pinning functionality. Pinned
              stores stay at the top for quick access.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>
                • <strong>Pin stores:</strong> Click the pin icon to keep important stores at the
                top
              </li>
              <li>
                • <strong>Drag to reorder:</strong> Drag cards within pinned or unpinned groups to
                change priority
              </li>
              <li>
                • <strong>View Details:</strong> Click to see daily/weekly sales, customers, and
                campaign results
              </li>
              <li>
                • <strong>Priority badges:</strong> Yellow badges for pinned stores, blue for
                regular stores
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;
