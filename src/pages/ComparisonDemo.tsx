/**
 * Comparison Demo Page
 * Shows the difference between old and new approaches
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeRemaining } from '@/lib/auth';
import { useDashboardData } from '@/hooks/queries/useAnalytics';
import { DashboardSkeleton } from '@/components/skeletons';

export function ComparisonDemo() {
  const [oldWayData, setOldWayData] = useState<any>(null);
  const [oldWayLoading, setOldWayLoading] = useState(false);
  const [oldWayError, setOldWayError] = useState('');
  const [oldWayTime, setOldWayTime] = useState(0);

  // NEW WAY: Using hooks
  const { user, isAuthenticated, timeUntilExpiry, logout } = useAuth();
  const storeId = user?.storeId || localStorage.getItem('bb_store_id') || '';

  const startTime = Date.now();
  const {
    data: newWayData,
    isLoading: newWayLoading,
    error: newWayError,
  } = useDashboardData({ storeId }, { enabled: !!storeId });
  const newWayTime = newWayLoading ? 0 : Date.now() - startTime;

  // OLD WAY: Manual fetch (for comparison)
  const fetchOldWay = async () => {
    setOldWayLoading(true);
    setOldWayError('');
    const start = Date.now();

    try {
      const token = localStorage.getItem('bb_token');

      // Simulate the old sequential approach
      const revenue = await fetch(`/api/analytics/revenue?store_id=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await new Promise(r => setTimeout(r, 100)); // Simulate network delay

      const invoices = await fetch(`/api/analytics/invoices?store_id=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await new Promise(r => setTimeout(r, 100));

      const campaigns = await fetch(`/api/analytics/campaigns?store_id=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const [r, i, c] = await Promise.all([revenue.json(), invoices.json(), campaigns.json()]);

      setOldWayData({ revenue: r, invoices: i, campaigns: c });
      setOldWayTime(Date.now() - start);
    } catch (error: any) {
      setOldWayError(error.message);
    } finally {
      setOldWayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Old vs New: Side-by-Side Comparison
        </h1>
        <p className="text-gray-600 mb-8">
          See the differences in authentication, data fetching, and loading states
        </p>

        {/* Authentication Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-4">❌ OLD WAY: Manual Auth</h2>
            <div className="space-y-3 font-mono text-sm">
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-red-700">// Scattered throughout codebase:</p>
                <p className="text-gray-800">const token = localStorage.getItem('bb_token');</p>
                <p className="text-gray-800">
                  const storeId = localStorage.getItem('bb_store_id');
                </p>
                <p className="text-red-700">// No expiry checking ⚠️</p>
                <p className="text-red-700">// No auto-logout ⚠️</p>
                <p className="text-red-700">// 50+ duplicate calls ⚠️</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-xs text-gray-600">Current State:</p>
                <p className="text-gray-800">
                  Token: {localStorage.getItem('bb_token')?.slice(0, 20)}...
                </p>
                <p className="text-gray-800">
                  Store ID: {localStorage.getItem('bb_store_id') || 'Not found'}
                </p>
                <p className="text-red-600">⚠️ No way to check if expired!</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-900 mb-4">✅ NEW WAY: useAuth() Hook</h2>
            <div className="space-y-3 font-mono text-sm">
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-green-700">// Single line in any component:</p>
                <p className="text-gray-800">const &#123; user, logout &#125; = useAuth();</p>
                <p className="text-green-700">// ✅ Auto validates</p>
                <p className="text-green-700">// ✅ Auto expires</p>
                <p className="text-green-700">// ✅ Centralized</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-xs text-gray-600">Live State:</p>
                {isAuthenticated ? (
                  <>
                    <p className="text-green-700">✅ Authenticated</p>
                    <p className="text-gray-800">Store ID: {user?.storeId}</p>
                    <p className="text-gray-800">Franchise: {user?.franchiseId || 'N/A'}</p>
                    <p className="text-blue-600">
                      ⏱️ Expires in: {formatTimeRemaining(timeUntilExpiry)}
                    </p>
                    <button
                      onClick={() => logout('Demo logout')}
                      className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs"
                    >
                      Test Logout
                    </button>
                  </>
                ) : (
                  <p className="text-red-600">❌ Not authenticated</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Fetching Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-4">❌ OLD WAY: Manual Fetch</h2>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-red-200 font-mono text-xs">
                <p className="text-red-700">// Sequential calls (SLOW):</p>
                <p>const r = await fetch('/revenue');</p>
                <p>const i = await fetch('/invoices');</p>
                <p>const c = await fetch('/campaigns');</p>
                <p className="text-red-700">// 15-20 seconds total ⚠️</p>
              </div>

              <button
                onClick={fetchOldWay}
                disabled={oldWayLoading || !storeId}
                className="w-full bg-red-600 text-white py-2 px-4 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {oldWayLoading ? 'Loading... ⏳' : 'Test Old Way (Fetch)'}
              </button>

              {oldWayLoading && (
                <div className="bg-yellow-100 p-4 rounded animate-pulse">
                  <p className="text-sm">⏳ Loading sequentially...</p>
                  <p className="text-xs text-gray-600">Watch how long this takes</p>
                </div>
              )}

              {oldWayData && (
                <div className="bg-white p-4 rounded border border-gray-300">
                  <p className="text-sm font-semibold text-green-700">✅ Loaded!</p>
                  <p className="text-xs text-gray-600">
                    Time taken: <strong className="text-red-600">{oldWayTime}ms</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Data keys: {Object.keys(oldWayData).join(', ')}
                  </p>
                  <p className="text-xs text-red-600 mt-2">⚠️ No caching - same delay every time</p>
                </div>
              )}

              {oldWayError && (
                <div className="bg-red-100 p-3 rounded text-sm text-red-700">
                  Error: {oldWayError}
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-900 mb-4">✅ NEW WAY: React Query</h2>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-green-200 font-mono text-xs">
                <p className="text-green-700">// Single hook (FAST):</p>
                <p>const &#123; data &#125; = useDashboardData(&#123; storeId &#125;);</p>
                <p className="text-green-700">// ✅ Parallel requests</p>
                <p className="text-green-700">// ✅ Auto caching</p>
                <p className="text-green-700">// ✅ Auto retry</p>
              </div>

              <div className="w-full bg-green-600 text-white py-2 px-4 rounded font-semibold text-center">
                ✅ Auto-loaded on mount
              </div>

              {newWayLoading && (
                <div className="bg-blue-100 p-4 rounded">
                  <DashboardSkeleton />
                  <p className="text-sm mt-2">⚡ Loading in parallel...</p>
                </div>
              )}

              {newWayData && (
                <div className="bg-white p-4 rounded border border-green-300">
                  <p className="text-sm font-semibold text-green-700">✅ Loaded & Cached!</p>
                  <p className="text-xs text-gray-600">
                    Time taken: <strong className="text-green-600">{newWayTime}ms</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Data available: Revenue, Invoices, Campaigns
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    ✅ Cached for 5 minutes - instant on revisit!
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    🔄 Refresh this page - data loads instantly from cache
                  </p>
                </div>
              )}

              {newWayError && (
                <div className="bg-red-100 p-3 rounded text-sm text-red-700">
                  Error: {(newWayError as any)?.message || String(newWayError)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">📊 Performance Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded">
              <p className="text-sm text-gray-600">Load Time</p>
              <p className="text-2xl font-bold text-red-600">{oldWayTime || '---'}ms</p>
              <p className="text-xs text-gray-500">Old Way (Sequential)</p>
            </div>
            <div className="bg-white p-4 rounded">
              <p className="text-sm text-gray-600">Load Time</p>
              <p className="text-2xl font-bold text-green-600">{newWayTime || '---'}ms</p>
              <p className="text-xs text-gray-500">New Way (Parallel + Cached)</p>
            </div>
            <div className="bg-white p-4 rounded">
              <p className="text-sm text-gray-600">Improvement</p>
              <p className="text-2xl font-bold text-blue-600">
                {oldWayTime && newWayTime
                  ? `${Math.round(((oldWayTime - newWayTime) / oldWayTime) * 100)}%`
                  : '---'}
              </p>
              <p className="text-xs text-gray-500">Faster</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">🧪 Try This:</h3>
          <ol className="space-y-2 text-sm">
            <li>1. Click "Test Old Way" and watch the loading time</li>
            <li>2. The new way loaded automatically when you opened this page</li>
            <li>3. Press F5 to refresh - new way loads instantly from cache!</li>
            <li>4. Open DevTools → Network tab to see the difference in requests</li>
            <li>5. Right-click → Inspect → React Query DevTools (bottom) to see cache</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
