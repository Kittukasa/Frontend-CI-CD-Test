import React from 'react';
import {
  Database,
  Zap,
  Users,
  Smartphone,
  MessageSquare,
  Clock,
  Send,
  Mail,
  Bell,
  DollarSign,
  X,
} from 'lucide-react';
import type { CDPCustomer, CommunicationPaths } from './analyticsTypes';

interface CDPProps {
  customers: CDPCustomer[];
  selectedCustomer: CDPCustomer | null;
  onCustomerSelect: (customer: CDPCustomer) => void;
  onCloseDetails: () => void;
}

const communicationPathLabels: Record<keyof CommunicationPaths, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
  appNotification: 'App Notification',
};

const getCommunicationPathIcon = (pathType: keyof CommunicationPaths | string) => {
  switch (pathType) {
    case 'whatsapp':
      return <MessageSquare className="w-5 h-5" />;
    case 'sms':
      return <Smartphone className="w-5 h-5" />;
    case 'email':
      return <Mail className="w-5 h-5" />;
    case 'appNotification':
      return <Bell className="w-5 h-5" />;
    default:
      return <MessageSquare className="w-5 h-5" />;
  }
};

const getSortedCommunicationPaths = (communicationPaths: CommunicationPaths) =>
  Object.entries(communicationPaths)
    .filter(([, path]) => path.available)
    .sort(([, a], [, b]) => b.openRate - a.openRate) as Array<
    [keyof CommunicationPaths, CommunicationPaths[keyof CommunicationPaths]]
  >;

const CDP: React.FC<CDPProps> = ({
  customers,
  selectedCustomer,
  onCustomerSelect,
  onCloseDetails,
}) => {
  const availableSortedPaths = selectedCustomer
    ? getSortedCommunicationPaths(selectedCustomer.communicationPaths)
    : [];

  const topOpenRate =
    selectedCustomer && availableSortedPaths.length > 0 ? availableSortedPaths[0][1].openRate : 0;

  return (
    <div className="space-y-6">
      {/* CDP Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-xl shadow-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Customer Data Platform
              </h3>
              <p className="text-indigo-200 text-lg">AI-powered customer insights and engagement</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Zap className="w-8 h-8 text-yellow-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Cards Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">Smart Customer Profiles</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{customers.length} customers</span>
              </div>
            </div>

            {/* Customer Cards Grid */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {customers.map(customer => {
                const availableOpenRates = Object.values(customer.communicationPaths)
                  .filter(path => path.available)
                  .map(path => path.openRate);
                const bestOpenRate =
                  availableOpenRates.length > 0 ? Math.max(...availableOpenRates) : 0;

                return (
                  <div
                    key={customer.id}
                    onClick={() => onCustomerSelect(customer)}
                    className={`relative bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group ${
                      selectedCustomer?.id === customer.id
                        ? 'border-indigo-400 shadow-lg ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Customer Type Badge */}
                    <div
                      className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white ${
                        customer.customerType === 'Premium'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : customer.customerType === 'Standard'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}
                    >
                      {customer.customerType}
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h5 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                          {customer.name}
                        </h5>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <Smartphone className="w-4 h-4 mr-2" />
                          <span>{customer.mobile}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Active {customer.lastActivity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-green-600 uppercase">
                              Total Spent
                            </p>
                            <p className="text-sm font-bold text-green-900">
                              ₹{customer.totalSpent.toLocaleString()}
                            </p>
                          </div>
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div>
                          <p className="text-xs font-medium text-blue-600 uppercase mb-2">
                            Best Path
                          </p>
                          <div className="flex items-center justify-between">
                            {['sms', 'whatsapp', 'email', 'appNotification'].map(
                              (pathType, idx) => {
                                const path =
                                  customer.communicationPaths[pathType as keyof CommunicationPaths];
                                const isTopPath =
                                  path?.openRate === bestOpenRate && path?.available;

                                return (
                                  <React.Fragment key={pathType}>
                                    <div className="flex flex-col items-center space-y-1">
                                      <div
                                        className={`p-1 rounded-full ${
                                          pathType === 'sms'
                                            ? 'bg-blue-100'
                                            : pathType === 'whatsapp'
                                            ? 'bg-green-100'
                                            : pathType === 'email'
                                            ? 'bg-purple-100'
                                            : 'bg-orange-100'
                                        }`}
                                      >
                                        {pathType === 'sms' && (
                                          <Smartphone className="w-2.5 h-2.5 text-blue-600" />
                                        )}
                                        {pathType === 'whatsapp' && (
                                          <MessageSquare className="w-2.5 h-2.5 text-green-600" />
                                        )}
                                        {pathType === 'email' && (
                                          <Mail className="w-2.5 h-2.5 text-purple-600" />
                                        )}
                                        {pathType === 'appNotification' && (
                                          <Bell className="w-2.5 h-2.5 text-orange-600" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-xs font-medium ${
                                          pathType === 'sms'
                                            ? 'text-blue-700'
                                            : pathType === 'whatsapp'
                                            ? 'text-green-700'
                                            : pathType === 'email'
                                            ? 'text-purple-700'
                                            : 'text-orange-700'
                                        }`}
                                      >
                                        {pathType === 'appNotification'
                                          ? 'App'
                                          : pathType.toUpperCase()}
                                      </span>
                                      {isTopPath && (
                                        <span className="text-[10px] font-semibold text-indigo-600">
                                          {path.openRate}%
                                        </span>
                                      )}
                                    </div>
                                    {idx < 3 && <div className="text-blue-400 text-sm">→</div>}
                                  </React.Fragment>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Message */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4 mb-4">
                      <p className="text-sm text-indigo-900 font-medium mb-1">Suggested Message</p>
                      <p className="text-sm text-indigo-700">{customer.suggestedMessage}</p>
                    </div>

                    {/* Communication Paths Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getSortedCommunicationPaths(customer.communicationPaths)
                        .slice(0, 4)
                        .map(([pathType, pathData]) => {
                          const pathLabel = communicationPathLabels[pathType];
                          const config = (() => {
                            switch (pathType) {
                              case 'whatsapp':
                                return {
                                  bgColor: 'bg-green-50',
                                  borderColor: 'border-green-200',
                                  iconColor: 'text-green-600',
                                  textColor: 'text-green-700',
                                };
                              case 'sms':
                                return {
                                  bgColor: 'bg-blue-50',
                                  borderColor: 'border-blue-200',
                                  iconColor: 'text-blue-600',
                                  textColor: 'text-blue-700',
                                };
                              case 'email':
                                return {
                                  bgColor: 'bg-purple-50',
                                  borderColor: 'border-purple-200',
                                  iconColor: 'text-purple-600',
                                  textColor: 'text-purple-700',
                                };
                              case 'appNotification':
                                return {
                                  bgColor: 'bg-orange-50',
                                  borderColor: 'border-orange-200',
                                  iconColor: 'text-orange-600',
                                  textColor: 'text-orange-700',
                                };
                              default:
                                return {
                                  bgColor: 'bg-gray-50',
                                  borderColor: 'border-gray-200',
                                  iconColor: 'text-gray-600',
                                  textColor: 'text-gray-700',
                                };
                            }
                          })();

                          return (
                            <div
                              key={pathType}
                              className={`flex items-center justify-between p-3 rounded-lg border ${config.bgColor} ${config.borderColor} relative`}
                            >
                              {pathData.openRate === topOpenRate && (
                                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                  #1
                                </div>
                              )}
                              <div className="flex items-center">
                                <div className={`mr-3 ${config.iconColor}`}>
                                  {getCommunicationPathIcon(pathType)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {pathLabel}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-bold ${config.textColor}`}>
                                  {pathData.openRate}%
                                </div>
                                <div className="text-xs text-gray-500">Open Rate</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer Details Panel */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">Customer Details</h4>
                <button
                  onClick={onCloseDetails}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      selectedCustomer.customerType === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : selectedCustomer.customerType === 'Standard'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}
                  >
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h5 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h5>
                    <p className="text-sm text-gray-600">{selectedCustomer.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Suggested Message */}
              <div className="mb-6">
                <h6 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  AI Suggested Message
                </h6>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">{selectedCustomer.suggestedMessage}</p>
                </div>
              </div>

              {/* Communication Paths */}
              <div className="space-y-3 mb-6">
                <h6 className="text-sm font-semibold text-gray-700">Preferred Channels</h6>
                <div className="space-y-2">
                  {availableSortedPaths.map(([pathType, pathData], index) => {
                    const label = communicationPathLabels[pathType];
                    const config = (() => {
                      switch (pathType) {
                        case 'whatsapp':
                          return {
                            bgColor: 'bg-green-50',
                            borderColor: 'border-green-200',
                            iconColor: 'text-green-600',
                            textColor: 'text-green-700',
                          };
                        case 'sms':
                          return {
                            bgColor: 'bg-blue-50',
                            borderColor: 'border-blue-200',
                            iconColor: 'text-blue-600',
                            textColor: 'text-blue-700',
                          };
                        case 'email':
                          return {
                            bgColor: 'bg-purple-50',
                            borderColor: 'border-purple-200',
                            iconColor: 'text-purple-600',
                            textColor: 'text-purple-700',
                          };
                        case 'appNotification':
                          return {
                            bgColor: 'bg-orange-50',
                            borderColor: 'border-orange-200',
                            iconColor: 'text-orange-600',
                            textColor: 'text-orange-700',
                          };
                        default:
                          return {
                            bgColor: 'bg-gray-50',
                            borderColor: 'border-gray-200',
                            iconColor: 'text-gray-600',
                            textColor: 'text-gray-700',
                          };
                      }
                    })();

                    return (
                      <div
                        key={pathType}
                        className={`flex items-center justify-between p-3 rounded-lg border ${config.bgColor} ${config.borderColor} relative`}
                      >
                        {index === 0 && (
                          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            #1
                          </div>
                        )}

                        <div className="flex items-center">
                          <div className={`mr-3 ${config.iconColor}`}>
                            {getCommunicationPathIcon(pathType)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${config.textColor}`}>
                            {pathData.openRate}%
                          </div>
                          <div className="text-xs text-gray-500">Open Rate</div>
                        </div>
                      </div>
                    );
                  })}

                  {selectedCustomer &&
                    (
                      Object.entries(selectedCustomer.communicationPaths) as Array<
                        [keyof CommunicationPaths, CommunicationPaths[keyof CommunicationPaths]]
                      >
                    )
                      .filter(([, path]) => !path.available)
                      .map(([pathType]) => (
                        <div
                          key={pathType}
                          className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200 opacity-60"
                        >
                          <div className="flex items-center">
                            <div className="mr-3 text-gray-400">
                              {getCommunicationPathIcon(pathType)}
                            </div>
                            <span className="text-sm font-medium text-gray-500">
                              {communicationPathLabels[pathType]}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Not Available</div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                  View Full Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">Select a Customer</h4>
              <p className="text-sm text-gray-500">
                Click on a customer card to view detailed insights and communication options
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CDP;
