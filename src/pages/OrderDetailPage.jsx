import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Package, MapPin, User, Truck,
  AlertCircle, Clock, Loader2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import StatusBadge from '../components/shared/StatusBadge';
import OrderLifecycleTracker from '../components/shared/OrderLifecycleTracker';
import SelectDropdown from '../components/shared/SelectDropdown';

const API = 'https://curozip-admin.onrender.com/api';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Hub role → allowed next statuses
const PICKUP_TRANSITIONS = {
  'Booked': ['Pickup Assigned'],
  'Pickup Assigned': ['Picked Up'],
  'Picked Up': ['In Transit'],
};

const DELIVERY_TRANSITIONS = {
  'In Transit': ['At Destination Hub'],
  'At Destination Hub': ['Out for Delivery'],
  'Out for Delivery': ['Delivered', 'Failed / Returned'],
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-cz-text-secondary text-xs font-medium">{label}</p>
    <p className="text-white text-sm font-medium">{value || '—'}</p>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-cz-card-bg rounded-xl border border-cz-border p-5 ${className}`}>
    {title && (
      <h3 className="flex items-center gap-2 text-white font-semibold mb-4">
        {Icon && <Icon size={16} className="text-cz-accent-orange" />}
        {title}
      </h3>
    )}
    {children}
  </div>
);

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, hubId } = useAuth();
  const { addToast } = useToast();

  const myHubId = typeof hubId === 'object' ? hubId?._id : hubId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Assignment state
  const [vendorOptions, setVendorOptions] = useState([]);
  const [pickupPartnerOptions, setPickupPartnerOptions] = useState([]);
  const [deliveryPartnerOptions, setDeliveryPartnerOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [assignVendorId, setAssignVendorId] = useState('');
  const [assignPickupId, setAssignPickupId] = useState('');
  const [assignDeliveryId, setAssignDeliveryId] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  // Status update state
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders/${id}`, { headers });
      setOrder(res.data);
    } catch (e) {
      addToast('Failed to load order', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Fetch assignment options when order loads
  useEffect(() => {
    if (!order || !myHubId) return;

    // Pre-populate current assignments
    setAssignVendorId(order.assignedVendorId?._id || '');
    setAssignPickupId(order.assignedPickupPartnerId?._id || '');
    setAssignDeliveryId(order.assignedDeliveryPartnerId?._id || '');

    const fromCity = order.pickup?.city;
    const toCity = order.delivery?.city;
    const destHubId = order.destinationHubId?._id || order.destinationHubId;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [vendorRes, pickupRes, deliveryRes] = await Promise.all([
          axios.get(`${API}/vendors/by-route?fromCity=${fromCity}&toCity=${toCity}`, { headers }),
          axios.get(`${API}/users/delivery-partners/${myHubId}`, { headers }),
          destHubId
            ? axios.get(`${API}/users/delivery-partners/${destHubId}`, { headers })
            : Promise.resolve({ data: [] }),
        ]);
        setVendorOptions(
          (vendorRes.data || []).map(v => ({ value: v._id, label: `${v.name} · ${v.vehicleType}` }))
        );
        setPickupPartnerOptions(
          (pickupRes.data || []).map(p => ({ value: p._id, label: p.name }))
        );
        setDeliveryPartnerOptions(
          (deliveryRes.data || []).map(p => ({ value: p._id, label: p.name }))
        );
      } catch (e) {
        addToast('Failed to load assignment options', 'warning');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [order]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order?.trackingId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hub role detection
  const pickupHubId = order?.pickupHubId?._id || order?.pickupHubId;
  const destHubId = order?.destinationHubId?._id || order?.destinationHubId;
  const isPickupHub = pickupHubId === myHubId;
  const isDestHub = destHubId === myHubId;
  const isBothHubs = isPickupHub && isDestHub;

  const hubRoleLabel = isBothHubs
    ? 'Both Hubs'
    : isPickupHub
    ? 'Pickup Hub'
    : isDestHub
    ? 'Destination Hub'
    : 'Observer';

  // Compute allowed status transitions
  const getAllowedTransitions = () => {
    if (!order) return [];
    const curr = order.status;
    const results = new Set();
    if (isPickupHub && PICKUP_TRANSITIONS[curr]) {
      PICKUP_TRANSITIONS[curr].forEach(s => results.add(s));
    }
    if (isDestHub && DELIVERY_TRANSITIONS[curr]) {
      DELIVERY_TRANSITIONS[curr].forEach(s => results.add(s));
    }
    return Array.from(results);
  };

  const allowedTransitions = getAllowedTransitions();

  const handleSaveAssignments = async () => {
    setSavingAssign(true);
    try {
      const origVendorId = order?.assignedVendorId?._id || '';
      const origPickupId = order?.assignedPickupPartnerId?._id || '';
      const origDeliveryId = order?.assignedDeliveryPartnerId?._id || '';

      const calls = [];
      if (assignVendorId && assignVendorId !== origVendorId)
        calls.push(axios.put(`${API}/orders/${id}/assign-vendor`, { vendorId: assignVendorId }, { headers }));
      if (assignPickupId && assignPickupId !== origPickupId)
        calls.push(axios.put(`${API}/orders/${id}/assign-pickup-partner`, { partnerId: assignPickupId }, { headers }));
      if (assignDeliveryId && assignDeliveryId !== origDeliveryId)
        calls.push(axios.put(`${API}/orders/${id}/assign-delivery-partner`, { partnerId: assignDeliveryId }, { headers }));

      if (calls.length === 0) {
        addToast('No changes to save', 'info');
        setSavingAssign(false);
        return;
      }

      for (const call of calls) await call;
      addToast('Assignments saved successfully', 'success');
      fetchOrder();
    } catch (e) {
      addToast(e?.response?.data?.message || 'Failed to save assignments', 'error');
    } finally {
      setSavingAssign(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!nextStatus) return;
    setSavingStatus(true);
    try {
      await axios.put(`${API}/orders/${id}/status`, { status: nextStatus, note: statusNote }, { headers });
      addToast(`Status updated to "${nextStatus}"`, 'success');
      setNextStatus('');
      setStatusNote('');
      fetchOrder();
    } catch (e) {
      addToast(e?.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-cz-text-secondary">
        <Loader2 size={22} className="animate-spin text-cz-accent-orange" />
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24 text-cz-text-secondary">
        Order not found.{' '}
        <Link to="/orders" className="text-cz-accent-orange hover:underline">← Back to Orders</Link>
      </div>
    );
  }

  const destCity = order.destinationHubId?.city || order.delivery?.city;

  return (
    <div className="space-y-6 pb-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className="p-2 rounded-lg bg-cz-card-bg border border-cz-border text-cz-text-secondary hover:text-white hover:border-white/30 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white font-mono">{order.trackingId}</h1>
              <button
                onClick={handleCopyId}
                className="text-cz-text-secondary hover:text-cz-accent-orange transition-colors"
                title="Copy tracking ID"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-cz-text-secondary text-sm mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── LIFECYCLE TRACKER ── */}
      <SectionCard>
        <OrderLifecycleTracker currentStatus={order.status} />
      </SectionCard>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Route + Customer + Package */}
        <div className="lg:col-span-2 space-y-5">

          {/* Route Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard title="Pickup" icon={MapPin}>
              <div className="space-y-3">
                <InfoRow label="Name" value={order.pickup?.name} />
                <InfoRow label="Phone" value={order.pickup?.phone} />
                <InfoRow label="City" value={order.pickup?.city} />
                <InfoRow label="Address" value={order.pickup?.address} />
                <InfoRow label="Pincode" value={order.pickup?.pincode} />
                <InfoRow label="Hub" value={order.pickupHubId?.name} />
              </div>
            </SectionCard>

            <SectionCard title="Delivery" icon={MapPin}>
              <div className="space-y-3">
                <InfoRow label="Name" value={order.delivery?.name} />
                <InfoRow label="Phone" value={order.delivery?.phone} />
                <InfoRow label="City" value={order.delivery?.city} />
                <InfoRow label="Address" value={order.delivery?.address} />
                <InfoRow label="Pincode" value={order.delivery?.pincode} />
                <InfoRow label="Hub" value={order.destinationHubId?.name} />
              </div>
            </SectionCard>
          </div>

          {/* Customer & Package */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard title="Customer" icon={User}>
              <div className="space-y-3">
                <InfoRow label="Name" value={order.customerName} />
                <InfoRow label="Phone" value={order.customerPhone} />
              </div>
            </SectionCard>

            <SectionCard title="Parcel" icon={Package}>
              <div className="space-y-3">
                <InfoRow label="Weight" value={order.parcel?.weight ? `${order.parcel.weight} kg` : null} />
                <InfoRow
                  label="Dimensions"
                  value={
                    order.parcel?.dimensions
                      ? `${order.parcel.dimensions.l}×${order.parcel.dimensions.w}×${order.parcel.dimensions.h} cm`
                      : null
                  }
                />
                <InfoRow label="Description" value={order.parcel?.description} />
                <InfoRow label="Amount" value={order.amount ? `₹${order.amount}` : null} />
              </div>
            </SectionCard>
          </div>

          {/* Status History */}
          <SectionCard title="Status History" icon={Clock}>
            {(!order.statusHistory || order.statusHistory.length === 0) ? (
              <p className="text-cz-text-secondary text-sm">No history available.</p>
            ) : (
              <div className="space-y-4">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-cz-accent-orange mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={h.status} />
                        <span className="text-cz-text-secondary text-xs">{formatDate(h.timestamp)}</span>
                        {h.updatedByName && (
                          <span className="text-cz-text-secondary text-xs">· by {h.updatedByName}</span>
                        )}
                      </div>
                      {h.note && <p className="text-cz-text-secondary text-xs mt-1 italic">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT: Assignments + Status Update */}
        <div className="space-y-5">

          {/* Assignment Block */}
          <SectionCard title="Assignments" icon={Truck}>
            <div className="space-y-4">
              {/* Vendor */}
              <div>
                <p className="text-cz-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Fleet Vendor</p>
                {vendorOptions.length === 0 && !loadingOptions ? (
                  <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} />
                    No vendors for this route — contact admin
                  </div>
                ) : (
                  <SelectDropdown
                    options={vendorOptions}
                    value={assignVendorId}
                    onChange={setAssignVendorId}
                    searchable
                    placeholder="Select vendor…"
                    loading={loadingOptions}
                  />
                )}
              </div>

              {/* Pickup Partner */}
              <div>
                <p className="text-cz-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Pickup Partner</p>
                <SelectDropdown
                  options={pickupPartnerOptions}
                  value={assignPickupId}
                  onChange={setAssignPickupId}
                  searchable
                  placeholder="Select pickup partner…"
                  loading={loadingOptions}
                />
              </div>

              {/* Delivery Partner */}
              <div>
                <p className="text-cz-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Delivery Partner</p>
                <SelectDropdown
                  options={deliveryPartnerOptions}
                  value={assignDeliveryId}
                  onChange={setAssignDeliveryId}
                  searchable
                  placeholder="Select delivery partner…"
                  loading={loadingOptions}
                />
                {destCity && (
                  <p className="text-cz-text-secondary text-xs italic mt-1.5">
                    Partners at destination hub ({destCity})
                  </p>
                )}
              </div>

              <button
                onClick={handleSaveAssignments}
                disabled={savingAssign}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cz-accent-orange text-white rounded-lg font-semibold text-sm hover:bg-[#ea6c0a] transition-colors disabled:opacity-60"
              >
                {savingAssign && <Loader2 size={14} className="animate-spin" />}
                {savingAssign ? 'Saving…' : 'Save Assignments'}
              </button>
            </div>
          </SectionCard>

          {/* Status Update Block */}
          <SectionCard title="Update Status" icon={CheckCircle2}>
            {/* Info Banner */}
            <div
              className="mb-4 flex items-start gap-3 rounded-lg px-4 py-3"
              style={{
                background: 'rgba(249,115,22,0.06)',
                borderLeft: '3px solid #f97316',
              }}
            >
              <AlertCircle size={16} className="text-cz-accent-orange mt-0.5 flex-shrink-0" />
              <p className="text-cz-text-secondary text-xs leading-relaxed">
                You are managing this order as the{' '}
                <span className="text-white font-semibold">{hubRoleLabel}</span>
              </p>
            </div>

            {allowedTransitions.length === 0 ? (
              <p className="text-cz-text-secondary text-sm text-center py-4">
                No status transitions available for this hub at the current status.
              </p>
            ) : (
              <div className="space-y-3">
                <SelectDropdown
                  label="Next Status"
                  options={allowedTransitions.map(s => ({ value: s, label: s }))}
                  value={nextStatus}
                  onChange={setNextStatus}
                  placeholder="Select next status…"
                />
                <div>
                  <label className="text-cz-text-secondary text-sm font-medium block mb-1.5">
                    Note <span className="text-cz-text-secondary font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="Add a note…"
                    rows={3}
                    className="w-full bg-cz-dark-bg border border-cz-border rounded-lg px-3 py-2 text-white text-sm placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={!nextStatus || savingStatus}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-cz-accent-orange text-white rounded-lg font-semibold text-sm hover:bg-[#ea6c0a] transition-colors disabled:opacity-50"
                >
                  {savingStatus && <Loader2 size={14} className="animate-spin" />}
                  {savingStatus ? 'Updating…' : 'Update Status'}
                </button>
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
