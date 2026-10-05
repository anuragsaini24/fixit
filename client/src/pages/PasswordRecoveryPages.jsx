import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, FormInput } from '../components/Ui';
import { authApi } from '../services/authApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await authApi.requestPasswordReset(email);
      setMessage(result.message);
    } catch (issue) {
      setError(issue.message || 'Could not request a password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <section className="fx-auth-page"><Card className="fx-auth-card">
    <p className="fx-eyebrow">ACCOUNT RECOVERY</p>
    <h1>Forgot your password?</h1>
    <p className="fx-lede">Enter the email for your customer or provider account. If it exists, we’ll send a reset link.</p>
    <form className="fx-form" onSubmit={submit}>
      <FormInput name="email" label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      {error && <p className="fx-error" role="alert">{error}</p>}
      {message && <p className="fx-success" role="status">{message}</p>}
      <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
    </form>
    <p className="fx-auth-switch"><Link to="/login">Back to log in</Link></p>
  </Card></section>;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirmPassword'))) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await authApi.resetPassword(token, password);
      setMessage(result.message);
    } catch (issue) {
      setError(issue.message || 'This reset link is invalid or expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return <section className="fx-auth-page"><Card className="fx-auth-card">
    <p className="fx-eyebrow">ACCOUNT RECOVERY</p>
    <h1>Choose a new password</h1>
    <p className="fx-lede">Use at least 8 characters. Reset links expire after 30 minutes.</p>
    {!token ? <p className="fx-error" role="alert">This reset link is missing its token. Request a new link.</p> : <form className="fx-form" onSubmit={submit}>
      <FormInput name="password" label="New password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      <FormInput name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      {error && <p className="fx-error" role="alert">{error}</p>}
      {message && <p className="fx-success" role="status">{message} <Link to="/login">Log in</Link></p>}
      <Button type="submit" disabled={loading || Boolean(message)}>{loading ? 'Updating…' : 'Update password'}</Button>
    </form>}
    <p className="fx-auth-switch"><Link to="/forgot-password">Request another reset link</Link></p>
  </Card></section>;
}