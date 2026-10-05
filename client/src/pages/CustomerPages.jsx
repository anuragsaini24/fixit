import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Heart, MessageSquare, Plus, Search, Settings2, Star, Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, PageTitle, Rating } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { useBookingRealtime } from '../hooks/useBookingRealtime';
import { useAsync } from '../hooks/useAsync';
import { bookingApi } from '../services/bookingApi';
import { catalogApi } from '../services/catalogApi';
import { reviewApi, STORAGE_KEYS } from '../services/mockApi';
import { formatDate, formatMoney } from '../utils/format';

export function CustomerDashboardPage() {
  const { user } = useAuth();
  const { data: bookings = [], loading, reload } = useAsync(() => bookingApi.getForCustomer(user?.id), [user?.id]);
  useBookingRealtime(() => reload(), user?.accountType === 'customer');
  const { data: reviews = [] } = useAsync(() => reviewApi.getAll(), []);
  const { data: providers = [] } = useAsync(() => catalogApi.getProviders(), []);
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(location.hash.slice(1) || 'dashboard');
  const [query, setQuery] = useState('');
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEYS.customerName) || user?.name || 'Guest Customer');
  const [notice, setNotice] = useState('');
  useEffect(() => { setView(location.hash.slice(1) || 'dashboard'); }, [location.hash]);
  const completed = bookings.filter((booking) => booking.status === 'Service Completed');
  const pending = bookings.filter((booking) => !['Service Completed', 'Booking Cancelled', 'Rejected'].includes(booking.status));
  const spent = completed.reduce((sum, booking) => sum + Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0), 0);
  const filteredBookings = bookings.filter((booking) => `${booking.bookingId} ${booking.service} ${booking.provider?.name} ${booking.status}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const favorites = useMemo(() => providers.filter((provider) => (JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]')).includes(provider.id)), [providers, view]);
  function go(next) { setView(next); navigate(`/dashboard#${next}`); }
  async function saveName(event) { event.preventDefault(); localStorage.setItem(STORAGE_KEYS.customerName, name.trim()); setNotice('Your profile name has been saved on this device.'); }
  if (loading) return <section className="fx-page"><p className="fx-state">Loading your FixIt home…</p></section>;
  return <section className="fx-page fx-workspace-page">
    <PageTitle eyebrow="YOUR FIXIT HOME" title={`Good morning, ${name}`} copy="Here’s what’s happening with your home services." action={<Link className="fx-button fx-button-primary" to="/providers"><Plus size={16} />New booking</Link>} />
    {view === 'dashboard' && <><div className="fx-stats-grid"><Card><span>Total bookings</span><strong>{bookings.length}</strong><small>All service requests</small></Card><Card><span>Pending bookings</span><strong>{pending.length}</strong><small>Still in progress</small></Card><Card><span>Total spent</span><strong>{formatMoney(spent)}</strong><small>Completed service estimates</small></Card></div><div className="fx-two-column"><Card><div className="fx-section-head"><div><p className="fx-eyebrow">QUICK ACCESS</p><h2>Service shortcuts</h2></div><Link to="/services">All services</Link></div><div className="fx-shortcut-grid">{['svc-electrical', 'svc-plumbing', 'svc-ac', 'svc-laptop'].map((id) => <Link key={id} to={`/providers?serviceId=${id}`} className="fx-shortcut">{id.replace('svc-', '').replace('-', ' ')}</Link>)}</div></Card><Card><div className="fx-section-head"><div><p className="fx-eyebrow">NEXT UP</p><h2>Upcoming booking</h2></div><Link to="/bookings">All bookings</Link></div>{pending[0] ? <BookingRow booking={pending[0]} /> : <div className="fx-empty"><CalendarDays /><strong>No upcoming bookings</strong><p>When you book a service, it will show up here.</p><Link to="/providers">Find a professional</Link></div>}</Card></div><Card><div className="fx-section-head"><div><p className="fx-eyebrow">YOUR ACTIVITY</p><h2>Recent bookings</h2></div><Link to="/bookings">View all</Link></div><div className="fx-table-wrap"><table className="fx-table"><thead><tr><th>Service</th><th>Provider</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredBookings.map((booking) => <tr key={booking.bookingId}><td>{booking.service}</td><td>{booking.provider?.name}</td><td>{formatDate(booking.date)}</td><td>{formatMoney(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0))}</td><td><Badge tone={booking.status === 'Service Completed' ? 'success' : 'warm'}>{booking.status}</Badge></td><td><Link to={`/tracking/${booking.bookingId}`}>View</Link></td></tr>)}</tbody></table></div>{!bookings.length && <p className="fx-empty-copy">Your recent bookings will appear here.</p>}</Card></>}
    {view === 'favorites' && <Card><div className="fx-section-head"><div><p className="fx-eyebrow">SAVED PROFESSIONALS</p><h2>Favorites</h2></div></div>{favorites.length ? <div className="fx-provider-grid">{favorites.map((provider) => <article className="fx-provider-card" key={provider.id}><h3>{provider.name}</h3><p>{provider.profession}</p><Rating value={provider.rating} count={provider.reviewCount} /><Link to={`/provider/${provider.id}`}>View profile</Link></article>)}</div> : <div className="fx-empty"><Heart /><h2>No favorites yet</h2><p>Save a provider from their profile to find them here.</p><Link to="/providers">Browse professionals</Link></div>}</Card>}
    {view === 'reviews' && <Card><div className="fx-section-head"><div><p className="fx-eyebrow">YOUR FEEDBACK</p><h2>Reviews</h2></div></div>{reviews.filter((review) => !review.customerId || review.customerId === user?.id).map((review) => <article className="fx-review" key={review.id}><strong>{review.providerName}</strong><Rating value={review.rating} /><p>{review.comment}</p></article>)}{!reviews.length && <p className="fx-empty-copy">Reviews you share will appear here.</p>}</Card>}
    {view === 'messages' && <Card><div className="fx-section-head"><div><p className="fx-eyebrow">CONVERSATIONS</p><h2>Messages</h2></div></div>{JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]').map((message) => <article className="fx-review" key={message.savedAt}><strong>{message.providerName}</strong><p>{message.content}</p><small>Saved draft · Not sent</small></article>)}{!JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]').length && <div className="fx-empty"><MessageSquare /><h2>No messages yet</h2><p>Saved message drafts will appear here.</p></div>}</Card>}
    {view === 'settings' && <Card className="fx-form-card"><div className="fx-section-head"><div><p className="fx-eyebrow">ACCOUNT</p><h2>Settings</h2><p>Update the name shown on your FixIt dashboard.</p></div></div><form className="fx-form" onSubmit={saveName}><div className="fx-field"><label htmlFor="profile-name">Your name</label><input className="fx-input" id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={60} /></div>{notice && <p className="fx-success" role="status">{notice}</p>}<Button type="submit">Save profile</Button></form></Card>}
    <nav className="fx-view-tabs" aria-label="Customer dashboard sections">{[['dashboard', 'Home', Settings2], ['favorites', 'Favorites', Heart], ['reviews', 'Reviews', Star], ['messages', 'Messages', MessageSquare], ['settings', 'Settings', Settings2]].map(([id, label, Icon]) => <button className={view === id ? 'is-active' : ''} type="button" key={id} onClick={() => go(id)}><Icon size={16} />{label}</button>)}</nav>
    {notice && view !== 'settings' && <p className="fx-success" role="status">{notice}</p>}
  </section>;
}

function BookingRow({ booking }) {
  return <article className="fx-booking-row"><div><strong>{booking.service}</strong><p>{booking.provider?.name} · {formatDate(booking.date)}</p></div><Badge tone={booking.status === 'Service Completed' ? 'success' : 'warm'}>{booking.status}</Badge><Link to={`/tracking/${booking.bookingId}`}>View</Link></article>;
}

export function CustomerBookingsPage() {
  const { user } = useAuth();
  const { data: bookings = [], loading, reload } = useAsync(() => bookingApi.getForCustomer(user?.id), [user?.id]);
  useBookingRealtime(() => reload(), user?.accountType === 'customer');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [cancelling, setCancelling] = useState('');
  async function cancelBooking(booking) {
    setCancelling(booking.bookingId); setNotice('');
    try { await bookingApi.cancel(booking.bookingId); setNotice(`Booking ${booking.bookingId} cancelled.`); reload(); }
    catch (error) { setNotice(error.message); }
    finally { setCancelling(''); }
  }
  const groups = { all: bookings, upcoming: bookings.filter((b) => !['Service Completed', 'Booking Cancelled', 'Rejected'].includes(b.status)), completed: bookings.filter((b) => b.status === 'Service Completed'), cancelled: bookings.filter((b) => ['Booking Cancelled', 'Rejected'].includes(b.status)) };
  return <section className="fx-page"><PageTitle eyebrow="YOUR FIXIT ACTIVITY" title="My bookings" copy="Keep track of your service requests and completed work." action={<Link to="/providers">Find a professional</Link>} />{notice && <p className={notice.startsWith('Booking ') ? 'fx-success' : 'fx-error'} role="status">{notice}</p>}<div className="fx-filter-tabs" role="tablist" aria-label="Filter bookings">{Object.keys(groups).map((key) => <button role="tab" aria-selected={filter === key} key={key} onClick={() => setFilter(key)}>{key[0].toUpperCase() + key.slice(1)} <span>{groups[key].length}</span></button>)}</div>{loading ? <p className="fx-state">Loading bookings…</p> : groups[filter].length ? <div className="fx-booking-list">{groups[filter].map((booking) => <Card key={booking.bookingId}><BookingRow booking={booking} />{booking.status === 'Service Completed' && <Link className="fx-button fx-button-secondary" to={`/review?bookingId=${booking.bookingId}`}>Write review</Link>}{['Booking Confirmed', 'Professional Assigned'].includes(booking.status) && <Button variant="secondary" disabled={cancelling === booking.bookingId} onClick={() => cancelBooking(booking)}>{cancelling === booking.bookingId ? 'Cancelling…' : 'Cancel booking'}</Button>}</Card>)}</div> : <Card className="fx-empty"><CalendarDays /><h2>{bookings.length ? `No ${filter} bookings` : 'No bookings yet'}</h2><p>Your bookings will appear here.</p><Link to="/providers">Find a local professional</Link></Card>}</section>;
}
