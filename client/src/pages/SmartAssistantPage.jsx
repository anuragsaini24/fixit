import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, RotateCcw, ShieldAlert, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { catalogApi } from '../services/catalogApi';
import { agentSessionApi } from '../services/agentSessionApi';
import '../assets/smartAssistant.css';

const EXAMPLES = [
  'My AC is running but it is not cooling properly and it is making a strange noise.',
  'There is a water leak under my kitchen sink.',
  'My ceiling fan stopped working and I noticed sparks near the switch.',
];

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function SmartAssistantPage() {
  const { data: services = [] } = useAsync(() => catalogApi.getServices(), []);
  const [description, setDescription] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [agentResponse, setAgentResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const descriptionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('fixit.agentSessionId');
    if (!storedSessionId) return undefined;
    let active = true;
    setSessionId(storedSessionId);
    agentSessionApi.get(storedSessionId).then((result) => {
      if (!active) return;
      setMessages(result.messages || []);
      setAgentResponse(result);
    }).catch((issue) => {
      sessionStorage.removeItem('fixit.agentSessionId');
      if (!active) return;
      setSessionId('');
      setError(issue.message || 'Your assistant session has expired. Start a new conversation.');
    });
    return () => { active = false; };
  }, []);

  async function sendMessage(text = description) {
    if (!text.trim()) {
      setError('Describe the problem or answer the assistant question.');
      descriptionRef.current?.focus();
      return;
    }
    setLoading(true);
    setError('');
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const created = await agentSessionApi.create();
        activeSessionId = created.sessionId;
        setSessionId(activeSessionId);
        sessionStorage.setItem('fixit.agentSessionId', activeSessionId);
      }
      const result = await agentSessionApi.sendMessage(activeSessionId, text.trim());
      setAgentResponse(result);
      setMessages(result.messages || []);
      if (result.recommendation) {
        localStorage.setItem('fixit.recommendedService', JSON.stringify({ ...result.recommendation, problemDescription: result.detectedProblem?.description || text.trim() }));
      }
      setDescription('');
    } catch (issue) {
      setError(issue.message || 'The assistant could not analyze this problem. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function selectService(event) {
    const serviceId = event.target.value;
    if (!serviceId) return;
    const service = services.find((item) => item.id === serviceId);
    if (service) void sendMessage(description.trim() || `I need help with ${service.name}.`);
  }

  function findProfessionals() {
    const serviceId = agentResponse?.recommendation?.service?.id;
    if (serviceId) navigate(`/providers?serviceId=${encodeURIComponent(serviceId)}`);
  }

  function bookService() {
    if (!agentResponse?.recommendation) return;
    const provider = agentResponse.recommendation.provider;
    if (!provider) {
      findProfessionals();
      return;
    }
    localStorage.setItem('fixit.selectedProviderId', provider.id);
    navigate(`/booking?provider=${encodeURIComponent(provider.id)}`);
  }

  function tryAgain() {
    setSessionId('');
    sessionStorage.removeItem('fixit.agentSessionId');
    setMessages([]);
    setAgentResponse(null);
    localStorage.removeItem('fixit.recommendedService');
    setError('');
    descriptionRef.current?.focus();
  }

  const recommendation = agentResponse?.recommendation;
  const analysis = recommendation ? {
    serviceId: recommendation.service.id,
    serviceCategory: recommendation.service.name,
    problemSummary: agentResponse.detectedProblem?.description || '',
    possibleIssues: recommendation.possibleIssues || [],
    urgency: recommendation.urgency || 'Medium',
    confidence: recommendation.confidence || 'Medium',
    estimatedCostRange: recommendation.estimatedCost,
    recommendedProviderType: recommendation.provider.profession,
    providerRecommendations: [{ ...recommendation.provider, reason: recommendation.provider.reason || 'Recommended based on service match and profile details.' }],
    safetyAdvice: recommendation.safetyAdvice || '',
    priceDisclaimer: recommendation.estimatedCost.disclaimer,
    analysisSource: 'agent',
  } : null;

  return <section className="fx-page fx-smart-assistant">
    <header className="fx-smart-intro">
      <p className="fx-smart-eyebrow"><Sparkles size={16} /> FIXIT SMART ASSISTANT</p>
      <h1>Tell us what’s going on.</h1>
      <p>Get a service suggestion and a starting estimate. A professional will confirm the issue and final price.</p>
    </header>

    <div className="fx-smart-layout">
      <form className="fx-smart-form" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
        <label htmlFor="smart-problem">Describe the problem</label>
        <textarea ref={descriptionRef} id="smart-problem" maxLength={1000} rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={sessionId ? 'Answer the assistant question or add another detail.' : 'For example: My AC is running but it is not cooling properly and it is making a strange noise.'} />
        <div className="fx-smart-form-meta">
          {error ? <span className="fx-smart-error" role="alert">{error}</span> : <span>Describe what you noticed; don’t worry about naming the service.</span>}
          <small>{description.length} / 1000</small>
        </div>
        <div className="fx-smart-examples">
          <span>Try an example</span>
          {EXAMPLES.map((example) => <button type="button" key={example} onClick={() => setDescription(example)}>{example}</button>)}
        </div>
        <Button type="submit" disabled={loading || Boolean(agentResponse?.requiresApproval)}>{loading ? 'Thinking…' : sessionId ? 'Send reply' : 'Start assistant'} <ArrowRight size={16} /></Button>
        {services.length > 0 && <label className="fx-smart-select-label" htmlFor="smart-service">Or choose a service yourself</label>}
        {services.length > 0 && <select id="smart-service" className="fx-smart-select" defaultValue="" onChange={selectService} disabled={loading}>
          <option value="">Select a service</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>}
      </form>

      <section className="fx-smart-result" aria-live="polite" aria-busy={loading}>
        {analysis ? <>
          <div className="fx-smart-result-heading"><span className="fx-smart-result-icon"><Sparkles size={19} /></span><div><p className="fx-smart-eyebrow">PROBLEM UNDERSTANDING</p><p className="fx-smart-summary">{analysis.problemSummary}</p></div></div>
          <div className="fx-smart-service-line"><span>Recommended service</span><h2>{analysis.serviceCategory}</h2></div>
          <div className="fx-smart-metrics">
            <div><span>Urgency</span><strong className={`fx-smart-urgency fx-smart-urgency-${analysis.urgency.toLowerCase()}`}>{analysis.urgency}</strong></div>
            <div><span>Confidence</span><strong>{analysis.confidence}</strong></div>
            <div><span>Estimated price</span><strong>{formatPrice(analysis.estimatedCostRange.min)} – {formatPrice(analysis.estimatedCostRange.max)}</strong></div>
          </div>
          <div className="fx-smart-issues"><h3>Possible issues, not a definitive diagnosis</h3><ul>{analysis.possibleIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>
          {analysis.safetyAdvice && <p className="fx-smart-safety"><ShieldAlert size={18} />{analysis.safetyAdvice}</p>}
          <p className="fx-smart-disclaimer">{analysis.priceDisclaimer}</p>
          <div className="fx-smart-provider-heading"><div><span>Recommended professional</span><strong>{analysis.recommendedProviderType}</strong></div><span className="fx-smart-count">{analysis.providerRecommendations.length} matches</span></div>
          {analysis.providerRecommendations.length > 0 ? <div className="fx-smart-providers">
            {analysis.providerRecommendations.map((provider) => <article className="fx-smart-provider" key={provider.id}>
              <div className="fx-smart-provider-top"><div><h3>{provider.name}</h3><p>{provider.profession}</p></div><span className="fx-smart-rating"><Star size={14} fill="currentColor" /> {provider.rating.toFixed(1)}</span></div>
              <div className="fx-smart-provider-facts"><span><CalendarDays size={14} />{provider.availableToday ? 'Available today' : 'Availability varies'}</span><span><MapPin size={14} />{provider.distance ? `${provider.distance} km away` : 'Distance not listed'}</span><span>{provider.experience} yrs · {provider.reviewCount} reviews · from {formatPrice(provider.startingPrice)}</span></div>
              <p className="fx-smart-reason">{provider.reason}</p>
            </article>)}
          </div> : <p className="fx-smart-no-providers">No professionals are listed for this service yet. You can still browse the service directory.</p>}
          <div className="fx-smart-actions"><Button onClick={findProfessionals}>Find Professionals <ArrowRight size={16} /></Button><Button variant="secondary" onClick={bookService}>Book Service <CalendarDays size={16} /></Button><button type="button" className="fx-smart-retry" onClick={tryAgain}><RotateCcw size={15} /> Try Again</button></div>
          <p className="fx-smart-source">{analysis.analysisSource === 'agent' ? 'FixIt Agent recommendation · approval required' : analysis.analysisSource === 'ai' ? 'AI-assisted suggestion' : analysis.analysisSource === 'manual' ? 'Service selected by you' : 'Keyword-based fallback suggestion'}</p>
        </> : messages.length ? <div className="fx-smart-chat">
          <p className="fx-smart-eyebrow">CONVERSATION · {agentResponse?.state?.replaceAll('_', ' ')}</p>
          {messages.map((item, index) => <article className={`fx-smart-chat-message fx-smart-chat-${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'assistant' ? 'FixIt Assistant' : 'You'}</span><p>{item.content}</p></article>)}
          {agentResponse?.requiresApproval && <p className="fx-smart-approval-note">Recommendation ready. Review it above; no booking has been created.</p>}
        </div> : <div className="fx-smart-empty"><span className="fx-smart-result-icon"><Sparkles size={19} /></span><h2>Your conversation will appear here</h2><p>Describe the issue and the assistant will ask for any details it needs.</p></div>}
      </section>
    </div>
  </section>;
}