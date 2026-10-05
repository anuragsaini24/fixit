import { useEffect, useRef } from 'react';
import { ArrowRight, BadgeCheck, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatMoney, statusLabel } from '../utils/format';

export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={`fx-button fx-button-${variant} ${className}`.trim()} {...props}>{children}</button>;
}

export function Card({ children, className = '', ...props }) {
  return <section className={`fx-card ${className}`.trim()} {...props}>{children}</section>;
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`fx-badge fx-badge-${tone}`}>{children}</span>;
}

export function Rating({ value = 0, count }) {
  return <span className="fx-rating"><Star size={15} fill="currentColor" aria-hidden="true" /><strong>{Number(value).toFixed(1)}</strong>{count !== undefined && <span>{count} reviews</span>}</span>;
}

export function FormInput({ label, error, hint, as = 'input', id, ...props }) {
  const controlId = id || props.name;
  const Element = as;
  return <div className="fx-field">
    <label htmlFor={controlId}>{label}</label>
    <Element id={controlId} className="fx-input" aria-invalid={Boolean(error)} aria-describedby={[hint && `${controlId}-hint`, error && `${controlId}-error`].filter(Boolean).join(' ') || undefined} {...props} />
    {hint && <small id={`${controlId}-hint`} className="fx-hint">{hint}</small>}
    {error && <small id={`${controlId}-error`} className="fx-error" role="alert">{error}</small>}
  </div>;
}

export function ServiceCard({ service, onSelect }) {
  const content = <><span className="fx-icon-tile">{service.icon || '✦'}</span><span className="fx-card-copy"><strong>{service.name}</strong><small>{service.detail || service.category}</small></span><ArrowRight size={17} aria-hidden="true" /></>;
  if (onSelect) return <button className="fx-service-card" type="button" onClick={() => onSelect(service)}>{content}</button>;
  return <Link className="fx-service-card" to={`/providers?service=${encodeURIComponent(service.id)}`}>{content}</Link>;
}

export function ProviderCard({ provider, onBook, onView }) {
  return <article className="fx-provider-card">
    <div className="fx-provider-top">
      <span className={`fx-avatar fx-avatar-${provider.avatarTone || 'blue'}`} aria-hidden="true">{provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
      <div className="fx-provider-identity"><div className="fx-provider-name"><h2>{provider.name}</h2>{provider.verified && <Badge tone="success"><BadgeCheck size={13} />Verified</Badge>}</div><p>{provider.profession}</p></div>
      <Badge tone={provider.availableToday ? 'success' : 'warm'}>{provider.availableToday ? 'Available today' : 'Next available soon'}</Badge>
    </div>
    <div className="fx-provider-meta"><Rating value={provider.rating} count={provider.reviewCount} /><span>{provider.experience} yrs experience</span><span>{provider.distance} km away</span></div>
    <p className="fx-provider-about">{provider.about}</p>
    <div className="fx-tags">{(provider.services || []).slice(0, 3).map((service) => <span key={service}>{service}</span>)}</div>
    <div className="fx-provider-foot"><p>Starting at<strong>{formatMoney(provider.startingPrice)}</strong></p><div className="fx-actions"><Button variant="secondary" onClick={() => onView?.(provider)}>View profile</Button><Button onClick={() => onBook?.(provider)}>Book now <ArrowRight size={15} /></Button></div></div>
  </article>;
}

export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="fx-modal" onClose={onClose} aria-labelledby="fx-modal-title">
    <div className="fx-modal-head"><h2 id="fx-modal-title">{title}</h2><Button variant="icon" aria-label="Close dialog" onClick={onClose}><X size={18} /></Button></div>
    {children}
  </dialog>;
}

const steps = ['Service', 'Problem', 'Date', 'Time', 'Summary'];
export function BookingStepper({ current }) {
  return <ol className="fx-stepper" aria-label="Booking progress">{steps.map((step, index) => <li key={step} className={index + 1 === current ? 'is-current' : index + 1 < current ? 'is-complete' : ''} aria-current={index + 1 === current ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol>;
}

const bookingStatuses = ['Booking Confirmed', 'Professional Assigned', 'Professional On The Way', 'Service Started', 'Service Completed'];
export function StatusTracker({ status }) {
  const isCancelled = status === 'Booking Cancelled' || status === 'Rejected';
  const activeIndex = bookingStatuses.indexOf(status);
  return <ol className="fx-status-tracker">{bookingStatuses.map((item, index) => <li key={item} className={index < activeIndex ? 'is-complete' : index === activeIndex ? 'is-active' : ''} aria-current={index === activeIndex ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item}</strong><small>{index === activeIndex ? 'Current booking status' : statusLabel(item)}</small></div></li>)}{isCancelled && <li className="is-cancelled"><span>!</span><div><strong>{status}</strong><small>This booking is no longer active.</small></div></li>}</ol>;
}

export function PageTitle({ eyebrow, title, copy, action }) {
  return <div className="fx-page-title"><div><p className="fx-eyebrow">{eyebrow}</p><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>;
}

export function BookingSummary({ booking }) {
  return <dl className="fx-summary">{[['Service', booking.service], ['Provider', booking.provider?.name], ['Date', formatDate(booking.date)], ['Time', booking.time], ['Status', statusLabel(booking.status)], ['Estimate', formatMoney(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0))]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>;
}
