import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FranchiseSidebarTab {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface FranchiseSidebarProps {
  tabs: FranchiseSidebarTab[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout?: () => void;
}

const FranchiseSidebar: React.FC<FranchiseSidebarProps> = ({ tabs, activeTab, onSelectTab, onLogout }) => {
  return (
    <aside className="w-64 bg-[#03040c] border-r border-white/10 flex flex-col justify-between sticky top-0 h-screen">
      <div>
        <div className="px-5 py-6 border-b border-white/10">
          <img
            src="/images/logo-v1-official.png"
            alt="Billbox"
            className="h-10 w-auto"
          />
          <h1 className="mt-4 text-2xl font-semibold text-white">Franchise</h1>
          <p className="text-sm text-white/60">Multi-store operations</p>
        </div>
        <nav className="px-3 py-6 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (!tab.disabled) {
                  onSelectTab(tab.id);
                }
              }}
              disabled={tab.disabled}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-white border border-indigo-400'
                  : tab.disabled
                    ? 'text-white/30 cursor-not-allowed bg-white/5'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="px-4 py-6 border-t border-white/10">
        <Button
          variant="outline"
          className="w-full border-white/20 text-white/80 hover:text-white"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
};

export default FranchiseSidebar;
