import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, BadgeCheck, CalendarDays, Check, Search, ShieldCheck, Sparkles, Star, Wrench } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge, BookingStepper, BookingSummary, Button, Card, FormInput, PageTitle, ProviderCard, Rating, ServiceCard, StatusTracker } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { useBookingRealtime } from '../hooks/useBookingRealtime';
import { useAsync } from '../hooks/useAsync';
import { bookingApi } from '../services/bookingApi';
import { catalogApi } from '../services/catalogApi';
import { recommendationApi, reviewApi, STORAGE_KEYS } from '../services/mockApi';
import { formatDate, formatMoney } from '../utils/format';

function LoginDestination(user) {
  if (user.accountType === 'admin') return '/admin/dashboard';
  if (user.accountType === 'provider') return '/provider/dashboard';
  return '/dashboard';
}

export function LandingPage() {
  const navigate = useNavigate();
  const { data: services = [] } = useAsync(() => catalogApi.getServices(), []);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  function submit(event) {
    event.preventDefault();
    if (!query.trim()) { setMessage('Enter a service or describe what you need.'); return; }
    navigate(`/providers?search=${encodeURIComponent(query.trim())}`);
  }
  return <>
    <section className="hero" id="top"><div className="hero-shade" /><div className="hero-content"><p className="eyebrow"><span className="eyebrow-dot" />YOUR HOME, IN GOOD HANDS</p><h1>Home repairs,<br /><span>handled.</span></h1><p className="hero-copy">Find trusted local professionals for the things that keep your home running.</p><form className="search-form" onSubmit={submit}><Search aria-hidden="true" /><label className="visually-hidden" htmlFor="home-service-search">What service do you need?</label><input id="home-service-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘leaky faucet’ or ‘deep clean’" /><Button type="submit">Find a pro <ArrowRight size={16} /></Button></form>{message && <p className="search-status" role="alert">{message}</p>}<Link className="smart-assistant-entry" to="/smart-suggestion">Not sure what service you need? <strong>Describe the problem <ArrowRight size={14} /></strong></Link><p className="popular-searches">Popular: {['Plumbing', 'House cleaning', 'Electrical'].map((item) => <button key={item} type="button" onClick={() => navigate(`/providers?search=${encodeURIComponent(item)}`)}>{item}</button>)}</p></div><div className="hero-note"><span className="note-check"><Check /></span><span><strong>Good work, nearby.</strong><br />Trusted pros in your neighborhood</span></div><a className="hero-scroll" href="#services" aria-label="Explore services"><ArrowDown /></a></section>
    <section className="services section-wrap" id="services"><div className="section-heading"><div><p className="eyebrow eyebrow-blue">A BETTER TO-DO LIST STARTS HERE</p><h2>What can we help with?</h2><p className="section-description">Browse help for your home, devices, vehicles, and everyday projects.</p></div><span className="results-count">{services.length} services</span></div><div className="category-grid">{services.slice(0, 9).map((service) => <ServiceCard key={service.id} service={service} onSelect={(item) => navigate(`/providers?serviceId=${item.id}`)} />)}</div></section>
    <section className="trust-band"><div className="trust-inner"><div className="trust-intro"><span className="trust-icon"><ShieldCheck /></span><span><strong>Good people. Good work.</strong><small>A little more peace of mind, built in.</small></span></div><div className="trust-item"><strong>4.9<span>/5</span></strong><small>average pro rating</small></div><div className="trust-item"><strong>12k<span>+</span></strong><small>jobs completed</small></div><div className="trust-item"><strong>100<span>%</span></strong><small>locally focused</small></div></div></section>
    <section className="steps section-wrap" id="how-it-works"><div className="section-heading steps-heading"><div><p className="eyebrow eyebrow-blue">SIMPLE FROM THE START</p><h2>Three steps to done.</h2></div><p className="section-description">No guesswork. Just the right help, right when you need it.</p></div><ol className="steps-list"><li><span className="step-number">01</span><Search /><h3>Tell us what’s up</h3><p>Choose a service and share what you need done.</p></li><li><span className="step-number">02</span><Star /><h3>Meet your match</h3><p>Compare local pros, their work, and real reviews.</p></li><li><span className="step-number">03</span><CalendarDays /><h3>Get it handled</h3><p>Pick a time that works and let the pros take it from here.</p></li></ol></section>
    <section className="pro-banner" id="for-pros"><div className="pro-banner-inner"><div><p className="eyebrow">FOR THE PEOPLE WHO GET IT DONE</p><h2>Great at what you do?<br />Let more people find you.</h2></div><Link className="fx-button fx-button-light" to="/register?role=provider">Join as a provider <ArrowRight size={16} /></Link></div></section>
  </>;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true); setError('');
    try { const user = await login(String(form.get('email')), String(form.get('password'))); navigate(location.state?.from || LoginDestination(user), { replace: true }); }
    catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  }
  return <section className="fx-auth-page"><Card className="fx-auth-card"><p className="fx-eyebrow">WELCOME BACK</p><h1>Log in to FixIt</h1><p className="fx-lede">Pick up where your home service left off.</p><form className="fx-form" onSubmit={submit}><FormInput name="email" label="Email address" type="email" autoComplete="email" required /><FormInput name="password" label="Password" type="password" autoComplete="current-password" required minLength={8} />{error && <p className="fx-error" role="alert">{error}</p>}<Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</Button></form><p className="fx-auth-switch"><Link to="/forgot-password">Forgot password?</Link></p><p className="fx-auth-switch">New to FixIt? <Link to={`/register${searchParams.get('role') ? `?role=${searchParams.get('role')}` : ''}`}>Create an account</Link></p></Card></section>;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerMode = searchParams.get('role') === 'provider';
  const [accountType, setAccountType] = useState(providerMode ? 'provider' : 'customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true); setError('');
    const accountType = String(form.get('accountType'));
    const values = { name: String(form.get('name')), email: String(form.get('email')), password: String(form.get('password')), accountType };
    if (accountType === 'provider') values.profession = String(form.get('profession') || '');
    try { const user = await register(values); navigate(LoginDestination(user), { replace: true }); }
    catch (issue) { setError(issue.details?.map(({ path, message }) => `${path}: ${message}`).join(' ') || issue.message); }
    finally { setLoading(false); }
  }
  return <section className="fx-auth-page"><Card className="fx-auth-card"><p className="fx-eyebrow">GET STARTED</p><h1>Create your FixIt account</h1><p className="fx-lede">One account for the work that keeps life moving.</p><form className="fx-form" onSubmit={submit}><FormInput name="name" label="Full name" autoComplete="name" required minLength={2} /><FormInput name="email" label="Email address" type="email" autoComplete="email" required /><FormInput name="password" label="Password" type="password" autoComplete="new-password" required minLength={8} /><div className="fx-field"><label htmlFor="accountType">Account type</label><select className="fx-input" id="accountType" name="accountType" value={accountType} onChange={(event) => setAccountType(event.target.value)}><option value="customer">Customer</option><option value="provider">Service provider</option></select></div>{accountType === 'provider' && <FormInput name="profession" label="Your profession" required />}{error && <p className="fx-error" role="alert">{error}</p>}<Button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button></form><p className="fx-auth-switch">Already have an account? <Link to="/login">Log in</Link></p></Card></section>;
}

export function ServicesPage() {
  const { data: services = [], loading } = useAsync(() => catalogApi.getServices(), []);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const filtered = services.filter((service) => `${service.name} ${service.category} ${service.detail} ${(service.keywords || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="fx-page"><PageTitle eyebrow="SERVICE DIRECTORY" title="Services" copy="Find the right kind of help for your home and everyday projects." /><div className="fx-toolbar"><FormInput id="service-search" label="Search services" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by service or category" /></div>{loading ? <p className="fx-state">Loading services…</p> : filtered.length ? <div className="fx-service-grid">{filtered.map((service) => <ServiceCard key={service.id} service={service} onSelect={(item) => navigate(`/providers?serviceId=${item.id}`)} />)}</div> : <Card className="fx-empty"><h2>No services found</h2><p>Try another search.</p></Card>}</section>;
}

export function ProvidersPage() {
  const [params] = useSearchParams();
  const initialService = params.get('serviceId') || '';
  const [serviceId, setServiceId] = useState(initialService);
  const [search, setSearch] = useState(params.get('search') || '');
  const [state, setState] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [availableToday, setAvailableToday] = useState(false);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const initialSearch = params.get('search') || '';
  useEffect(() => { catalogApi.getServices().then(setServices); }, []);
  useEffect(() => {
    if (initialService || !initialSearch || !services.length) return;
    const query = initialSearch.toLowerCase().trim();
    const match = services.find((service) => [service.name, service.category, ...(service.keywords || [])].some((term) => term.toLowerCase().includes(query) || query.includes(term.toLowerCase())));
    if (match) { setServiceId(match.id); setSearch(''); }
  }, [initialService, initialSearch, services]);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    catalogApi.getProviders({ serviceId, serviceName: services.find((service) => service.id === serviceId)?.name, search, state, minRating, maxPrice, availableToday }).then((rows) => { if (active) setProviders(rows); }).catch((issue) => { if (active) setError(issue.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [serviceId, search, state, minRating, maxPrice, availableToday, services]);
  function selectProvider(provider, destination) {
    localStorage.setItem(STORAGE_KEYS.selectedProvider, provider.id);
    navigate(destination === 'book' ? `/booking?provider=${provider.id}` : `/provider/${provider.id}`);
  }
  return <section className="fx-page"><PageTitle eyebrow="LOCAL PROFESSIONALS" title={serviceId ? `${services.find((item) => item.id === serviceId)?.name || 'Service'} professionals` : 'Find the right pro'} copy="Compare trusted local professionals, their availability, and starting prices." /><Card className="fx-filter-panel"><FormInput label="Search by name" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. Aarav Patel" /><div className="fx-field"><label htmlFor="state-filter">State</label><select id="state-filter" className="fx-input" value={state} onChange={(event) => setState(event.target.value)}><option value="">All states</option><option>Karnataka</option></select></div><div className="fx-field"><label htmlFor="rating-filter">Minimum rating</label><select id="rating-filter" className="fx-input" value={minRating} onChange={(event) => setMinRating(event.target.value)}><option value="0">Any rating</option><option value="4.5">4.5+</option><option value="4.8">4.8+</option></select></div><div className="fx-field"><label htmlFor="service-filter">Service</label><select id="service-filter" className="fx-input" value={serviceId} onChange={(event) => setServiceId(event.target.value)}><option value="">All services</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><label className="fx-check"><input type="checkbox" checked={availableToday} onChange={(event) => setAvailableToday(event.target.checked)} />Available today</label><FormInput label="Maximum starting price (₹)" type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No limit" /></Card>{error && <p className="fx-error" role="alert">{error}</p>}{loading ? <p className="fx-state">Finding local professionals…</p> : providers.length ? <div className="fx-provider-grid">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} onBook={(item) => selectProvider(item, 'book')} onView={(item) => selectProvider(item, 'view')} />)}</div> : <Card className="fx-empty"><h2>No professionals match those filters</h2><p>Try a broader service, location, or rating.</p><Button variant="secondary" onClick={() => { setSearch(''); setServiceId(''); setState(''); setMinRating('0'); setMaxPrice(''); setAvailableToday(false); }}>Reset filters</Button></Card>}</section>;
}

export function ProviderProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: provider, loading, error } = useAsync(() => catalogApi.getProvider(id), [id]);
  const [saved, setSaved] = useState(() => (JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]')).includes(id));
  const [message, setMessage] = useState('');
  if (loading) return <section className="fx-page"><p className="fx-state">Loading professional…</p></section>;
  if (error || !provider) return <section className="fx-page"><Card className="fx-empty"><h1>Professional not found</h1><Link to="/providers">Browse professionals</Link></Card></section>;
  function toggleFavorite() {
    const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]');
    const next = saved ? favorites.filter((value) => value !== id) : [...favorites, id];
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next)); setSaved(!saved); setMessage(saved ? 'Removed from favorites.' : 'Added to your favorites on this device.');
  }
  return <section className="fx-page"><Card className="fx-profile-card"><div className="fx-profile-cover" /><div className="fx-profile-body"><div className="fx-profile-head"><span className={`fx-avatar fx-avatar-${provider.avatarTone}`} aria-hidden="true">{provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><div className="fx-provider-name"><h1>{provider.name}</h1>{provider.verified && <Badge tone="success"><BadgeCheck size={13} />Verified</Badge>}</div><p>{provider.profession}</p><Rating value={provider.rating} count={provider.reviewCount} /></div><Badge tone={provider.availableToday ? 'success' : 'warm'}>{provider.availableToday ? 'Available today' : 'Next available soon'}</Badge></div><div className="fx-profile-columns"><div><h2>About</h2><p>{provider.about}</p><h2>Services</h2><div className="fx-tags">{provider.services.map((service) => <span key={service}>{service}</span>)}</div><h2>Availability</h2><p>{provider.availableToday ? 'Taking service requests today.' : 'Ask about the next available time when booking.'}</p></div><aside className="fx-profile-aside"><span>Starting price</span><strong>{formatMoney(provider.startingPrice)}</strong><span>Distance</span><strong>{provider.distance} km away</strong><Button onClick={() => { localStorage.setItem(STORAGE_KEYS.selectedProvider, id); navigate(`/booking?provider=${id}`); }}>Book service <ArrowRight size={16} /></Button><Button variant="secondary" aria-pressed={saved} onClick={toggleFavorite}>{saved ? 'Remove from favorites' : 'Add to favorites'}</Button>{message && <p className="fx-success" role="status">{message}</p>}</aside></div><div className="fx-review-list"><h2>Recent reviews</h2>{provider.reviews?.length ? provider.reviews.map((review, index) => <article className="fx-review" key={`${review.reviewer}-${index}`}><strong>{review.reviewer}</strong><Rating value={review.rating} /><p>{review.comment}</p></article>) : <p>No reviews yet.</p>}</div></div></Card></section>;
}

export function SmartSuggestionPage() {
  const { data: services = [] } = useAsync(() => catalogApi.getServices(), []);
  const [description, setDescription] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!description.trim()) { setError('Describe the problem to get a recommendation.'); return; }
    const result = await recommendationApi.recommend(description);
    if (!result) { setError('We could not match that description. Choose a service below.'); setSuggestion(null); return; }
    setSuggestion(result); localStorage.setItem(STORAGE_KEYS.recommendation, JSON.stringify({ ...result, problemDescription: description }));
  }
  return <section className="fx-page fx-recommend-page"><div className="fx-centered-intro"><p className="fx-eyebrow"><Sparkles size={15} /> FIXIT SMART SUGGESTION</p><h1>Not sure who to call?</h1><p>Describe what’s going on. We’ll suggest the right kind of professional to get you started.</p></div><Card className="fx-recommend-card"><div className="fx-recommend-grid"><form className="fx-form" onSubmit={submit}><label className="fx-label" htmlFor="problem-description">What’s the problem?</label><textarea className="fx-input" id="problem-description" rows="5" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="For example: My laptop is not turning on and it is not charging." required /><div className="fx-form-meta"><span>{error && <span className="fx-error" role="alert">{error}</span>}</span><small>{description.length} / 500</small></div><fieldset className="fx-example-list"><legend>Try an example</legend>{['My laptop is not turning on and it is not charging.', 'There is a water leak under my kitchen sink.', 'My ceiling fan stopped working.'].map((example) => <button type="button" key={example} onClick={() => setDescription(example)}>{example.split(' ').slice(0, 4).join(' ')}</button>)}</fieldset><Button type="submit">Suggest a service <ArrowRight size={16} /></Button>{services.length > 0 && <label className="fx-field"><span>Choose a service yourself</span><select className="fx-input" defaultValue="" onChange={(event) => setSuggestion(services.find((service) => service.id === event.target.value) || null)}><option value="">Select a category</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>}</form><aside className="fx-suggestion-result" aria-live="polite">{suggestion ? <><p className="fx-eyebrow">RECOMMENDED SERVICE</p><h2>{suggestion.name}</h2><p>{suggestion.matchedKeywords?.length ? `Matched ${suggestion.matchedKeywords.length} details from your description.` : suggestion.detail}</p><div className="fx-estimate"><span>Estimated cost</span><strong>{formatMoney(suggestion.minCost ?? suggestion.priceFrom)} – {formatMoney(suggestion.maxCost ?? suggestion.priceFrom * 4)}</strong></div><Button onClick={() => navigate(`/providers?serviceId=${suggestion.id}`)}>Find professionals <ArrowRight size={16} /></Button></> : <div className="fx-empty"><span className="fx-icon-tile"><Sparkles /></span><h2>Your suggestion will appear here</h2><p>Tell us a little about the issue and we’ll find a matching service category.</p></div>}</aside></div></Card></section>;
}

export function BookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selectedId = params.get('provider') || localStorage.getItem(STORAGE_KEYS.selectedProvider) || '';
  const { data: provider, loading } = useAsync(() => catalogApi.getProvider(selectedId), [selectedId]);
  const [step, setStep] = useState(1);
  const [service, setService] = useState('');
  const [problem, setProblem] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  useEffect(() => { if (provider) setService(provider.services?.[0] || ''); }, [provider]);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => { const next = new Date(); next.setDate(next.getDate() + index); return next.toISOString().slice(0, 10); }), []);
  const times = ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];
  function continueStep() {
    if (step === 1 && !service) return setError('Choose a service to continue.');
    if (step === 2 && !problem.trim()) return setError('Describe the problem before continuing.');
    if (step === 3 && !date) return setError('Select a date before continuing.');
    if (step === 4 && !time) return setError('Select a time before continuing.');
    setError(''); setStep((value) => value + 1);
  }
  async function confirm() {
    if (!user) {
      navigate('/login', { state: { from: `/booking?provider=${encodeURIComponent(selectedId)}` } });
      return;
    }
    if (user.accountType !== 'customer') { setError('Only customer accounts can create bookings.'); return; }
    setSaving(true); setError('');
    try {
      const serviceId = provider.serviceIds?.[provider.services.indexOf(service)] || '';
      const booking = await bookingApi.create({ providerId: provider.id, serviceId, problem: problem.trim(), date, time });
      localStorage.setItem('fixit.latestBooking', JSON.stringify(booking));
      localStorage.setItem('fixit.latestBookingId', booking.bookingId);
      navigate(`/tracking/${booking.bookingId}`);
    } catch (issue) { setError(issue.message); }
    finally { setSaving(false); }
  }
  if (loading) return <section className="fx-page"><p className="fx-state">Loading booking options…</p></section>;
  if (!provider) return <section className="fx-page"><Card className="fx-empty"><h1>Choose a professional first</h1><p>Select a provider before starting a booking.</p><Button onClick={() => navigate('/providers')}>Browse professionals</Button></Card></section>;
  return <section className="fx-page fx-booking-page"><PageTitle eyebrow="FIXIT SERVICE BOOKING" title="Let’s get it taken care of." copy="Choose a service, tell us what’s going on, and pick a time that works." /><BookingStepper current={step} /><Card className="fx-booking-card"><div className="fx-booking-main"><p className="fx-eyebrow">STEP {String(step).padStart(2, '0')} OF 05</p><h2>{['Choose your service', 'Describe the problem', 'Select a date', 'Select a time', 'Review your booking'][step - 1]}</h2>{step === 1 && <div className="fx-field"><label htmlFor="booking-service">Service</label><select id="booking-service" className="fx-input" value={service} onChange={(event) => setService(event.target.value)}>{provider.services.map((item) => <option key={item}>{item}</option>)}</select><p className="fx-provider-choice">Booking with <strong>{provider.name}</strong></p></div>}{step === 2 && <FormInput as="textarea" id="booking-problem" label="Explain your problem" rows={5} maxLength={500} value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="Share details that will help the professional prepare." />}{step === 3 && <div className="fx-date-grid">{dates.map((item) => <button type="button" key={item} className={date === item ? 'is-selected' : ''} aria-pressed={date === item} onClick={() => setDate(item)}><span>{formatDate(item, { weekday: 'short' })}</span><strong>{formatDate(item, { day: 'numeric' })}</strong><small>{formatDate(item, { month: 'short' })}</small></button>)}</div>}{step === 4 && <div className="fx-time-grid">{times.map((item) => <button type="button" key={item} className={time === item ? 'is-selected' : ''} aria-pressed={time === item} onClick={() => setTime(item)}>{item}</button>)}</div>}{step === 5 && <BookingSummary booking={{ service, provider, date, time, status: 'Booking Confirmed', visitCharge: 99, estimatedCost: provider.startingPrice }} />}{error && <p className="fx-error" role="alert">{error}</p>}<div className="fx-form-actions">{step > 1 && <Button variant="secondary" onClick={() => { setError(''); setStep((value) => value - 1); }}>Back</Button>}{step < 5 ? <Button onClick={continueStep}>Next <ArrowRight size={16} /></Button> : <Button onClick={confirm} disabled={saving}>{saving ? 'Saving…' : 'Confirm booking'} <Check size={16} /></Button>}</div></div><aside className="fx-booking-note"><ShieldCheck size={22} /><strong>Booking with confidence</strong><p>Your request is saved on this device for this prototype. No payment is collected.</p></aside></Card></section>;
}

export function TrackingPage() {
  const { id } = useParams();
  const { data: booking, loading, error, reload } = useAsync(() => bookingApi.getById(id), [id]);
  const [liveUpdate, setLiveUpdate] = useState(false);
  useBookingRealtime((event) => {
    if (event.bookingId && event.bookingId !== id) return;
    if (event.status) setLiveUpdate(true);
    reload();
  });
  if (loading) return <section className="fx-page"><p className="fx-state">Loading booking…</p></section>;
  if (error || !booking) return <section className="fx-page"><Card className="fx-empty"><h1>Booking not found</h1><Link to="/bookings">View your bookings</Link></Card></section>;
  return <section className="fx-page"><PageTitle eyebrow="FIXIT BOOKING" title="Track your service" copy={`Booking ID ${booking.bookingId}`} /><div className="fx-tracking-grid"><Card><BookingSummary booking={booking} /><div className="fx-tracking-head"><div><p className="fx-eyebrow">SERVICE PROGRESS</p><h2>Booking status</h2>{liveUpdate && <p className="fx-success" role="status">Status updated live.</p>}</div></div><StatusTracker status={booking.status} />{booking.status === 'Service Completed' && <Link className="fx-button fx-button-primary" to={`/review?bookingId=${booking.bookingId}`}>Write a review</Link>}</Card><Card className="fx-profile-aside"><p className="fx-eyebrow">YOUR PROFESSIONAL</p><span className="fx-avatar fx-avatar-blue">{booking.provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><h2>{booking.provider.name}</h2><p>{booking.service}</p><Rating value={4.9} /></Card></div></section>;
}

export function ReviewPage() {
  const [params] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  useEffect(() => {
    let active = true;
    const id = params.get('bookingId');
    if (!id) { setBooking(null); return () => { active = false; }; }
    bookingApi.getById(id).then((item) => { if (active) setBooking(item?.status === 'Service Completed' ? item : null); }).catch(() => { if (active) setBooking(null); });
    return () => { active = false; };
  }, [params]);
  async function submit(event) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try { await reviewApi.create({ booking, rating: form.get('rating'), sentiment: form.get('sentiment'), comment: form.get('comment'), customerId: user?.id || booking.customer?.customerId }); setSuccess('Thanks. Your review has been saved on this device.'); }
    catch (issue) { setError(issue.message); }
  }
  if (!booking) return <section className="fx-page"><Card className="fx-empty"><h1>No completed booking found</h1><p>Complete a service booking before writing a review.</p><Link to="/bookings">View bookings</Link></Card></section>;
  return <section className="fx-page fx-review-page"><Card className="fx-auth-card"><p className="fx-eyebrow">YOUR FEEDBACK</p><h1>How was your service?</h1><p className="fx-lede">Review your service with <strong>{booking.provider.name}</strong>.</p><form className="fx-form" onSubmit={submit}><fieldset className="fx-rating-field"><legend>Your rating</legend><div>{[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" name="rating" value={value} required /><span aria-hidden="true">★</span><span className="visually-hidden">{value} stars</span></label>)}</div></fieldset><fieldset className="fx-field"><legend>Overall experience</legend><div className="fx-chip-row">{['Excellent', 'Good', 'Average', 'Poor'].map((value) => <label key={value}><input type="radio" name="sentiment" value={value} required /><span>{value}</span></label>)}</div></fieldset><FormInput as="textarea" name="comment" label="Your review" rows={5} required maxLength={1000} />{error && <p className="fx-error" role="alert">{error}</p>}{success && <p className="fx-success" role="status">{success}</p>}<Button type="submit">Submit review</Button></form></Card></section>;
}
