import React from 'react';
import {
  Activity,
  BarChart,
  DollarSign,
  Download,
  Edit,
  Gift,
  Plus,
  Send,
  Settings,
  Star,
  Users,
  X,
} from 'lucide-react';
import type { LoyaltyPrograms, LoyaltyProgramKey, LoyaltyEditFormData } from './analyticsTypes';

interface LoyaltyProps {
  loyaltyPrograms: LoyaltyPrograms;
  onLoyaltyEdit: (program: LoyaltyProgramKey) => void;
  onLoyaltyToggle: (program: LoyaltyProgramKey) => void;
  loyaltyModalOpen: boolean;
  editingLoyalty: LoyaltyProgramKey | null;
  onCloseModal: () => void;
  onLoyaltySave: () => void;
  editFormData: LoyaltyEditFormData;
  onFormChange: <K extends keyof LoyaltyEditFormData>(
    field: K,
    value: LoyaltyEditFormData[K]
  ) => void;
}

const Loyalty: React.FC<LoyaltyProps> = ({
  loyaltyPrograms,
  onLoyaltyEdit,
  onLoyaltyToggle,
  loyaltyModalOpen,
  editingLoyalty,
  onCloseModal,
  onLoyaltySave,
  editFormData,
  onFormChange,
}) => {
  const activeProgramsCount = Object.values(loyaltyPrograms).filter(
    program => program.active
  ).length;
  const pointsConversionRate = loyaltyPrograms.points.conversionRate ?? 1;
  const pointsRedeemRate = loyaltyPrograms.points.redeemRate ?? 0;
  const cashbackPercentage = loyaltyPrograms.cashback.percentage ?? 0;
  const cashbackMaxAmount = loyaltyPrograms.cashback.maxAmount ?? 0;
  const cashbackMinPurchaseAmount = loyaltyPrograms.cashback.minPurchaseAmount ?? 0;
  const freeItemName = loyaltyPrograms.freeItem.itemName ?? 'Reward Item';
  const freeItemMinSpend = loyaltyPrograms.freeItem.minSpend ?? 0;
  const editingProgramTitle = editingLoyalty
    ? loyaltyPrograms[editingLoyalty].title
    : 'Loyalty Program';

  return (
    <>
      <div className="space-y-6">
        {/* Loyalty Program Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Loyalty Programs</h3>
              <p className="text-gray-300">Reward your customers and boost retention</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">
                Active: {activeProgramsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Loyalty Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Loyalty Points Card */}
          <div className="group relative">
            <div
              className={`bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer border-2 ${
                loyaltyPrograms.points.active
                  ? 'border-blue-400 shadow-blue-500/25'
                  : 'border-gray-600 opacity-75'
              }`}
              onClick={() => onLoyaltyEdit('points')}
            >
              <div className="absolute top-4 right-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    loyaltyPrograms.points.active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}
                ></div>
              </div>

              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{loyaltyPrograms.points.title}</h4>
                  <p className="text-blue-100 text-sm">Point-based rewards</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/90 text-lg font-medium mb-2">
                  {loyaltyPrograms.points.description}
                </p>
                <div className="bg-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-white/80 text-sm">
                    <span>Conversion Rate:</span>
                    <span className="font-bold">
                      ₹1 = {pointsConversionRate} point{pointsConversionRate !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-white/80 text-sm">
                    <span>Redeem Rate:</span>
                    <span className="font-bold">1 point = ₹{pointsRedeemRate.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onLoyaltyToggle('points');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    loyaltyPrograms.points.active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {loyaltyPrograms.points.active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center text-white/60 text-sm">
                  <Edit className="w-4 h-4 mr-1" />
                  <span>Click to edit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cashback Card */}
          <div className="group relative">
            <div
              className={`bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer border-2 ${
                loyaltyPrograms.cashback.active
                  ? 'border-green-400 shadow-green-500/25'
                  : 'border-gray-600 opacity-75'
              }`}
              onClick={() => onLoyaltyEdit('cashback')}
            >
              <div className="absolute top-4 right-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    loyaltyPrograms.cashback.active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}
                ></div>
              </div>

              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{loyaltyPrograms.cashback.title}</h4>
                  <p className="text-green-100 text-sm">Instant cashback</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/90 text-lg font-medium mb-2">
                  {loyaltyPrograms.cashback.description}
                </p>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center text-white/80 text-sm mb-1">
                    <span>Cashback Rate:</span>
                    <span className="font-bold">{cashbackPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80 text-sm mb-1">
                    <span>Max Amount:</span>
                    <span className="font-bold">₹{cashbackMaxAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80 text-sm">
                    <span>Min Purchase:</span>
                    <span className="font-bold">₹{cashbackMinPurchaseAmount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onLoyaltyToggle('cashback');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    loyaltyPrograms.cashback.active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {loyaltyPrograms.cashback.active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center text-white/60 text-sm">
                  <Edit className="w-4 h-4 mr-1" />
                  <span>Click to edit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Card */}
          <div className="group relative">
            <div
              className={`bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer border-2 ${
                loyaltyPrograms.freeItem.active
                  ? 'border-orange-400 shadow-orange-500/25'
                  : 'border-gray-600 opacity-75'
              }`}
              onClick={() => onLoyaltyEdit('freeItem')}
            >
              <div className="absolute top-4 right-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    loyaltyPrograms.freeItem.active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}
                ></div>
              </div>

              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{loyaltyPrograms.freeItem.title}</h4>
                  <p className="text-orange-100 text-sm">Free rewards</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/90 text-lg font-medium mb-2">
                  Get a free {freeItemName} on purchases above ₹{freeItemMinSpend}
                </p>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center text-white/80 text-sm mb-1">
                    <span>Free Item:</span>
                    <span className="font-bold">{freeItemName}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80 text-sm">
                    <span>Min Spend:</span>
                    <span className="font-bold">₹{freeItemMinSpend}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onLoyaltyToggle('freeItem');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    loyaltyPrograms.freeItem.active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {loyaltyPrograms.freeItem.active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center text-white/60 text-sm">
                  <Edit className="w-4 h-4 mr-1" />
                  <span>Click to edit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Future Loyalty Types Section */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Future Loyalty Programs</h4>
              <p className="text-gray-400">
                Expand your loyalty ecosystem with additional program types
              </p>
            </div>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Plus className="w-5 h-5 inline mr-2" />
              Add New Program
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="bg-gray-800 rounded-xl p-4 border border-gray-600 hover:border-purple-500 transition-all duration-300 cursor-pointer group"
              onClick={() => onLoyaltyEdit('appReferral')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-purple-600/20 p-2 rounded-lg mr-3 group-hover:bg-purple-600/30 transition-all">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h5 className="text-white font-semibold">App Referral</h5>
              </div>
              <p className="text-gray-400 text-sm">Users refer friends to the app for rewards</p>
              <div className="mt-3 flex items-center justify-between">
                <div
                  className={`text-xs font-medium ${
                    loyaltyPrograms.appReferral.active ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {loyaltyPrograms.appReferral.active ? 'Active' : 'Inactive'}
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onLoyaltyToggle('appReferral');
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    loyaltyPrograms.appReferral.active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {loyaltyPrograms.appReferral.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            <div
              className="bg-gray-800 rounded-xl p-4 border border-gray-600 hover:border-yellow-500 transition-all duration-300 cursor-pointer group"
              onClick={() => onLoyaltyEdit('influencerReferral')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-yellow-600/20 p-2 rounded-lg mr-3 group-hover:bg-yellow-600/30 transition-all">
                  <Star className="w-6 h-6 text-yellow-400" />
                </div>
                <h5 className="text-white font-semibold">Influencer Referral</h5>
              </div>
              <p className="text-gray-400 text-sm">Influencers earn commissions for referrals</p>
              <div className="mt-3 flex items-center justify-between">
                <div
                  className={`text-xs font-medium ${
                    loyaltyPrograms.influencerReferral.active ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {loyaltyPrograms.influencerReferral.active ? 'Active' : 'Inactive'}
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onLoyaltyToggle('influencerReferral');
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    loyaltyPrograms.influencerReferral.active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {loyaltyPrograms.influencerReferral.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-600 hover:border-green-500 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center mb-3">
                <div className="bg-green-600/20 p-2 rounded-lg mr-3 group-hover:bg-green-600/30 transition-all">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <h5 className="text-white font-semibold">Gamification</h5>
              </div>
              <p className="text-gray-400 text-sm">Badges, challenges, and achievements</p>
              <div className="mt-3 text-green-400 text-xs font-medium">Coming Soon</div>
            </div>
          </div>
        </div>

        {/* Loyalty Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">Program Performance</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-blue-900 font-semibold">Points Program</p>
                  <p className="text-blue-600 text-sm">Active members: 1,234</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹45,678</p>
                  <p className="text-blue-500 text-sm">Revenue generated</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-green-900 font-semibold">Cashback Program</p>
                  <p className="text-green-600 text-sm">Active members: 567</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">₹23,456</p>
                  <p className="text-green-500 text-sm">Revenue generated</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-orange-900 font-semibold">Discount Program</p>
                  <p className="text-orange-600 text-sm">Active members: 890</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">₹34,567</p>
                  <p className="text-orange-500 text-sm">Revenue generated</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h4>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                <BarChart className="w-5 h-5 inline mr-2" />
                View Detailed Analytics
              </button>

              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Send className="w-5 h-5 inline mr-2" />
                Send Loyalty Notifications
              </button>

              <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white p-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Download className="w-5 h-5 inline mr-2" />
                Export Loyalty Data
              </button>

              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Settings className="w-5 h-5 inline mr-2" />
                Program Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Loyalty Edit Modal */}
      {loyaltyModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={event => {
            if (event.target === event.currentTarget) {
              onCloseModal();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit {editingProgramTitle}</h3>
                <button
                  onClick={onCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {editingLoyalty === 'points' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conversion Rate (Points per ₹1)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={editFormData.conversionRate}
                        onChange={e =>
                          onFormChange('conversionRate', parseFloat(e.target.value) || 1)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">points/₹1</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Customer earns {editFormData.conversionRate} point
                      {editFormData.conversionRate !== 1 ? 's' : ''} for every ₹1 spent
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redeem Rate (₹ per Point)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editFormData.redeemRate}
                        onChange={e =>
                          onFormChange('redeemRate', parseFloat(e.target.value) || 0.1)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.10"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₹/point</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Customer gets ₹{editFormData.redeemRate.toFixed(2)} for every 1 point redeemed
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>
                        • Customer spends ₹100 → Earns{' '}
                        {(editFormData.conversionRate * 100).toFixed(0)} points
                      </p>
                      <p>
                        • Customer redeems {Math.ceil(10 / editFormData.redeemRate)} points → Gets ₹
                        {(
                          Math.ceil(10 / editFormData.redeemRate) * editFormData.redeemRate
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {editingLoyalty === 'cashback' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cashback Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editFormData.percentage}
                        onChange={e => onFormChange('percentage', parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="10"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Cashback Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="50"
                        value={editFormData.maxAmount}
                        onChange={e => onFormChange('maxAmount', parseInt(e.target.value) || 500)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₹</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        value={editFormData.minPurchaseAmount}
                        onChange={e =>
                          onFormChange('minPurchaseAmount', parseInt(e.target.value) || 1000)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1000"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₹</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingLoyalty === 'freeItem' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Item Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.itemName}
                      onChange={e => onFormChange('itemName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Free Veg Burger"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Description
                    </label>
                    <textarea
                      value={editFormData.itemDescription}
                      onChange={e => onFormChange('itemDescription', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Complimentary item for loyal customers"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Spend
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        value={editFormData.minSpend}
                        onChange={e => onFormChange('minSpend', parseInt(e.target.value) || 1000)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="1000"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₹</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {editingLoyalty === 'appReferral' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Per Referral
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        value={editFormData.pointsPerReferral}
                        onChange={e =>
                          onFormChange('pointsPerReferral', parseInt(e.target.value) || 100)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="100"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">points</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Referrals Per User
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editFormData.maxReferrals}
                      onChange={e => onFormChange('maxReferrals', parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referral Bonus (for new user)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        value={editFormData.referralBonus}
                        onChange={e =>
                          onFormChange('referralBonus', parseInt(e.target.value) || 50)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="50"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">points</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {editingLoyalty === 'influencerReferral' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editFormData.commissionRate}
                        onChange={e =>
                          onFormChange('commissionRate', parseInt(e.target.value) || 15)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="15"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Referrals Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editFormData.minReferrals}
                      onChange={e => onFormChange('minReferrals', parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus Threshold (referrals)
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={editFormData.bonusThreshold}
                      onChange={e => onFormChange('bonusThreshold', parseInt(e.target.value) || 20)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        value={editFormData.bonusAmount}
                        onChange={e =>
                          onFormChange('bonusAmount', parseInt(e.target.value) || 1000)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="1000"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₹</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={onCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onLoyaltySave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Loyalty;
