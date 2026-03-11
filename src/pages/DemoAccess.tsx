import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, ShieldCheck } from 'lucide-react';

const DemoAccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f1f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.45),rgba(15,23,42,0))]" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.35),rgba(15,23,42,0))]" />
        <div className="absolute bottom-[-120px] left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.25),rgba(15,23,42,0))]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                <ShieldCheck className="h-4 w-4 text-indigo-200" />
                Access Pending
              </div>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl" style={{ fontFamily: 'Space Grotesk, IBM Plex Sans, sans-serif' }}>
                Thank You for Signing Up
              </h1>
              <p className="mt-4 text-base text-slate-200 sm:text-lg">
                We received your interest. Our Sales team will reach out to you for further steps.
                For urgent assistance please WhatsApp on +91 8008407999.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto">
              <Button
                className="w-full bg-emerald-400 text-slate-900 hover:bg-emerald-300"
                onClick={() => window.open('https://wa.me/918008407999', '_blank', 'noopener,noreferrer')}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/', { replace: true })}
              >
                Billbox Website
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Onboarding',
                copy: 'We will walk you through onboarding and store configuration.'
              },
              {
                title: 'Software Installation',
                copy: 'We will help you set up the Billbox software for fast, reliable billing.'
              },
              {
                title: 'Demo experience',
                copy: 'Explore a preview while we enable full dashboard access.'
              }
            ].map(item => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-5"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoAccess;
