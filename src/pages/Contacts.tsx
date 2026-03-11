import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContactRecord {
  contact_id: string;
  phone: string | null;
  display_name: string | null;
  normalized_phone: string | null;
  tag: string | null;
  created_at: string | null;
  updated_at: string | null;
  source?: string | null;
}

type ImportedContact = { phone: string; name: string };

const buildAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;
  if (!token) {
    throw new Error('Authentication token missing.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const maskPhoneLast3 = (value?: string | null) => {
  if (!value) return '—';
  const digits = value.toString().replace(/\D/g, '');
  if (!digits) return '—';
  const last3 = digits.slice(-3);
  const maskedPrefix = digits.length > 3 ? '*'.repeat(digits.length - 3) : '';
  return `${maskedPrefix}${last3}`;
};

const isInvalidContactName = (value?: string | null) => {
  const name = (value || '').trim().toLowerCase();
  return !name || name === 'nill' || name === 'nil';
};

const digitsOnly = (value: string) => value.replace(/[^\d]/g, '');

const normalizePhoneDigits = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const digits = digitsOnly(value);
  if (!digits) {
    return '';
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

const normalizeHeaderKey = (value: string) =>
  value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const splitCsvLine = (line: string, delimiter: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map(cell => cell.trim());
};

const detectDelimiter = (headerLine: string) => {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  if (tabCount > commaCount) {
    return '\t';
  }
  return ',';
};

const parseContactsCsv = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      headers: [] as string[],
      headerKeys: [] as string[],
      mobileIndex: -1,
      nameIndex: -1,
      contacts: [] as ImportedContact[],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = splitCsvLine(lines[0], delimiter);
  const headerKeys = rawHeaders.map(normalizeHeaderKey);

  const mobileHeaderKeys = new Set(['mobilenumber', 'mobile', 'phonenumber', 'phone']);
  const nameHeaderKeys = new Set(['customername', 'name']);

  const mobileIndex = headerKeys.findIndex(key => mobileHeaderKeys.has(key));
  const nameIndex = headerKeys.findIndex(key => nameHeaderKeys.has(key));

  const contacts: ImportedContact[] = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = splitCsvLine(lines[lineIndex], delimiter);
    const rawPhone = cells[mobileIndex] ?? '';
    const rawName = cells[nameIndex] ?? '';
    const phone = rawPhone.toString().trim();
    const name = rawName.toString().trim();

    if (!phone && !name) {
      continue;
    }

    contacts.push({ phone, name });
  }

  return { headers: rawHeaders, headerKeys, mobileIndex, nameIndex, contacts };
};

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string>('');
  const [importPreview, setImportPreview] = useState<ImportedContact[]>([]);
  const [importValidCount, setImportValidCount] = useState<number>(0);
  const [importInvalidCount, setImportInvalidCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editContact, setEditContact] = useState<ContactRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPhone, setDeletingPhone] = useState('');
  const [whatsappChatPhones, setWhatsappChatPhones] = useState<Set<string>>(new Set());

  const syncWhatsappChatPhones = async (headers: Record<string, string>) => {
    try {
      const response = await fetch('/api/whatsapp/analytics?format=json', {
        headers,
      });
      if (!response.ok) {
        throw new Error('Unable to load WhatsApp chat presence.');
      }
      const payload = await response.json().catch(() => ({}));
      const dataset = Array.isArray(payload) ? payload : payload?.data || [];
      const phoneSet = new Set<string>();
      const addPhone = (value?: string | null) => {
        const normalized = normalizePhoneDigits(value);
        if (normalized) {
          phoneSet.add(normalized);
        }
      };
      dataset.forEach((entry: any) => {
        addPhone(entry.primary_phone);
        addPhone(entry.normalized_phone);
        addPhone(entry.phone);
        addPhone(entry.user);
        if (Array.isArray(entry.phones)) {
          entry.phones.forEach((phone: string) => addPhone(phone));
        }
      });
      setWhatsappChatPhones(phoneSet);
    } catch (chatError) {
      console.error('Failed to load WhatsApp chat presence', chatError);
      setWhatsappChatPhones(new Set());
    }
  };

  const dedupeContacts = (records: ContactRecord[]) => {
    const map = new Map<string, ContactRecord>();
    records.forEach(record => {
      const key =
        normalizePhoneDigits(record.normalized_phone || record.phone) || record.contact_id;
      if (!key) {
        map.set(record.contact_id, record);
        return;
      }
      const existing = map.get(key);
      if (!existing) {
        map.set(key, record);
        return;
      }
      const existingUpdated = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
      const candidateUpdated = record.updated_at ? new Date(record.updated_at).getTime() : 0;
      if (candidateUpdated >= existingUpdated) {
        map.set(key, record);
      }
    });
    return Array.from(map.values());
  };

  const loadContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = buildAuthHeaders();
      const response = await fetch(`/api/whatsapp/contacts?ts=${Date.now()}`, {
        headers,
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to load contacts.');
      }
      const records = Array.isArray(result?.contacts) ? result.contacts : [];
      setContacts(dedupeContacts(records));
      await syncWhatsappChatPhones(headers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load contacts.';
      setError(message);
      toast({
        title: 'Failed to load contacts',
        description: message,
        variant: 'destructive',
      });
      setWhatsappChatPhones(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenImport = params.get('import') === '1';
    if (shouldOpenImport) {
      setImportOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!importOpen) {
      setImportError('');
      setImportFileName('');
      setImportPreview([]);
      setImportValidCount(0);
      setImportInvalidCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [importOpen]);

  const sortedContacts = useMemo(() => {
    return [...contacts]
      .filter(contact => !isInvalidContactName(contact.display_name))
      .sort((a, b) => {
        const aTime = a.updated_at || a.created_at || '';
        const bTime = b.updated_at || b.created_at || '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [contacts]);

  const requiredHeaderLabel = 'Mobile Number';
  const optionalHeaderLabel = 'Customer Name';
  const allowedHeadersLabel = `${requiredHeaderLabel}, ${optionalHeaderLabel}`;
  const allowedHeadersDescription = `${requiredHeaderLabel} (required), ${optionalHeaderLabel} (optional)`;

  const handleOpenWhatsappChat = (contact: ContactRecord) => {
    const normalized = normalizePhoneDigits(contact.normalized_phone || contact.phone);
    if (!normalized) {
      toast({
        title: 'Phone number unavailable',
        description: 'This contact does not have a valid phone number to open a WhatsApp chat.',
        variant: 'destructive',
      });
      return;
    }
    const params = new URLSearchParams({
      tab: 'whatsapp',
      chat: normalized,
    });
    navigate(`/analytics?${params.toString()}`);
  };

  const validateAndPreviewImport = (rawContacts: ImportedContact[]) => {
    const seen = new Set<string>();
    const validContacts: ImportedContact[] = [];
    let valid = 0;
    let invalid = 0;

    rawContacts.forEach(entry => {
      const digits = digitsOnly(entry.phone);
      const normalized10 = digits.length >= 10 ? digits.slice(-10) : '';
      const rawName = (entry.name || '').trim();
      const resolvedName = isInvalidContactName(rawName) ? 'Unknown' : rawName;

      if (!normalized10) {
        invalid += 1;
        return;
      }
      if (seen.has(normalized10)) {
        return;
      }
      seen.add(normalized10);
      valid += 1;
      validContacts.push({ phone: entry.phone.trim(), name: resolvedName });
    });

    setImportPreview(validContacts.slice(0, 10));
    setImportValidCount(valid);
    setImportInvalidCount(invalid);

    return { validContacts, valid, invalid };
  };

  const handleImportFile = async (file: File | null) => {
    setImportError('');
    setImportPreview([]);
    setImportValidCount(0);
    setImportInvalidCount(0);

    if (!file) {
      setImportFileName('');
      return;
    }

    setImportFileName(file.name);

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      setImportError('Only CSV files are supported right now.');
      return;
    }

    const text = await file.text();
    const parsed = parseContactsCsv(text);

    if (!parsed.headers?.length) {
      setImportError('The CSV file looks empty.');
      return;
    }

    if (parsed.mobileIndex < 0) {
      setImportError(`Missing required column: ${requiredHeaderLabel}.`);
      return;
    }

    const nonEmptyHeaderKeys = parsed.headerKeys.filter(Boolean);
    if (nonEmptyHeaderKeys.length < 1 || nonEmptyHeaderKeys.length > 2) {
      setImportError(
        `Only one or two columns are allowed for now: ${requiredHeaderLabel}${
          optionalHeaderLabel ? `, ${optionalHeaderLabel}` : ''
        }. Remove extra columns and try again.`
      );
      return;
    }

    const allowedKeys = new Set([
      'mobilenumber',
      'mobile',
      'phonenumber',
      'phone',
      'customername',
      'name',
    ]);
    const unexpectedHeaders = parsed.headerKeys.filter(key => key && !allowedKeys.has(key));
    if (unexpectedHeaders.length > 0) {
      setImportError(
        `Only these columns are allowed for now: ${allowedHeadersLabel}. Remove extra columns and try again.`
      );
      return;
    }

    validateAndPreviewImport(parsed.contacts);
  };

  const openEditContact = (contact: ContactRecord) => {
    setEditContact(contact);
    setEditName(contact.display_name || '');
    setEditTag(contact.tag || '');
  };

  const handleEditContactSave = async () => {
    if (!editContact) return;
    setSavingEdit(true);
    try {
      const response = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: {
          ...buildAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: editContact.phone || editContact.normalized_phone,
          name: editName,
          tag: editTag,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to save contact.');
      }
      toast({ title: 'Contact updated', description: 'Changes saved.' });
      setEditContact(null);
      loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save contact.';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteContact = async (contact: ContactRecord) => {
    const phone = contact.normalized_phone || contact.phone || '';
    if (!phone) {
      toast({
        title: 'Delete failed',
        description: 'Missing phone number.',
        variant: 'destructive',
      });
      return;
    }
    if (!window.confirm('Delete this contact?')) {
      return;
    }
    setDeletingPhone(phone);
    try {
      const response = await fetch(`/api/whatsapp/contacts/${encodeURIComponent(phone)}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to delete contact.');
      }
      toast({ title: 'Contact deleted', description: contact.display_name || contact.phone || '' });
      setContacts(prev =>
        prev.filter(item => (item.normalized_phone || item.phone || '') !== phone)
      );
      await loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete contact.';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    } finally {
      setDeletingPhone('');
    }
  };

  const downloadSampleCsv = () => {
    const sample = `Mobile Number,Customer Name
9876543210,John Doe
9988776655,
`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'contacts-sample.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const submitImport = async () => {
    setImportError('');
    setImporting(true);
    try {
      const file = fileInputRef.current?.files?.[0] ?? null;
      if (!file) {
        setImportError('Please choose a CSV file.');
        return;
      }

      const parsed = parseContactsCsv(await file.text());
      if (parsed.mobileIndex < 0) {
        setImportError(`Missing required column: ${requiredHeaderLabel}.`);
        return;
      }

      const nonEmptyHeaderKeys = parsed.headerKeys.filter(Boolean);
      if (nonEmptyHeaderKeys.length < 1 || nonEmptyHeaderKeys.length > 2) {
        setImportError(
          `Only one or two columns are allowed for now: ${requiredHeaderLabel}${
            optionalHeaderLabel ? `, ${optionalHeaderLabel}` : ''
          }. Remove extra columns and try again.`
        );
        return;
      }

      const allowedKeys = new Set([
        'mobilenumber',
        'mobile',
        'phonenumber',
        'phone',
        'customername',
        'name',
      ]);
      const unexpectedHeaders = parsed.headerKeys.filter(key => key && !allowedKeys.has(key));
      if (unexpectedHeaders.length > 0) {
        setImportError(
          `Only these columns are allowed for now: ${allowedHeadersLabel}. Remove extra columns and try again.`
        );
        return;
      }

      const { validContacts, valid } = validateAndPreviewImport(parsed.contacts);
      if (valid === 0) {
        setImportError('No valid contacts found. Ensure phone numbers are present.');
        return;
      }

      const payloadContacts = validContacts.map(contact => ({
        mobile_number: contact.phone,
        customer_name: contact.name || 'Unknown',
      }));

      const response = await fetch('/api/whatsapp/contacts/import', {
        method: 'POST',
        headers: {
          ...buildAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contacts: payloadContacts }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Import failed.');
      }

      toast({
        title: 'Contacts imported',
        description: `Imported: ${result?.imported ?? 0}, Skipped: ${result?.skipped ?? 0}`,
      });
      setImportOpen(false);
      loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed.';
      setImportError(message);
      toast({ title: 'Import failed', description: message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-gray-900">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <p className="text-sm text-gray-600">
              Customers from your customer records (named customers only). Use this list for
              campaigns or outreach.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end md:w-auto">
            <Button
              onClick={() => navigate('/analytics?tab=whatsapp')}
              className="w-full sm:w-auto bg-black text-white hover:bg-black/90"
            >
              Back to WhatsApp
            </Button>
            <Button
              onClick={() => navigate('/analytics?tab=campaigns')}
              className="w-full sm:w-auto bg-black text-white hover:bg-black/90"
            >
              Back to Campaign
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">
                {loading ? 'Loading contacts…' : `Contacts (${sortedContacts.length})`}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={loadContacts} disabled={loading}>
              Refresh
            </Button>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">Fetching contacts…</div>
          ) : sortedContacts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No contacts saved yet. Use “Save contact” from chats or the import button.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Tag</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Last Updated</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                  {sortedContacts.map(contact => (
                    <tr key={contact.contact_id}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{contact.display_name || '—'}</span>
                          {contact.source === 'import' && (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                              Imported
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {maskPhoneLast3(contact.phone || contact.normalized_phone)}
                      </td>
                      <td className="px-6 py-4">
                        {contact.tag ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {contact.tag}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDateTime(contact.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDateTime(contact.updated_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900"
                            onClick={() => openEditContact(contact)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Edit contact</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-red-600"
                            onClick={() => handleDeleteContact(contact)}
                            disabled={
                              deletingPhone === (contact.normalized_phone || contact.phone || '')
                            }
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Delete contact</span>
                          </Button>
                          {(() => {
                            const normalizedPhone = normalizePhoneDigits(
                              contact.normalized_phone || contact.phone
                            );
                            const hasChat = normalizedPhone
                              ? whatsappChatPhones.has(normalizedPhone)
                              : false;
                            return (
                              hasChat && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                  onClick={() => handleOpenWhatsappChat(contact)}
                                >
                                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                  <span className="sr-only">Open WhatsApp chat</span>
                                </Button>
                              )
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(editContact)}
        onOpenChange={open => {
          if (!open) setEditContact(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
            <DialogDescription>Update name or tag for this contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Phone
              </label>
              <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                {editContact?.phone || editContact?.normalized_phone || '—'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Customer name"
                disabled={savingEdit}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Tag
              </label>
              <input
                type="text"
                value={editTag}
                onChange={e => setEditTag(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. VIP, Partner"
                disabled={savingEdit}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditContact(null)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditContactSave}
              disabled={savingEdit || !editName.trim()}
            >
              {savingEdit ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import contacts</DialogTitle>
            <DialogDescription>
              Upload a CSV file. Supported columns:{' '}
              <span className="font-medium">{allowedHeadersDescription}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">Caution</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>CSV must include the header: {requiredHeaderLabel}.</li>
                <li>{optionalHeaderLabel} is optional. Missing names are saved as "Unknown".</li>
                <li>Remove any extra columns before importing.</li>
                <li>Invalid rows (missing phone) will be skipped.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={e => handleImportFile(e.target.files?.[0] ?? null)}
                className="hidden"
                disabled={importing}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm"
                >
                  Choose file
                </Button>
                <span className="text-sm text-white">{importFileName || 'No file chosen'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadSampleCsv}
                  disabled={importing}
                >
                  Download sample
                </Button>
                <span className="text-xs text-gray-500">CSV only • Max 5 MB</span>
              </div>
            </div>

            {importError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {importError}
              </div>
            )}

            {importValidCount > 0 && (
              <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                <p className="font-medium">Ready to import</p>
                <p className="text-gray-600">
                  Valid contacts: {importValidCount.toLocaleString()} • Invalid rows skipped:{' '}
                  {importInvalidCount.toLocaleString()}
                </p>
                {importPreview.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-md border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-2">Customer Name</th>
                          <th className="px-4 py-2">Mobile Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {importPreview.map((row, index) => (
                          <tr key={`${row.phone}-${index}`}>
                            <td className="px-4 py-2">{row.name}</td>
                            <td className="px-4 py-2 text-gray-700">{row.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="px-4 py-2 text-xs text-gray-500">
                      Preview shows first {Math.min(10, importPreview.length)} contacts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitImport}
              disabled={importing || importValidCount === 0}
            >
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsPage;
