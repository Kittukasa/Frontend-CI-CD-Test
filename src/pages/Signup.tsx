import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const BUSINESS_TYPES = [
  'Pharmacy',
  'Restaurant',
  'Coffee Shops',
  'Fashion',
  'Retail',
  'Super Market',
  'Electronics',
  'Services',
];

const VALID_EMAIL_EXTENSION = /^[a-z]{2,}$/i;

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    storeName: '',
    streetName: '',
    businessType: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    let nextValue = value;
    if (field === 'phone') {
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setForm(prev => ({ ...prev, [field]: nextValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'storeName' && /[^a-zA-Z0-9\s]/.test(nextValue)) {
      setErrors(prev => ({ ...prev, storeName: 'Special characters not allowed.' }));
    }
  };

  const passwordValidation = useMemo(() => {
    const value = form.password || '';
    const hasLength = value.length >= 8;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const isValid = hasLength && hasLetter && hasNumber && hasSpecial;
    return { isValid, hasLength, hasLetter, hasNumber, hasSpecial };
  }, [form.password]);

  const validateDetails = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }
    const normalizedEmail = form.email.trim();
    const normalizedStoreName = form.storeName.trim();
    const normalizedStreetName = form.streetName.trim();
    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    } else {
      const extension = normalizedEmail.split('.').pop();
      if (!extension || !VALID_EMAIL_EXTENSION.test(extension)) {
        nextErrors.email = 'Enter a valid email domain extension.';
      }
    }
    if (!normalizedStoreName) {
      nextErrors.storeName = 'Store name is required.';
    } else if (/[^a-zA-Z0-9\s]/.test(normalizedStoreName)) {
      nextErrors.storeName = 'Special characters not allowed.';
    }
    if (!normalizedStreetName) {
      nextErrors.streetName = 'Street name is required.';
    }
    if (!form.businessType) {
      nextErrors.businessType = 'Select your business type.';
    }
    if (!form.phone.trim()) {
      nextErrors.phone = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Enter a 10-digit mobile number.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (!passwordValidation.isValid) {
      nextErrors.password =
        'Password must be 8+ characters with at least one letter, one number, and one special character.';
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDetailsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateDetails()) {
      return;
    }
    setSubmissionError('');
    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        storeName: form.storeName.trim(),
        streetName: form.streetName.trim(),
        businessType: form.businessType,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error || 'Unable to create your account.';
        setSubmissionError(message);
        return;
      }
      navigate('/demo', { replace: true });
    } catch (error) {
      console.error('Signup failed', error);
      setSubmissionError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <GlobalNavbar className="relative bg-slate-950 border-b border-white/10" />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl rounded-3xl bg-white/5 p-8 shadow-2xl backdrop-blur-xl border border-white/10 text-white">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-widest text-indigo-300 mb-2">Partner signup</p>
            <h1 className="text-3xl font-semibold">Create your Billbox account</h1>
            <p className="text-gray-300 mt-2">
              Enter your details to get started. We&apos;ll guide you through WhatsApp configuration
              afterward.
            </p>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            {submissionError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {submissionError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={event => handleChange('fullName', event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={event => handleChange('email', event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Store Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={event => handleChange('storeName', event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 placeholder-white/40"
                placeholder="e.g., Indiranagar Outlet"
              />
              {errors.storeName && <p className="mt-1 text-sm text-red-400">{errors.storeName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Street Name</label>
              <input
                type="text"
                value={form.streetName}
                onChange={event => handleChange('streetName', event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 placeholder-white/40"
                placeholder="e.g., Main Street, Brigade Road"
              />
              {errors.streetName && (
                <p className="mt-1 text-sm text-red-400">{errors.streetName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Type</label>
              <select
                value={form.businessType}
                onChange={event => handleChange('businessType', event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white text-gray-900 px-4 py-3 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 dark:bg-white/5 dark:text-white"
              >
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.businessType && (
                <p className="mt-1 text-sm text-red-400">{errors.businessType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mobile Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={event => handleChange('phone', event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                placeholder="10-digit number"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={event => handleChange('password', event.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pr-10 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Use at least 8 characters, including a letter, a number, and a special character.
                </p>
                {form.password && (
                  <p
                    className={`text-xs font-semibold ${
                      passwordValidation.isValid ? 'text-emerald-300' : 'text-red-400'
                    }`}
                  >
                    {passwordValidation.isValid ? 'Valid password' : 'Invalid password'}
                  </p>
                )}
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={event => handleChange('confirmPassword', event.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pr-10 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-white"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </Button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-300 underline decoration-dotted">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
