import { Outlet } from 'react-router-dom';
import { Footer, Navbar, MobileBottomNav, Sidebar } from '../components/Navigation';

export function PublicLayout() {
  return <div className="fx-public-layout"><Navbar /><main className="fx-public-main"><Outlet /></main><Footer /></div>;
}

function WorkspaceLayout({ role }) {
  return <div className={`fx-workspace fx-workspace-${role}`}><Sidebar role={role} /><main className="fx-workspace-main"><Outlet /></main><MobileBottomNav role={role} /></div>;
}

export function CustomerLayout() { return <WorkspaceLayout role="customer" />; }
export function ProviderLayout() { return <WorkspaceLayout role="provider" />; }
export function AdminLayout() { return <WorkspaceLayout role="admin" />; }
