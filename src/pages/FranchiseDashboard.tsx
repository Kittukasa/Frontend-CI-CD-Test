import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillboxLogo } from '@/components/common/BillboxLogo';

type ResetFormField = 'franchiseId' | 'otp' | 'password' | 'confirmPassword';

const FranchiseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ franchiseId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetForm, setResetForm] = useState({
    franchiseId: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [resetOtpLoading, setResetOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetStatusMessage, setResetStatusMessage] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetMaskedPhone, setResetMaskedPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpStatus, setLoginOtpStatus] = useState('');
  const [loginOtpSending, setLoginOtpSending] = useState(false);
  const [loginOtpCooldown, setLoginOtpCooldown] = useState(0);
  const [twoStepVerificationEnabled, setTwoStepVerificationEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/franchise/login/config');
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok) {
          setTwoStepVerificationEnabled(data?.two_step_verification !== false);
        }
      } catch {
        // keep default true
      }
    };
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loginOtpCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setLoginOtpCooldown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loginOtpCooldown]);

  const handleChange = (field: 'franchiseId' | 'password', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'franchiseId' || field === 'password') {
      setLoginOtp('');
      setLoginOtpSent(false);
      setLoginOtpStatus('');
      setLoginOtpCooldown(0);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedId = form.franchiseId.trim();
    const trimmedOtp = loginOtp.trim();
    if (!trimmedId) {
      setError('Enter your Franchise ID.');
      return;
    }
    if (!form.password.trim()) {
      setError('Enter your password.');
      return;
    }
    if (twoStepVerificationEnabled && !/^\d{6}$/.test(trimmedOtp)) {
      setError('Enter the 6-digit OTP sent to the franchise owner phone.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        twoStepVerificationEnabled
          ? '/api/franchise/login/password'
          : '/api/franchise/login/password-only',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            franchise_id: trimmedId,
            password: form.password.trim(),
            ...(twoStepVerificationEnabled ? { otp: trimmedOtp } : {}),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error || 'Unable to verify franchise credentials.';
        throw new Error(message);
      }
      sessionStorage.setItem(
        'franchisePortal:data',
        JSON.stringify({
          ...data,
          session_token: data.session_token || data.token,
        })
      );
      navigate('/franchise/dashboard', { replace: true, state: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify franchise.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showResetPanel) {
      setResetForm(prev => ({
        ...prev,
        franchiseId: prev.franchiseId || form.franchiseId,
      }));
      setResetError('');
      setResetSuccess('');
      setResetStatusMessage('');
    }
  }, [showResetPanel, form.franchiseId]);

  const checkPasswordStrength = (value: string) => {
    if (!value) {
      return false;
    }
    const hasMinLength = value.length >= 8;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    return hasMinLength && hasLetter && hasNumber && hasSpecial;
  };

  const handleResetFieldChange = (field: ResetFormField, value: string) => {
    setResetForm(prev => ({ ...prev, [field]: value }));
    setResetError('');
    if (field === 'password' && value) {
      setResetSuccess('');
    }
  };
  const resetPasswordStrong = checkPasswordStrength(resetForm.password);

  const handleSendLoginOtp = async () => {
    if (!twoStepVerificationEnabled) {
      setError('Two-step verification is disabled. Login with password only.');
      return;
    }

    const franchiseId = form.franchiseId.trim();
    if (!franchiseId) {
      setError('Enter your Franchise ID before requesting an OTP.');
      return;
    }
    if (!form.password.trim()) {
      setError('Enter your password before requesting an OTP.');
      return;
    }

    setLoginOtpSending(true);
    setLoginOtpStatus('');
    setError('');
    try {
      const response = await fetch('/api/franchise/login/password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchise_id: franchiseId, password: form.password.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to send login OTP. Please try again.');
      }
      setLoginOtp('');
      setLoginOtpSent(true);
      setLoginOtpCooldown(90);
      setLoginOtpStatus(`OTP sent to ${data?.masked_phone || 'the registered owner number'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send login OTP. Please try again.');
    } finally {
      setLoginOtpSending(false);
    }
  };

  const sendFranchiseResetOtp = async () => {
    const targetFranchiseId = (resetForm.franchiseId || form.franchiseId).trim();
    if (!targetFranchiseId) {
      setResetError('Enter your Franchise ID before requesting an OTP.');
      return;
    }

    setResetOtpLoading(true);
    setResetError('');
    setResetSuccess('');
    setResetStatusMessage('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchise_id: targetFranchiseId,
          purpose: 'franchise_reset',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to send OTP. Please try again.');
      }
      setResetOtpSent(true);
      setResetMaskedPhone(data?.masked_phone || '');
      setResetForm(prev => ({ ...prev, franchiseId: targetFranchiseId }));
      setResetStatusMessage(
        'OTP sent successfully. Check the owner phone number registered with your first store.'
      );
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Unable to send OTP. Please try again.');
    } finally {
      setResetOtpLoading(false);
    }
  };

  const handleFranchiseReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetFranchiseId = (resetForm.franchiseId || form.franchiseId).trim();
    const trimmedOtp = resetForm.otp.trim();
    const trimmedPassword = resetForm.password.trim();
    const trimmedConfirm = resetForm.confirmPassword.trim();

    if (!targetFranchiseId) {
      setResetError('Enter your Franchise ID before resetting the password.');
      return;
    }
    if (!resetOtpSent) {
      setResetError('Request an OTP before resetting the password.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setResetError('Enter the 6-digit OTP sent to the franchise owner phone.');
      return;
    }
    if (!trimmedPassword) {
      setResetError('Enter a new password.');
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      const response = await fetch('/api/auth/franchise/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchise_id: targetFranchiseId,
          password: trimmedPassword,
          otp: trimmedOtp,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to reset franchise password.');
      }
      setResetSuccess(
        'Franchise password updated. Keep the new password handy for owner approvals.'
      );
      setResetForm({
        franchiseId: targetFranchiseId,
        otp: '',
        password: '',
        confirmPassword: '',
      });
      setResetOtpSent(false);
      setResetMaskedPhone('');
      setResetStatusMessage('');
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : 'Unable to reset franchise password. Please try again.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050714] text-white">
      <header className="flex w-full items-center justify-between border-b border-white/10 px-6 py-4">
        <BillboxLogo className="h-8 w-auto" />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-white/30 text-white hover:border-white hover:bg-white/5 hover:text-white"
            onClick={() => navigate('/login')}
          >
            Store Login
          </Button>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:border-white hover:bg-white/5 hover:text-white"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </header>
      <main className="flex-1 w-full px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Franchise Login</p>
            <h1 className="text-3xl font-semibold mt-2">Manage all your stores from one place</h1>
            <p className="text-sm text-white/70 mt-3">
              Enter your Franchise ID and verify with the OTP sent to the franchise owner's
              registered mobile number to review every store linked to your franchise.
            </p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-white/80">Franchise ID</label>
                <input
                  type="text"
                  value={form.franchiseId}
                  onChange={event => handleChange('franchiseId', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                  placeholder="restaurant1017"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={event => handleChange('password', event.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 pr-10 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {twoStepVerificationEnabled && (
                <div>
                  <label className="text-sm font-medium text-white/80">One-Time Password</label>
                  <div className="mt-1 flex gap-3">
                    <input
                      type="text"
                      value={loginOtp}
                      onChange={event => {
                        setLoginOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                        setError('');
                      }}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
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
                        !form.franchiseId.trim() ||
                        !form.password.trim() ||
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
                    <p className="text-xs text-emerald-300 mt-2">{loginOtpStatus}</p>
                  ) : (
                    <p className="text-xs text-white/60 mt-2">
                      OTPs are delivered to the franchise owner's phone. Request a new OTP if you
                      didn't receive one.
                    </p>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'View Stores'}
              </Button>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowResetPanel(prev => !prev)}
                  className="text-xs font-medium text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
                >
                  {showResetPanel ? 'Hide password reset' : 'Forgot franchise password?'}
                </button>
              </div>
            </form>
            {showResetPanel && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                {resetSuccess ? (
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                    Franchise password reset is successful! Keep the new password handy for owner
                    approvals.
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-white">Reset franchise password</h2>
                    <p className="text-xs text-white/60 mt-1">
                      OTP will be sent to the phone number of the very first store in this
                      franchise.
                    </p>
                    {resetError && (
                      <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {resetError}
                      </p>
                    )}
                    {resetMaskedPhone && (
                      <p className="mt-2 text-xs text-white/70">
                        OTP sent to <span className="font-semibold">{resetMaskedPhone}</span>.
                      </p>
                    )}
                    {resetStatusMessage && (
                      <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                        {resetStatusMessage}
                      </p>
                    )}
                    <form className="mt-4 space-y-4" onSubmit={handleFranchiseReset}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-white/70">
                            Franchise ID
                          </label>
                          <input
                            type="text"
                            value={resetForm.franchiseId}
                            onChange={event =>
                              handleResetFieldChange('franchiseId', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                            placeholder="restaurant1017"
                          />
                        </div>
                        <Button
                          type="button"
                          className="bg-white/10 text-white hover:bg-white/20"
                          onClick={sendFranchiseResetOtp}
                          disabled={resetOtpLoading}
                        >
                          {resetOtpLoading ? 'Sending…' : resetOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </Button>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/70">
                          OTP (6 digits)
                        </label>
                        <input
                          type="text"
                          value={resetForm.otp}
                          onChange={event =>
                            handleResetFieldChange(
                              'otp',
                              event.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                          placeholder="Enter OTP"
                        />
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-white/70">
                            New password
                          </label>
                          <input
                            type="password"
                            value={resetForm.password}
                            onChange={event =>
                              handleResetFieldChange('password', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-white/70">
                            Confirm password
                          </label>
                          <input
                            type="password"
                            value={resetForm.confirmPassword}
                            onChange={event =>
                              handleResetFieldChange('confirmPassword', event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring focus:ring-indigo-400/30"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      {resetForm.password && (
                        <p
                          className={`text-xs font-semibold ${
                            resetPasswordStrong ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {resetPasswordStrong
                            ? 'Password looks strong.'
                            : 'Add letters, numbers, and symbols to continue.'}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-white/60">
                        Use 8+ characters with letters, numbers, and special symbols.
                      </p>
                      <p className="text-xs text-white/50">
                        OTP is sent automatically to the primary store owner's registered phone.
                        Click the button once and wait for the SMS, then enter the 6-digit code
                        below before setting your new password.
                      </p>
                      <Button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        disabled={resetLoading}
                      >
                        {resetLoading ? 'Updating…' : 'Reset franchise password'}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FranchiseDashboard;
