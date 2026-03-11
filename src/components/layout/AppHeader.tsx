import React from 'react';
import { BillboxLogo } from '@/components/common/BillboxLogo';
import { Button } from '@/components/ui/button';
import { Menu, Lock, Unlock, UserCircle2, Wallet } from 'lucide-react';
import { formatINR } from '@/utils/formatCurrency';

type AppHeaderProps = {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  revenueUnlocked: boolean;
  ownerMode: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onProfile: () => void;
  trialStartedAt?: string | null;
  trialPeriodDays?: number | null;
  walletBalance?: number | null;
  walletBalanceLoading?: boolean;
  walletBalanceError?: string | null;
  walletBalanceLow?: boolean;
  walletBalanceLabel?: string;
  showWalletBalance?: boolean;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
  showSidebarToggle = false,
  revenueUnlocked,
  ownerMode,
  onLock,
  onUnlock,
  onProfile,
  trialStartedAt,
  trialPeriodDays,
  walletBalance,
  walletBalanceLoading = false,
  walletBalanceError = null,
  walletBalanceLow = false,
  walletBalanceLabel = 'Wallet Balance',
  showWalletBalance = true,
}) => {
  const trialInfo = (() => {
    if (!trialStartedAt || !trialPeriodDays) {
      return null;
    }
    const start = new Date(trialStartedAt);
    if (Number.isNaN(start.getTime())) {
      return null;
    }
    const end = new Date(start.getTime() + trialPeriodDays * 24 * 60 * 60 * 1000);
    const diffMs = end.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      daysLeft,
      endLabel: end.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
    };
  })();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-gray-900 text-white border-b border-gray-800 shadow-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-200 hover:text-white rounded-md hover:bg-gray-800 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center cursor-pointer">
            <BillboxLogo className="h-8 w-auto" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showWalletBalance && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-1.5 text-[10px] leading-tight text-gray-300 sm:text-xs">
              <Wallet className="h-4 w-4 text-emerald-300" />
              <span className="font-semibold text-gray-100">{walletBalanceLabel}</span>
              <span className="rounded-md bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {walletBalanceLoading
                  ? 'Loading...'
                  : walletBalanceError
                  ? '—'
                  : formatINR(walletBalance ?? 0)}
              </span>
              {walletBalanceLow && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                  Low
                </span>
              )}
            </div>
          )}
          {trialInfo && (
            <div className="flex flex-col items-end rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-1.5 text-[10px] leading-tight text-gray-300 sm:text-xs">
              <span className="font-semibold text-gray-100">
                Free trial ends in {String(trialInfo.daysLeft).padStart(2, '0')} days
              </span>
              <span className="text-gray-400">Ends {trialInfo.endLabel}</span>
            </div>
          )}
          {!ownerMode && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={revenueUnlocked ? 'Lock revenue KPIs' : 'Unlock revenue KPIs'}
              onClick={revenueUnlocked ? onLock : onUnlock}
              className="border border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
            >
              {revenueUnlocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          )}
          <button
            onClick={onProfile}
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700"
          >
            <UserCircle2 className="h-5 w-5" />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};
