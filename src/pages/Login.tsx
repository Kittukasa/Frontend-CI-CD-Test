import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { persistCustomerTypeConfig } from '@/lib/customerTypes';
import {
  clearPostLoginRedirect,
  consumeSessionNotice,
  getPostLoginRedirect,
  setSessionNotice,
} from '@/lib/session';

interface LoginAuditEntry {
  timestamp: string;
  storeId: string;
  platform: string;
  userAgent: string;
  timeZone: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    store_id: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [missingStore, setMissingStore] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetForm, setResetForm] = useState({
    store_id: '',
    phone: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [maskedPhone, setMaskedPhone] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpStatus, setLoginOtpStatus] = useState('');
  const [loginOtpSending, setLoginOtpSending] = useState(false);
  const [loginOtpCooldown, setLoginOtpCooldown] = useState(0);
  const [twoStepVerificationEnabled, setTwoStepVerificationEnabled] = useState(true);
  const [loginConfigLoaded, setLoginConfigLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectFrom = (location.state as { from?: string } | undefined)?.from;
  const [sessionNotice] = useState(() => consumeSessionNotice() || '');
  const storeIdForReset = (formData.store_id || resetForm.store_id).trim();

  useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/auth/login/config');
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok) {
          setTwoStepVerificationEnabled(data?.two_step_verification !== false);
        }
      } catch {
        // keep default true
      } finally {
        if (!cancelled) {
          setLoginConfigLoaded(true);
        }
      }
    };
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);
  React.useEffect(() => {
    if (loginOtpCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setLoginOtpCooldown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loginOtpCooldown]);

  const recordLoginAudit = (storeId: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const auditEntry: LoginAuditEntry = {
        timestamp: new Date().toISOString(),
        storeId,
        platform: navigator.platform || 'Unknown device',
        userAgent: navigator.userAgent || 'Unknown agent',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time',
      };

      const existing = localStorage.getItem('bb_login_history');
      const history: LoginAuditEntry[] = existing ? JSON.parse(existing) : [];
      history.unshift(auditEntry);
      localStorage.setItem('bb_login_history', JSON.stringify(history.slice(0, 10)));
    } catch (err) {
      console.warn('Unable to record login audit', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
    if (e.target.name === 'password') {
      setPasswordError(false);
    }
    setMissingStore(false);

    if (e.target.name === 'store_id' || e.target.name === 'password') {
      setLoginOtp('');
      setLoginOtpSent(false);
      setLoginOtpStatus('');
      setLoginOtpCooldown(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: Record<string, string> = {
        store_id: formData.store_id.trim(),
        password: formData.password.trim(),
      };

      const endpoint = twoStepVerificationEnabled
        ? '/api/auth/login/password'
        : '/api/auth/login/password-only';

      if (twoStepVerificationEnabled) {
        const trimmedOtp = loginOtp.trim();
        if (!trimmedOtp) {
          setError('Enter the OTP sent to your store phone.');
          setLoading(false);
          return;
        }
        payload.otp = trimmedOtp;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      setPasswordError((data?.error || '').toLowerCase().includes('password'));

      if (response.ok) {
        // Save token, store_id, and WhatsApp config to localStorage
        localStorage.removeItem('bb_owner_mode');
        localStorage.setItem('bb_token', data.token);
        localStorage.setItem('bb_store_id', data.store_id);
        localStorage.setItem('bb_franchise_id', data.franchise_id);
        localStorage.setItem('bb_whatsapp_api_url', data.whatsapp_api_url);
        localStorage.setItem('bb_access_token', data.access_token);
        localStorage.setItem('bb_waba_id', data.waba_id ?? '');
        localStorage.setItem('bb_phone_number_id', data.phone_number_id ?? '');
        localStorage.setItem('bb_waba_mobile_number', data.waba_mobile_number ?? '');
        localStorage.setItem('bb_template_name', data.template_name ?? '');
        localStorage.setItem('bb_template_language', data.template_language ?? '');
        localStorage.setItem('bb_vendor_name', data.vendor_name ?? '');
        localStorage.setItem('bb_verified_name', data.verified_name ?? '');
        localStorage.setItem('bb_store_name', data.store_name ?? '');
        localStorage.setItem('bb_trial_started', data.trial_started ?? data.trail_started ?? '');
        localStorage.setItem('bb_trial_period', data.trial_period ?? '');
        localStorage.setItem(
          'bb_webhook_config',
          data.webhook_config ? JSON.stringify(data.webhook_config) : ''
        );
        persistCustomerTypeConfig(data.customer_type_config || undefined);
        recordLoginAudit(data.store_id);

        const storedRedirectPath = getPostLoginRedirect();
        const redirectHint = storedRedirectPath || redirectFrom;
        const analyticsPath = (() => {
          if (!redirectHint || !redirectHint.startsWith('/analytics')) {
            return `/analytics?storeId=${data.store_id}`;
          }

          try {
            const url = new URL(redirectHint, window.location.origin);
            url.searchParams.set('storeId', data.store_id);
            const paramsString = url.searchParams.toString();
            return paramsString ? `${url.pathname}?${paramsString}` : url.pathname;
          } catch {
            return `/analytics?storeId=${data.store_id}`;
          }
        })();

        clearPostLoginRedirect();
        setSessionNotice(null);
        navigate(analyticsPath, { replace: true });
        setMissingStore(false);
      } else {
        setError(data.error || 'Login failed');
        setPasswordError((data.error || '').toLowerCase().includes('password'));
        setMissingStore(response.status === 404);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setPasswordError(false);
      setMissingStore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordOpen = () => {
    setResetForm(prev => ({
      ...prev,
      store_id: formData.store_id || prev.store_id,
    }));
    setResetError('');
    setResetSuccess('');
    setShowForgotModal(true);
  };

  const handleForgotPasswordClose = () => {
    setShowForgotModal(false);
    setSendingOtp(false);
    setResettingPassword(false);
    setOtpSent(false);
    setResetError('');
    setResetSuccess('');
    setResetForm({
      store_id: '',
      phone: '',
      otp: '',
      password: '',
      confirmPassword: '',
    });
    setMaskedPhone('');
  };

  const handleSendLoginOtp = async () => {
    if (!twoStepVerificationEnabled) {
      setError('Two-step verification is disabled. Login with password only.');
      return;
    }

    const storeId = formData.store_id.trim();
    if (!storeId) {
      setError('Enter your Store ID before requesting an OTP.');
      return;
    }
    const password = formData.password.trim();
    if (!password) {
      setError('Enter your password before requesting an OTP.');
      return;
    }
    setLoginOtpSending(true);
    setLoginOtpStatus('');
    setError('');
    try {
      const response = await fetch('/api/auth/login/password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, password: formData.password.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to send login OTP.');
      }
      setLoginOtp('');
      setLoginOtpSent(true);
      setLoginOtpCooldown(90);
      setLoginOtpStatus(`OTP sent to ${data?.masked_phone || 'your registered phone number'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send login OTP.');
    } finally {
      setLoginOtpSending(false);
    }
  };

  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetForm(prev => ({
      ...prev,
      [name]: value,
    }));

    setResetError('');
    setResetSuccess('');
  };

  const handleSendOtp = async () => {
    const trimmedStoreId = (formData.store_id || resetForm.store_id).trim();

    const trimmedPhone = resetForm.phone.trim();

    if (!trimmedStoreId) {
      setResetError('Enter your Store ID on the login form before requesting a reset.');
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setResetError('Enter the 10-digit phone number registered with your store.');
      return;
    }

    setSendingOtp(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: trimmedStoreId, phone: trimmedPhone }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send OTP');
      }

      setOtpSent(true);
      setResetForm(prev => ({ ...prev, store_id: trimmedStoreId }));
      setMaskedPhone(data.masked_phone ?? '');
      setResetSuccess('OTP sent successfully. Please check your phone.');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Unable to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedStoreId = (formData.store_id || resetForm.store_id).trim();
    const trimmedPhone = resetForm.phone.trim();
    const trimmedOtp = resetForm.otp.trim();
    const trimmedPassword = resetForm.password.trim();
    const trimmedConfirm = resetForm.confirmPassword.trim();

    if (!otpSent) {
      setResetError('Please request an OTP first.');
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setResetError('Enter the 6-digit OTP sent to your phone.');
      return;
    }

    if (!trimmedStoreId) {
      setResetError('Enter your Store ID on the login form before requesting a reset.');
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setResetError('Enter the 10-digit phone number registered with your store.');
      return;
    }

    if (!trimmedPassword || !trimmedConfirm) {
      setResetError('Enter and confirm the new password.');
      return;
    }

    const passwordRequirementsMet =
      trimmedPassword.length >= 8 &&
      /[A-Za-z]/.test(trimmedPassword) &&
      /\d/.test(trimmedPassword) &&
      /[^A-Za-z0-9]/.test(trimmedPassword);

    if (!passwordRequirementsMet) {
      setResetError(
        'Password must be 8+ characters with a letter, a number, and a special character.'
      );
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setResetError('Password and confirm password do not match.');
      return;
    }

    setResettingPassword(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: trimmedStoreId,
          phone: trimmedPhone,
          password: trimmedPassword,
          otp: trimmedOtp,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset password');
      }

      setResetSuccess('Password reset successfully. You can now login with the new password.');
      setOtpSent(false);
      alert('Password reset successfully. Please log in with your new password.');
      handleForgotPasswordClose();
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : 'Unable to reset password. Please try again.'
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const resetPasswordMeetsCriteria =
    resetForm.password.length >= 8 &&
    /[A-Za-z]/.test(resetForm.password) &&
    /\d/.test(resetForm.password) &&
    /[^A-Za-z0-9]/.test(resetForm.password);

  const passwordsMatch =
    resetForm.password.length > 0 &&
    resetForm.confirmPassword.length > 0 &&
    resetForm.password === resetForm.confirmPassword;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex w-full items-center justify-end px-6 pt-6 text-lg font-semibold text-blue-600 gap-3">
        <button
          type="button"
          className="inline-flex items-center hover:underline"
          onClick={() => navigate('/')}
        >
          Home
        </button>
        <span className="text-gray-300">•</span>
        <button
          type="button"
          className="inline-flex items-center hover:underline"
          onClick={() => navigate('/franchise')}
        >
          Owner login
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Billbox Login</h2>
            <p className="mt-2 text-sm text-gray-600">Sign in to your store account</p>
          </div>

          {sessionNotice && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {sessionNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="store_id" className="block text-sm font-medium text-gray-700">
                Store ID
              </label>
              <input
                id="store_id"
                name="store_id"
                type="text"
                required
                value={formData.store_id}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter store ID"
              />
              {formData.store_id.trim() && (
                <p className="mt-1 text-xs text-gray-500">
                  {twoStepVerificationEnabled
                    ? 'We’ll send a 6-digit OTP to the registered store mobile number.'
                    : 'Login requires your store password.'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {twoStepVerificationEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700">One-Time Password</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="text"
                    value={loginOtp}
                    onChange={event => {
                      setLoginOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendLoginOtp}
                    disabled={
                      loginOtpSending ||
                      !twoStepVerificationEnabled ||
                      !formData.store_id.trim() ||
                      !formData.password.trim() ||
                      loginOtpCooldown > 0
                    }
                  >
                    {loginOtpSending
                      ? 'Sending…'
                      : loginOtpCooldown > 0
                      ? `Resend in ${loginOtpCooldown}s`
                      : loginOtpSent
                      ? 'Resend OTP'
                      : 'Send OTP'}
                  </Button>
                </div>
                {loginOtpStatus ? (
                  <p className="mt-1 text-xs text-green-600">{loginOtpStatus}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    We will send the OTP to the registered store mobile number.
                  </p>
                )}
              </div>
            )}

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {passwordError && (
              <div className="mt-1 text-xs text-blue-600 text-center flex flex-col gap-1">
                <button type="button" className="underline" onClick={handleForgotPasswordOpen}>
                  Forgot password?
                </button>
                <button type="button" className="underline" onClick={handleForgotPasswordOpen}>
                  Reset with OTP
                </button>
              </div>
            )}
            {missingStore && (
              <div className="text-center text-sm text-gray-600">
                Need an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => navigate('/signup')}
                >
                  Create one now
                </button>
              </div>
            )}
            <div className="text-center text-sm text-gray-600">
              Forgot password?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
                onClick={handleForgotPasswordOpen}
              >
                Reset it with OTP
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Reset Password</h3>
                <p className="text-sm text-gray-500">Verify with OTP and set a new password.</p>
              </div>
              <button
                onClick={handleForgotPasswordClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
                {storeIdForReset ? (
                  <>
                    Resetting password for Store ID{' '}
                    <span className="font-semibold">{storeIdForReset}</span>. Update the ID in the
                    login form if this is not your store.
                  </>
                ) : (
                  <>
                    Enter your Store ID in the login form first, then reopen this dialog to reset
                    your password.
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Registered Phone Number
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="tel"
                    name="phone"
                    value={resetForm.phone}
                    onChange={handleResetInputChange}
                    placeholder="Enter 10-digit registered number"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!storeIdForReset}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !storeIdForReset}
                    className="whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  We’ll verify the number you enter against the one on file before sending the OTP.
                </p>
                {otpSent && maskedPhone && (
                  <p className="mt-1 text-xs text-green-600">
                    OTP sent to number ending with{' '}
                    <span className="font-semibold">{maskedPhone.slice(-3)}</span>.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  name="otp"
                  inputMode="numeric"
                  value={resetForm.otp}
                  onChange={handleResetInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter OTP"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      name="password"
                      value={resetForm.password}
                      onChange={handleResetInputChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Use at least 8 characters, including a letter, a number, and a special
                    character.
                  </p>
                  {resetForm.password && (
                    <p
                      className={`text-xs font-semibold ${
                        resetPasswordMeetsCriteria ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {resetPasswordMeetsCriteria
                        ? 'Password looks strong.'
                        : 'Add letters, numbers, and symbols to continue.'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={resetForm.confirmPassword}
                      onChange={handleResetInputChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      aria-label={showResetConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {resetForm.confirmPassword && !passwordsMatch && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      Passwords do not match.
                    </p>
                  )}
                </div>
              </div>

              {resetError && <div className="text-sm text-red-600">{resetError}</div>}
              {resetSuccess && <div className="text-sm text-green-600">{resetSuccess}</div>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={handleForgotPasswordClose}
                  disabled={resettingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resettingPassword ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
