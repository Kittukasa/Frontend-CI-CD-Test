import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecipientProgress {
  phone: string;
  name: string;
  status: string;
  messageId?: string | null;
  error?: string | null;
  updatedAt?: string;
}

interface CampaignProgressPayload {
  campaignId: string;
  campaignName: string;
  templateName?: string | null;
  totalRecipients: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  status: string;
  startedAt?: string;
  completedAt?: string | null;
  recipients: RecipientProgress[];
}

const CampaignProgressPage: React.FC = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<CampaignProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('bb_token');
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }
        const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load campaign progress.');
        }
        if (isMounted) {
          setProgress(data.progress as CampaignProgressPayload);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load campaign progress.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProgress();
    intervalId = setInterval(fetchProgress, 5000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [campaignId]);

  const progressPercent = useMemo(() => {
    if (!progress || !progress.totalRecipients) {
      return 0;
    }
    const completed = progress.completedCount + progress.failedCount;
    return Math.min(100, Math.round((completed / progress.totalRecipients) * 100));
  }, [progress]);

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'completed' || normalized === 'completed-with-errors') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {normalized === 'completed-with-errors' ? 'Completed with warnings' : 'Completed'}
        </span>
      );
    }
    if (normalized === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
          <AlertTriangle className="h-3.5 w-3.5" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running
      </span>
    );
  };

  const renderRecipients = () => {
    if (!progress || progress.recipients.length === 0) {
      return <p className="text-sm text-gray-500">Recipients have not been queued yet.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Recipient</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Updated</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {progress.recipients.map(recipient => (
              <tr key={recipient.phone}>
                <td className="px-4 py-2">
                  <p className="font-medium text-gray-900">{recipient.name || recipient.phone}</p>
                  <p className="text-xs text-gray-500">{recipient.phone}</p>
                </td>
                <td className="px-4 py-2 capitalize text-gray-700">{recipient.status || '—'}</td>
                <td className="px-4 py-2 text-gray-500">
                  {recipient.updatedAt ? new Date(recipient.updatedAt).toLocaleTimeString() : '—'}
                </td>
                <td className="px-4 py-2 text-sm text-rose-600">{recipient.error || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Progress</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-20 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading progress…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : !progress ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-600">
            Campaign progress not found.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Campaign</p>
                  <h2 className="text-2xl font-semibold text-gray-900">{progress.campaignName}</h2>
                  {progress.templateName && (
                    <p className="text-sm text-gray-500">Template: {progress.templateName}</p>
                  )}
                </div>
                {getStatusBadge(progress.status)}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Overall progress</span>
                  <span>
                    {progress.completedCount + progress.failedCount}/{progress.totalRecipients} (
                    {progressPercent}
                    %)
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Completed</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {progress.completedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Failed</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {progress.failedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {progress.pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
              <p className="text-sm text-gray-500">Auto-refreshing every 5 seconds.</p>
              <div className="mt-4">{renderRecipients()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignProgressPage;
