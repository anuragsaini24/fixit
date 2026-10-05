import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Check, CircleCheck, ClipboardList, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, FormInput, Modal, PageTitle, Rating } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { useBookingRealtime } from '../hooks/useBookingRealtime';
import { useAsync } from '../hooks/useAsync';
import { bookingApi } from '../services/bookingApi';
import { catalogApi } from '../services/catalogApi';
import { adminUsersApi } from '../services/adminUsersApi';
import { adminApi, reviewApi, STORAGE_KEYS } from '../services/mockApi';
import { formatDate, formatMoney } from '../utils/format';

function Stat({ label, value, hint, icon: Icon }) {
  return <Card className="fx-stat"><span className="fx-stat-icon"><Icon size={18} /></span><span>{label}</span><strong>{value}</strong><small>{hint}</small></Card>;
}

export function ProviderDashboardPage() {
  const { user } = useAuth();
  const providerId = user?.providerId || localStorage.getItem(STORAGE_KEYS.selectedProvider);
  const { data: bookings = [], loading, reload } = useAsync(() => bookingApi.getForProvider(providerId), [providerId]);
  useBookingRealtime(() => reload(), Boolean(user?.providerId));
  const pending = bookings.filter((booking) => booking.status === 'Booking Confirmed');
  const active = bookings.filter((booking) => ['Professional Assigned', 'Professional On The Way', 'Service Started'].includes(booking.status));
  const completed = bookings.filter((booking) => booking.status === 'Service Completed');
  return <section className="fx-page"><PageTitle eyebrow="YOUR BUSINESS" title={`Good morning, ${(user?.name || 'Provider').split(' ')[0]}`} copy="Here’s your service activity at a glance." action={<Link to="/provider/requests">View requests</Link>} />{loading ? <p className="fx-state">Loading provider activity…</p> : <><div className="fx-stats-grid fx-stats-four"><Stat label="New requests" value={pending.length} hint="Awaiting your response" icon={ClipboardList} /><Stat label="Active jobs" value={active.length} hint="Assigned and in progress" icon={BriefcaseBusiness} /><Stat label="Completed jobs" value={completed.length} hint="Successfully completed" icon={CircleCheck} /><Stat label="Earnings" value={formatMoney(completed.reduce((sum, booking) => sum + Number(booking.estimatedCost || 0), 0))} hint="Completed estimates" icon={Wallet} /></div><Card><div className="fx-section-head"><div><p className="fx-eyebrow">CUSTOMER INQUIRIES</p><h2>New service requests</h2></div><Link to="/provider/requests">All requests</Link></div>{pending.slice(0, 3).map((booking) => <BookingRow key={booking.bookingId} booking={booking} />)}{!pending.length && <div className="fx-empty"><ClipboardList /><h2>No new requests</h2><p>New customer requests will appear here.</p></div>}</Card></>}</section>;
}

export function ProviderRequestsPage() {
  const { user } = useAuth();
  const providerId = user?.providerId || localStorage.getItem(STORAGE_KEYS.selectedProvider);
  const { data: bookings = [], loading, reload } = useAsync(() => bookingApi.getForProvider(providerId), [providerId]);
  useBookingRealtime(() => reload(), Boolean(user?.providerId));
  const [notice, setNotice] = useState('');
  async function respond(booking, status) {
    try { await bookingApi.updateStatus(booking.bookingId, status); setNotice(status === 'Rejected' ? 'Request rejected.' : 'Request accepted and assigned to you.'); reload(); }
    catch (error) { setNotice(error.message); }
  }
  const requests = bookings.filter((booking) => booking.status === 'Booking Confirmed');
  return <section className="fx-page"><PageTitle eyebrow="CUSTOMER INQUIRIES" title="Service requests" copy="Review job details and respond to new requests." /><Card>{notice && <p role="status" className="fx-success">{notice}</p>}{loading ? <p className="fx-state">Loading requests…</p> : requests.length ? requests.map((booking) => <article className="fx-request-card" key={booking.bookingId}><div className="fx-section-head"><h2>{booking.service}</h2><Badge tone="warm">New request</Badge></div><p>{booking.problem}</p><dl className="fx-summary"><div><dt>Customer</dt><dd>{booking.customer?.name || 'Guest Customer'}</dd></div><div><dt>Date</dt><dd>{formatDate(booking.date)}</dd></div><div><dt>Time</dt><dd>{booking.time}</dd></div><div><dt>Estimate</dt><dd>{formatMoney(booking.estimatedCost)}</dd></div></dl><div className="fx-actions"><Button variant="secondary" onClick={() => respond(booking, 'Rejected')}>Reject</Button><Button onClick={() => respond(booking, 'Professional Assigned')}>Accept <Check size={15} /></Button></div></article>) : <div className="fx-empty"><ClipboardList /><h2>No new requests</h2><p>New service requests will appear here.</p></div>}</Card></section>;
}

export function ProviderJobsPage() {
  const { user } = useAuth();
  const providerId = user?.providerId || localStorage.getItem(STORAGE_KEYS.selectedProvider);
  const { data: bookings = [], loading, reload } = useAsync(() => bookingApi.getForProvider(providerId), [providerId]);
  useBookingRealtime(() => reload(), Boolean(user?.providerId));
  const [notice, setNotice] = useState('');
  const [updating, setUpdating] = useState('');
  const jobs = bookings.filter((booking) => ['Professional Assigned', 'Professional On The Way', 'Service Started', 'Service Completed'].includes(booking.status));
  const nextStatus = { 'Professional Assigned': ['Professional On The Way', 'Mark on the way'], 'Professional On The Way': ['Service Started', 'Start service'], 'Service Started': ['Service Completed', 'Complete service'] };
  async function advanceJob(booking) {
    const [status] = nextStatus[booking.status] || [];
    if (!status) return;
    setUpdating(booking.bookingId); setNotice('');
    try { await bookingApi.updateStatus(booking.bookingId, status); setNotice(`Booking ${booking.bookingId} updated.`); reload(); }
    catch (error) { setNotice(error.message); }
    finally { setUpdating(''); }
  }
  return <section className="fx-page"><PageTitle eyebrow="WORK IN PROGRESS" title="Jobs" copy="Assigned and completed customer services." />{notice && <p className="fx-success" role="status">{notice}</p>}{loading ? <p className="fx-state">Loading jobs…</p> : jobs.length ? <Card>{jobs.map((booking) => <div className="fx-provider-job" key={booking.bookingId}><BookingRow booking={booking} />{nextStatus[booking.status] && <div className="fx-actions"><Button onClick={() => advanceJob(booking)} disabled={updating === booking.bookingId}>{updating === booking.bookingId ? 'Updating…' : nextStatus[booking.status][1]}</Button></div>}</div>)}</Card> : <Card className="fx-empty"><BriefcaseBusiness /><h2>No jobs yet</h2><p>Accepted service requests will appear here.</p></Card>}</section>;
}

export function ProviderEarningsPage() {
  const { user } = useAuth();
  const providerId = user?.providerId || localStorage.getItem(STORAGE_KEYS.selectedProvider);
  const { data: bookings = [], loading, reload } = useAsync(() => bookingApi.getForProvider(providerId), [providerId]);
  useBookingRealtime(() => reload(), Boolean(user?.providerId));
  const completed = bookings.filter((booking) => booking.status === 'Service Completed');
  const total = completed.reduce((sum, booking) => sum + Number(booking.estimatedCost || 0), 0);
  return <section className="fx-page"><PageTitle eyebrow="COMPLETED SERVICES" title="Earnings" copy="Estimates from your completed jobs." />{loading ? <p className="fx-state">Loading earnings…</p> : <><Card className="fx-earnings-total"><span>Total earnings</span><strong>{formatMoney(total)}</strong><small>{completed.length} completed {completed.length === 1 ? 'job' : 'jobs'}</small></Card><Card><div className="fx-section-head"><h2>Completed job earnings</h2></div>{completed.map((booking) => <BookingRow key={booking.bookingId} booking={booking} />)}{!completed.length && <div className="fx-empty"><Wallet /><h2>No completed jobs</h2><p>Earnings from completed services will appear here.</p></div>}</Card></>}</section>;
}

export function ProviderProfilePage() {
  const { user } = useAuth();
  const { data: provider, loading, error, reload } = useAsync(() => user?.providerId ? catalogApi.getProvider(user.providerId) : Promise.resolve(null), [user?.providerId]);
  const { data: services = [] } = useAsync(() => catalogApi.getServices(), []);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  async function saveProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      profession: String(form.get('profession')).trim(),
      serviceIds: form.getAll('serviceIds').map(String),
      experience: Number(form.get('experience') || 0),
      startingPrice: Number(form.get('startingPrice') || 0),
      availableToday: form.get('availableToday') === 'on',
      location: String(form.get('location') || '').trim(),
      state: String(form.get('state') || '').trim(),
      about: String(form.get('about') || '').trim(),
    };
    setSaving(true); setNotice('');
    try { await catalogApi.updateMyProviderProfile(values); setNotice('Profile updated.'); reload(); }
    catch (issue) { setNotice(issue.message); }
    finally { setSaving(false); }
  }
  return <section className="fx-page"><PageTitle eyebrow="YOUR BUSINESS" title="Profile" copy="Manage your professional details and service area." />{loading ? <p className="fx-state">Loading profile…</p> : error || !provider ? <Card className="fx-empty"><h2>Provider profile unavailable</h2><p>{error || 'Register as a provider to set up a workspace.'}</p></Card> : <Card className="fx-provider-profile"><span className={`fx-avatar fx-avatar-${provider.avatarTone}`}>{provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><h2>{provider.name}</h2><Rating value={provider.rating} count={provider.reviewCount} /><Badge tone={provider.accountStatus === 'Verified' ? 'success' : 'warm'}>{provider.accountStatus}</Badge></div><form className="fx-form" onSubmit={saveProfile}><FormInput name="profession" label="Profession" defaultValue={provider.profession} required maxLength={100} /><FormInput name="experience" label="Years of experience" type="number" min="0" max="80" defaultValue={provider.experience} required /><FormInput name="startingPrice" label="Starting price (₹)" type="number" min="0" defaultValue={provider.startingPrice} required /><fieldset className="fx-field"><legend>Services offered</legend>{services.map((service) => <label className="fx-check" key={service.id}><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={provider.serviceIds.includes(service.id)} />{service.name}</label>)}{!services.length && <p>No active services are available yet.</p>}</fieldset><FormInput name="location" label="Location" defaultValue={provider.location} maxLength={200} /><FormInput name="state" label="State" defaultValue={provider.state} maxLength={100} /><FormInput as="textarea" name="about" label="About" rows={4} defaultValue={provider.about} maxLength={2000} /><label className="fx-check"><input type="checkbox" name="availableToday" defaultChecked={provider.availableToday} />Available today</label>{notice && <p className={notice === 'Profile updated.' ? 'fx-success' : 'fx-error'} role="status">{notice}</p>}<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button></form></Card>}</section>;
}

export function AdminDashboardPage() {
  const [registeredUsers, setRegisteredUsers] = useState(null);
  const { data: providers = [] } = useAsync(() => adminApi.getProviders(), []);
  const { data: bookings = [] } = useAsync(() => bookingApi.getAll(), []);
  useEffect(() => {
    let active = true;
    const refreshUserCount = async () => {
      try {
        const { totalUsers } = await adminUsersApi.getStats();
        if (active) setRegisteredUsers(totalUsers);
      } catch {
        if (active) setRegisteredUsers(null);
      }
    };
    refreshUserCount();
    const interval = window.setInterval(refreshUserCount, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);
  const completed = bookings.filter((booking) => booking.status === 'Service Completed');
  const revenue = completed.reduce((sum, booking) => sum + Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0), 0);
  return <section className="fx-page"><PageTitle eyebrow="PLATFORM OVERVIEW" title="Dashboard" copy="Monitor marketplace activity and service operations." /><div className="fx-stats-grid"><Stat label="Registered users" value={registeredUsers ?? '—'} hint="All registered accounts" icon={UsersRoundIcon} /><Stat label="Total providers" value={providers.length} hint="Service professionals" icon={BriefcaseBusiness} /><Stat label="Total bookings" value={bookings.length} hint="All service requests" icon={CalendarDays} /><Stat label="Total revenue" value={formatMoney(revenue)} hint="Completed bookings" icon={Wallet} /></div><Card><div className="fx-section-head"><h2>Recent bookings</h2><Link to="/admin/bookings">All bookings</Link></div><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>User</th><th>Service</th><th>Provider</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>{bookings.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map((booking) => <tr key={booking.bookingId}><td>{booking.customer?.name}</td><td>{booking.service}</td><td>{booking.provider?.name}</td><td>{formatDate(booking.date)}</td><td><Badge tone={booking.status === 'Service Completed' ? 'success' : 'warm'}>{booking.status}</Badge></td><td>{formatMoney(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0))}</td></tr>)}</tbody></table></div></Card></section>;
}

function UsersRoundIcon(props) { return <span {...props}>◎</span>; }

export function AdminUsersPage() {
  const { data: users = [], loading, error, reload } = useAsync(() => adminUsersApi.getAll(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const rows = users.filter((user) => (!query || `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || user.accountType === filter || user.status.toLowerCase() === filter));
  async function toggle(user) { await adminUsersApi.updateStatus(user.id, user.status === 'Active' ? 'Inactive' : 'Active'); reload(); }
  return <section className="fx-page"><PageTitle eyebrow="ACCOUNT DIRECTORY" title="Users" copy="Search accounts and manage their access status." />{error && <p className="fx-error" role="alert">{error}</p>}<Card>{loading ? <p className="fx-state">Loading users…</p> : <><div className="fx-filter-row"><input className="fx-input" aria-label="Search users" placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} /><select className="fx-input" aria-label="Filter users" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All accounts</option><option value="customer">Customers</option><option value="provider">Providers</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.accountType}</td><td><Badge tone={user.status === 'Active' ? 'success' : 'warm'}>{user.status}</Badge></td><td><Button variant="secondary" onClick={() => toggle(user)}>{user.status === 'Active' ? 'Deactivate' : 'Activate'}</Button></td></tr>)}</tbody></table></div>{!rows.length && <p className="fx-empty-copy">No users found.</p>}</>}</Card></section>;
}

export function AdminProvidersPage() {
  const { data: providers = [] } = useAsync(() => adminApi.getProviders(), []);
  const [query, setQuery] = useState('');
  const rows = providers.filter((provider) => `${provider.name} ${provider.profession} ${provider.location}`.toLowerCase().includes(query.toLowerCase()));
  async function verify(provider) { await adminApi.updateProvider(provider.id, { accountStatus: 'Verified', verified: true }); window.location.reload(); }
  return <section className="fx-page"><PageTitle eyebrow="PROFESSIONAL DIRECTORY" title="Providers" copy="Review professional profiles and verification status." /><Card><input className="fx-input" aria-label="Search providers" placeholder="Search name, profession, location" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>Provider</th><th>Profession</th><th>Location</th><th>Verification</th><th>Action</th></tr></thead><tbody>{rows.map((provider) => <tr key={provider.id}><td>{provider.name}</td><td>{provider.profession}</td><td>{provider.location}</td><td><Badge tone={provider.accountStatus === 'Verified' ? 'success' : 'warm'}>{provider.accountStatus}</Badge></td><td>{provider.accountStatus !== 'Verified' && <Button onClick={() => verify(provider)}>Verify</Button>}</td></tr>)}</tbody></table></div></Card></section>;
}

export function AdminBookingsPage() {
  const { data: bookings = [] } = useAsync(() => bookingApi.getAll(), []);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const rows = bookings.filter((booking) => (!query || `${booking.bookingId} ${booking.customer?.name} ${booking.provider?.name} ${booking.service}`.toLowerCase().includes(query.toLowerCase())) && (status === 'all' || booking.status === status));
  return <section className="fx-page"><PageTitle eyebrow="SERVICE ACTIVITY" title="Bookings" copy="Search and review customer service requests." /><Card><div className="fx-filter-row"><input className="fx-input" aria-label="Search bookings" placeholder="Search booking, user, or provider" value={query} onChange={(event) => setQuery(event.target.value)} /><select className="fx-input" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{[...new Set(bookings.map((booking) => booking.status))].map((value) => <option key={value}>{value}</option>)}</select></div><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>Booking</th><th>User</th><th>Service</th><th>Provider</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>{rows.map((booking) => <tr key={booking.bookingId}><td>{booking.bookingId}</td><td>{booking.customer?.name}</td><td>{booking.service}</td><td>{booking.provider?.name}</td><td>{formatDate(booking.date)}</td><td>{booking.status}</td><td>{formatMoney(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0))}</td></tr>)}</tbody></table></div></Card></section>;
}

export function AdminServicesPage() {
  const { data: loaded = [], loading, error, reload } = useAsync(() => catalogApi.getServices(), []);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { setServices(loaded); }, [loaded]);
  const visible = services.filter((service) => `${service.name} ${service.category}`.toLowerCase().includes(query.toLowerCase()));
  function openEditor(service = null) { setEditing(service || { id: '', name: '', category: '', priceFrom: '', status: 'Active' }); }
  async function saveService(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service = { name: String(form.get('name')).trim(), category: String(form.get('category')).trim(), priceFrom: Number(form.get('priceFrom')), status: String(form.get('status')) };
    try {
      if (editing.id) await catalogApi.updateService(editing.id, service);
      else await catalogApi.createService(service);
      setEditing(null); setNotice('Service saved.'); reload();
    } catch (issue) { setNotice(issue.message); }
  }
  async function deleteService(service) {
    if (!window.confirm(`Delete ${service.name}?`)) return;
    try { await catalogApi.deleteService(service.id); setNotice('Service archived.'); reload(); }
    catch (issue) { setNotice(issue.message); }
  }
  return <section className="fx-page"><PageTitle eyebrow="MARKETPLACE CATALOG" title="Services" copy="Add, edit, or remove service categories." action={<Button onClick={() => openEditor()}><Plus size={16} />Add service</Button>} />{notice && <p className="fx-success" role="status">{notice}</p>}{error && <p className="fx-error" role="alert">{error}</p>}<Card>{loading ? <p className="fx-state">Loading services…</p> : <><input className="fx-input" aria-label="Search services" placeholder="Search service or category" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>Service</th><th>Category</th><th>Starting price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((service) => <tr key={service.id}><td>{service.name}</td><td>{service.category}</td><td>{formatMoney(service.priceFrom)}</td><td>{service.status}</td><td><div className="fx-actions"><Button variant="secondary" onClick={() => openEditor(service)}><Pencil size={14} />Edit</Button><Button variant="secondary" onClick={() => deleteService(service)}><Trash2 size={14} />Archive</Button></div></td></tr>)}</tbody></table></div>{!visible.length && <p className="fx-empty-copy">No services found.</p>}</>}</Card><Modal open={Boolean(editing)} title={editing?.id ? 'Edit service' : 'Add service'} onClose={() => setEditing(null)}><form className="fx-form" onSubmit={saveService}><FormInput name="name" label="Service name" defaultValue={editing?.name} required maxLength={70} /><FormInput name="category" label="Category" defaultValue={editing?.category} required maxLength={60} /><FormInput name="priceFrom" label="Starting price (₹)" type="number" min="0" step="50" defaultValue={editing?.priceFrom} required /><div className="fx-field"><label htmlFor="service-status">Status</label><select className="fx-input" id="service-status" name="status" defaultValue={editing?.status || 'Active'}><option>Active</option><option>Inactive</option></select></div><div className="fx-form-actions"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save service</Button></div></form></Modal></section>;
}

export function AdminReviewsPage() {
  const { data: loaded = [] } = useAsync(() => reviewApi.getAll(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  useEffect(() => { setReviews(loaded); }, [loaded]);
  const visible = reviews.filter((review) => (!query || `${review.customerName} ${review.providerName} ${review.comment}`.toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || (filter === 'flagged' ? review.flagged : !review.flagged)));
  function toggle(review) {
    const next = reviews.map((item) => item.id === review.id ? { ...item, flagged: !item.flagged } : item);
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(next)); setReviews(next);
  }
  return <section className="fx-page"><PageTitle eyebrow="CUSTOMER FEEDBACK" title="Reviews" copy="Review and flag marketplace feedback for follow-up." /><Card><div className="fx-filter-row"><input className="fx-input" aria-label="Search reviews" placeholder="Search customer, provider, or review" value={query} onChange={(event) => setQuery(event.target.value)} /><select className="fx-input" aria-label="Filter reviews" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All reviews</option><option value="clear">Not flagged</option><option value="flagged">Flagged</option></select></div><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>Customer</th><th>Provider</th><th>Rating</th><th>Review</th><th>Moderation</th><th>Action</th></tr></thead><tbody>{visible.map((review) => <tr key={review.id}><td>{review.customerName || 'FixIt customer'}</td><td>{review.providerName}</td><td><Rating value={review.rating} /></td><td>{review.comment}</td><td><Badge tone={review.flagged ? 'danger' : 'success'}>{review.flagged ? 'Flagged' : 'Clear'}</Badge></td><td><Button variant="secondary" onClick={() => toggle(review)}>{review.flagged ? 'Unflag' : 'Flag'}</Button></td></tr>)}</tbody></table></div>{!visible.length && <p className="fx-empty-copy">No reviews match your filters.</p>}</Card></section>;
}

function BookingRow({ booking }) {
  return <article className="fx-booking-row"><div><strong>{booking.service}</strong><p>{booking.customer?.name} · {formatDate(booking.date)} · {booking.time}</p></div><Badge tone={booking.status === 'Service Completed' ? 'success' : 'warm'}>{booking.status}</Badge><strong>{formatMoney(booking.estimatedCost)}</strong></article>;
}
