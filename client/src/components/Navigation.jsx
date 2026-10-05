import { useState } from 'react';
import { BriefcaseBusiness, CalendarDays, ChevronDown, CreditCard, Grid2X2, Heart, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck, Star, UsersRound, Wrench, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const customerItems = [['Dashboard', '/dashboard', LayoutDashboard], ['Services', '/services', Grid2X2], ['Bookings', '/bookings', CalendarDays], ['Favorites', '/dashboard#favorites', Heart], ['Reviews', '/dashboard#reviews', Star], ['Settings', '/dashboard#settings', Settings2]];
const providerItems = [['Overview', '/provider/dashboard', LayoutDashboard], ['Requests', '/provider/requests', CalendarDays], ['Jobs', '/provider/jobs', BriefcaseBusiness], ['Earnings', '/provider/earnings', CreditCard], ['Profile', '/provider/profile', Settings2]];
const adminItems = [['Dashboard', '/admin/dashboard', LayoutDashboard], ['Users', '/admin/users', UsersRound], ['Providers', '/admin/providers', BriefcaseBusiness], ['Bookings', '/admin/bookings', CalendarDays], ['Services', '/admin/services', Grid2X2], ['Reviews', '/admin/reviews', Star]];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = [['Services', '/services'], ['Professionals', '/providers'], ['How it works', '/#how-it-works']];
  return <header className="fx-navbar"><div className="fx-navbar-inner">
    <Link className="fx-brand" to="/"><span className="fx-brand-mark"><Wrench size={18} /></span><span>fixit<span className="fx-brand-period">.</span></span></Link>
    <button className="fx-menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav className={`fx-public-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">{links.map(([label, to]) => <Link key={label} to={to} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
    <div className="fx-navbar-actions">{user ? <><Link className="fx-nav-user" to={user.accountType === 'admin' ? '/admin/dashboard' : user.accountType === 'provider' ? '/provider/dashboard' : '/dashboard'}>{user.name}</Link><button className="fx-link-button" onClick={() => { logout(); setOpen(false); }}>Sign out</button></> : <><Link className="fx-link-button" to="/login" state={{ from: location.pathname }}>Log in</Link><Link className="fx-button fx-button-primary" to="/register">Join FixIt</Link></>}</div>
  </div></header>;
}

export function Footer() {
  return <footer className="fx-footer"><Link className="fx-brand" to="/"><span className="fx-brand-mark"><Wrench size={16} /></span><span>fixit<span className="fx-brand-period">.</span></span></Link><p>Good help, close to home.</p><span>© 2026 FixIt</span></footer>;
}

function WorkspaceLinks({ items }) {
  return <nav className="fx-sidebar-nav">{items.map(([label, to, Icon]) => <NavLink key={label} to={to} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>;
}

export function Sidebar({ role = 'customer' }) {
  const { user } = useAuth();
  const config = role === 'admin' ? { label: 'ADMIN', title: 'Admin workspace', items: adminItems } : role === 'provider' ? { label: 'PROVIDER WORKSPACE', title: 'Provider workspace', items: providerItems } : { label: 'CUSTOMER HOME', title: 'Your FixIt home', items: customerItems };
  return <aside className="fx-sidebar"><Link className="fx-brand" to="/"><span className="fx-brand-mark"><Wrench size={18} /></span><span>fixit<span className="fx-brand-period">.</span></span><small>{config.label}</small></Link><WorkspaceLinks items={config.items} /><div className="fx-sidebar-foot"><span className="fx-shield"><ShieldCheck size={16} /></span><span><strong>{user?.name || 'Guest'}</strong><small>{config.title}</small></span><ChevronDown size={15} /></div></aside>;
}

export function MobileBottomNav({ role = 'customer' }) {
  const items = role === 'provider' ? providerItems.slice(0, 5) : role === 'admin' ? adminItems.slice(0, 5) : customerItems.slice(0, 4);
  return <nav className="fx-mobile-nav" aria-label={`${role} navigation`}>{items.map(([label, to, Icon]) => <NavLink key={label} to={to} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>;
}
