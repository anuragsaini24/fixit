import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Card } from './Ui';
import { useAuth } from '../context/AuthContext';

const workspaceByRole = {
  customer: { label: 'customer', path: '/dashboard' },
  provider: { label: 'provider', path: '/provider/dashboard' },
  admin: { label: 'administrator', path: '/admin/dashboard' },
};

export default function ProtectedRoute({ roles }) {
  const { user, loading, authError, refreshUser } = useAuth();
  const location = useLocation();
  if (loading) return <section className="fx-auth-page"><p className="fx-state" role="status">Checking your session…</p></section>;
  if (authError) return <section className="fx-auth-page"><Card className="fx-auth-card"><p className="fx-eyebrow">SESSION CHECK</p><h1>We couldn’t verify your session</h1><p className="fx-lede" role="alert">{authError}</p><Button onClick={refreshUser}>Try again</Button></Card></section>;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (roles && !roles.includes(user.accountType)) {
    const workspace = workspaceByRole[user.accountType];
    const expected = roles.map((role) => workspaceByRole[role]?.label).filter(Boolean).join(' or ');
    return <section className="fx-auth-page"><Card className="fx-auth-card"><p className="fx-eyebrow">ACCESS RESTRICTED</p><h1>This workspace isn’t available to your account</h1><p className="fx-lede">You’re signed in as a {workspace?.label || 'user'}; this area is for {expected} accounts.</p><a className="fx-button fx-button-primary" href={workspace?.path || '/'}>Go to your workspace</a></Card></section>;
  }
  return <Outlet />;
}
