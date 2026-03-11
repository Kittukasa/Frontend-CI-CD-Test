import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BillboxLogo } from '@/components/common/BillboxLogo';
import { clearAdminSession, getStoredAdminIdentity } from '@/utils/adminAuth';

const NAV_SECTIONS = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Overview', to: '/admin-panel' },
      { label: 'Stores', to: '/admin-panel/stores' },
      { label: 'Leads', to: '/admin-panel/leads' },
      { label: 'Wallets', to: '/admin-panel/wallets' },
    ],
  },
];

const AdminPanelLayout = () => {
  const navigate = useNavigate();
  const [adminDisplayName, setAdminDisplayName] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const identity = getStoredAdminIdentity();
    if (identity) {
      setAdminDisplayName(identity.displayName || identity.adminName);
    }
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    setAdminDisplayName(null);
    navigate('/admin/login', { replace: true });
  };

  const renderNavLinks = () => (
    <ul className="space-y-1">
      {NAV_SECTIONS[0].items.map(item => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.to === '/admin-panel'}
            onClick={() => setIsMobileNavOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-gradient-to-r from-cyan-400/20 to-indigo-500/20 text-white shadow-[0_10px_35px_rgba(14,165,233,0.35)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen w-full bg-[#050816] text-white">
      <div className="flex min-h-screen w-full">
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <Link to="/admin-panel" className="inline-flex items-center">
            <BillboxLogo className="w-28" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(prev => !prev)}
            className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:bg-white/10"
          >
            {isMobileNavOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden w-64 flex-shrink-0 rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur lg:flex lg:flex-col sticky top-0 h-screen overflow-hidden">
          <div className="flex h-full flex-col">
            <Link to="/admin-panel" className="mb-8 inline-flex items-center">
              <BillboxLogo className="w-32" />
            </Link>
            <div className="flex-1 overflow-y-auto pr-1">
              {NAV_SECTIONS.map(section => (
                <nav key={section.label} className="mb-10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                    {section.label}
                  </p>
                  {renderNavLinks()}
                </nav>
              ))}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Note</p>
                <p className="mt-2">
                  Admin tools are under active development. Overview, Stores, Leads, and Wallets are
                  available now.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                Signed in as
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{adminDisplayName || 'Admin'}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="h-full w-72 rounded-r-3xl border-r border-white/10 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur">
              <div className="flex items-center justify-between">
                <BillboxLogo className="w-28" />
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
              <div className="mt-6 flex-1 overflow-y-auto pr-1">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                  Dashboard
                </p>
                {renderNavLinks()}
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  Signed in as
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {adminDisplayName || 'Admin'}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex-1 bg-black/50"
              aria-label="Close sidebar overlay"
            />
          </div>
        )}

        <main className="flex-1 w-full min-h-screen overflow-y-auto px-4 py-8 pt-20 sm:px-8 lg:px-12 lg:pt-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanelLayout;
