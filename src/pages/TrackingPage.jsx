import React, { useState, useRef } from 'react';
import {
  Search, Loader2, Copy, CheckCircle2, ArrowRight,
  MapPin, MessageCircle, ExternalLink, AlertCircle, Clock
} from 'lucide-react';
import axios from 'axios';
import OrderLifecycleTracker from '../components/shared/OrderLifecycleTracker';
import StatusBadge from '../components/shared/StatusBadge';

const API = 'http://localhost:5000/api';

const statusColors = {
  'Booked': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Pickup Assigned': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Picked Up': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'In Transit': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'At Destination Hub': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Out for Delivery': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Delivered': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Failed / Returned': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusDot = {
  'Booked': 'bg-blue-400',
  'Pickup Assigned': 'bg-purple-400',
  'Picked Up': 'bg-indigo-400',
  'In Transit': 'bg-yellow-400',
  'At Destination Hub': 'bg-orange-400',
  'Out for Delivery': 'bg-cyan-400',
  'Delivered': 'bg-green-400',
  'Failed / Returned': 'bg-red-400',
};

const formatTs = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const TrackingPage = () => {
  const [trackingInput, setTrackingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef();

  const handleTrack = async (e) => {
    e?.preventDefault();
    const id = trackingInput.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setVisible(false);

    try {
      const res = await axios.get(`${API}/orders/track/${id}`);
      setOrder(res.data);
      // Trigger animation
      setTimeout(() => setVisible(true), 50);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No shipment found with this tracking ID. Please check and try again.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(order?.trackingId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reverse statusHistory to show most recent first
  const timeline = order?.statusHistory
    ? [...order.statusHistory].reverse()
    : [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Minimal Navbar */}
      <nav style={{ background: '#0d1220', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="https://curozip.com" target="_blank" rel="noopener noreferrer">
          <img src="https://finixia.in/logo%27s/curozip.png?v=1.4" alt="Curozip" style={{ height: 32, objectFit: 'contain' }} />
        </a>
        <a
          href="https://curozip.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: '1px solid #1e293b',
            color: '#9ca3af', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#374151'; }}
          onMouseLeave={e => { e.target.style.color = '#9ca3af'; e.target.style.borderColor = '#1e293b'; }}
        >
          <ExternalLink size={14} />
          Back to curozip.com
        </a>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Track Your Parcel
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Enter your tracking ID for real-time updates on your shipment
          </p>
        </div>

        {/* Search Card */}
        <div style={{ background: '#111827', borderRadius: 20, padding: 32, border: '1px solid #1f2937', marginBottom: 28 }}>
          <form onSubmit={handleTrack}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                ref={inputRef}
                type="text"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value.toUpperCase())}
                placeholder="e.g. CZ202411230001"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0a0e1a', border: '1.5px solid #1f2937',
                  borderRadius: 12, padding: '14px 16px 14px 44px',
                  color: '#fff', fontSize: 17, fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none', letterSpacing: 1,
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = '#1f2937'}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !trackingInput.trim()}
              style={{
                width: '100%', height: 52, borderRadius: 12,
                background: loading || !trackingInput.trim() ? '#374151' : '#f97316',
                color: '#fff', fontWeight: 700, fontSize: 16,
                border: 'none', cursor: loading || !trackingInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s'
              }}
            >
              {loading ? <><Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Tracking...</> : 'Track Now'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, background: '#450a0a', border: '1px solid #dc2626', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#fca5a5', fontSize: 14, margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Results — animate in */}
        {order && (
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease'
          }}>
            {/* Block A: Status Card */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 6px', fontWeight: 700 }}>Tracking ID</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#f97316', fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>
                      {order.trackingId}
                    </span>
                    <button
                      onClick={copyTrackingId}
                      title="Copy"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : '#6b7280', display: 'flex', alignItems: 'center' }}
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={order.status} />
                  <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
                    Last updated: {formatTs(order.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Block B: Lifecycle Tracker */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #1f2937' }}>
                <p style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 0 }}>Shipment Progress</p>
              </div>
              <OrderLifecycleTracker currentStatus={order.status} />
            </div>

            {/* Block C: Route */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, margin: '0 0 6px' }}>FROM</p>
                  <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{order.pickup?.city || '—'}</p>
                  {order.pickup?.pincode && (
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{order.pickup.pincode}</p>
                  )}
                </div>
                <ArrowRight size={22} style={{ color: '#374151', flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <p style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, margin: '0 0 6px' }}>TO</p>
                  <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{order.delivery?.city || '—'}</p>
                  {order.delivery?.pincode && (
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{order.delivery.pincode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Block D: Shipment Journey Timeline */}
            {timeline.length > 0 && (
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <p style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 20px' }}>Shipment Journey</p>
                <div style={{ position: 'relative' }}>
                  {/* Vertical connecting line */}
                  <div style={{
                    position: 'absolute', left: 7, top: 8, bottom: 0,
                    width: 2, background: '#1f2937'
                  }} />
                  <div className="space-y-6">
                    {timeline.map((entry, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          background: i === 0 ? (statusDot[entry.status] || '#f97316') : '#374151',
                          border: i === 0 ? '2px solid ' + (statusDot[entry.status]?.replace('bg-', '') || '#f97316') : '2px solid #4b5563',
                          zIndex: 1, boxShadow: i === 0 ? '0 0 0 4px rgba(249,115,22,0.15)' : 'none'
                        }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ color: i === 0 ? '#fff' : '#9ca3af', fontWeight: i === 0 ? 700 : 500, fontSize: 14, margin: '0 0 2px' }}>
                            {entry.status}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} style={{ color: '#6b7280' }} />
                            <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>{formatTs(entry.timestamp)}</p>
                          </div>
                          {entry.note && (
                            <p style={{ color: '#6b7280', fontSize: 12, fontStyle: 'italic', margin: '4px 0 0' }}>
                              {entry.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 24, textAlign: 'center', marginTop: 8 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Need help with your shipment?</p>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>Contact support@curozip.com</p>
              <a
                href="https://wa.me/919181057123"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#16a34a', color: '#fff',
                  padding: '10px 24px', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
              >
                <MessageCircle size={18} />
                WhatsApp Support
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default TrackingPage;
