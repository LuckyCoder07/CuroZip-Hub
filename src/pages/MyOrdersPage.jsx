import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, ChevronDown, User as UserIcon, Phone, Loader2,
  Package, CheckCircle2, XCircle, AlertCircle, Copy
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import Modal from '../components/shared/Modal';

const API = 'http://localhost:5000/api';

const COMPLETED_STATUSES = ['Delivered', 'Failed / Returned'];

// Failed attempt modal
const FailedModal = ({ isOpen, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onConfirm(note);
    setSaving(false);
    setNote('');
    onClose();
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark as Failed / Returned"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-cz-border text-cz-text-secondary hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Confirm Failed
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-cz-text-secondary text-sm">This order will be marked as Failed / Returned. Please add a reason.</p>
        <div>
          <label className="block text-cz-text-secondary text-sm font-medium mb-2">Reason / Note *</label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Customer not available, incorrect address..."
            className="w-full bg-cz-dark-bg border border-cz-border rounded-lg px-3 py-2 text-white text-sm placeholder-cz-text-secondary focus:outline-none focus:border-red-500 transition-colors resize-none"
          />
        </div>
      </div>
    </Modal>
  );
};

// Single order card
const OrderCard = ({ order, onAction }) => {
  const [acting, setActing] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);

  const handlePickedUp = async () => {
    setActing(true);
    await onAction(order._id, 'Picked Up', 'Marked as picked up by delivery partner');
    setActing(false);
  };

  const handleDelivered = async () => {
    setActing(true);
    await onAction(order._id, 'Delivered', 'Delivered to customer');
    setActing(false);
  };

  const handleFailed = async (note) => {
    await onAction(order._id, 'Failed / Returned', note || 'Failed delivery attempt');
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(order.trackingId || '');
  };

  return (
    <>
      <FailedModal
        isOpen={showFailedModal}
        onClose={() => setShowFailedModal(false)}
        onConfirm={handleFailed}
      />
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 mb-3 hover:border-cz-accent-orange/40 transition-colors">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={copyTrackingId}
              className="font-mono text-cz-accent-orange font-bold text-base hover:underline flex items-center gap-1.5"
              title="Copy tracking ID"
            >
              {order.trackingId}
              <Copy size={12} className="text-cz-text-secondary" />
            </button>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Address section */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-cz-text-secondary mt-0.5 flex-shrink-0" />
            <span className="text-cz-text-secondary text-sm leading-tight">
              {order.pickup?.address ? `${order.pickup.address}, ` : ''}{order.pickup?.city || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-[23px]">
            <ChevronDown size={14} className="text-cz-text-secondary" />
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-cz-accent-orange mt-0.5 flex-shrink-0" />
            <span className="text-white text-sm font-medium leading-tight">
              {order.delivery?.address ? `${order.delivery.address}, ` : ''}{order.delivery?.city || 'N/A'}
            </span>
          </div>
        </div>

        {/* Customer row */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#1f2937]">
          <UserIcon size={14} className="text-cz-text-secondary flex-shrink-0" />
          <span className="text-white text-sm font-medium">{order.customerName || 'Unknown'}</span>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center gap-1 ml-auto text-cz-accent-orange text-sm font-medium hover:underline"
            >
              <Phone size={13} />
              {order.customerPhone}
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4">
          {order.status === 'Pickup Assigned' && (
            <button
              onClick={handlePickedUp}
              disabled={acting}
              className="w-full flex items-center justify-center gap-2 bg-cz-accent-orange hover:bg-[#ea6c0a] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {acting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Mark as Picked Up
            </button>
          )}
          {order.status === 'Out for Delivery' && (
            <div className="flex gap-2">
              <button
                onClick={handleDelivered}
                disabled={acting}
                className="flex-1 flex items-center justify-center gap-2 bg-cz-accent-orange hover:bg-[#ea6c0a] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {acting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Mark as Delivered
              </button>
              <button
                onClick={() => setShowFailedModal(true)}
                disabled={acting}
                className="flex-1 flex items-center justify-center gap-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-60 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <XCircle size={15} />
                Mark as Failed
              </button>
            </div>
          )}
          {!['Pickup Assigned', 'Out for Delivery'].includes(order.status) && (
            <p className="text-center text-cz-text-secondary text-xs py-1">No action needed</p>
          )}
        </div>
      </div>
    </>
  );
};

// Skeleton card
const SkeletonCard = () => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 mb-3 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="h-5 bg-cz-border rounded w-32" />
      <div className="h-5 bg-cz-border rounded w-20" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-cz-border rounded w-3/4" />
      <div className="h-4 bg-cz-border rounded w-1/4" />
      <div className="h-4 bg-cz-border rounded w-3/4" />
    </div>
    <div className="mt-4 h-10 bg-cz-border rounded" />
  </div>
);

const MyOrdersPage = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchOrders = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = Array.isArray(res.data) ? res.data : [];
      // Filter to orders assigned to this user
      const myOrders = all.filter(o => {
        const pickupId = o.assignedPickupPartnerId?._id || o.assignedPickupPartnerId;
        const deliveryId = o.assignedDeliveryPartnerId?._id || o.assignedDeliveryPartnerId;
        return pickupId === user.id || pickupId === user._id ||
               deliveryId === user.id || deliveryId === user._id;
      });
      setOrders(myOrders);
    } catch (e) {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAction = async (orderId, status, note) => {
    try {
      await axios.put(
        `${API}/orders/${orderId}/status`,
        { status, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast(`Order updated: ${status}`, 'success');
      fetchOrders();
    } catch (e) {
      addToast(e.response?.data?.message || 'Update failed', 'error');
    }
  };

  // Split into tabs
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeOrders = orders.filter(o => !COMPLETED_STATUSES.includes(o.status));
  const completedOrders = orders.filter(o =>
    COMPLETED_STATUSES.includes(o.status) &&
    new Date(o.updatedAt || o.createdAt) >= thirtyDaysAgo
  );

  const tabs = [
    { label: 'Active Orders', count: activeOrders.length, data: activeOrders },
    { label: 'Completed (Last 30 Days)', count: completedOrders.length, data: completedOrders }
  ];

  const currentData = tabs[activeTab].data;

  return (
    <div>
      {/* Page header with role badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-cz-text-secondary text-sm mt-1">Orders assigned to you for pickup and delivery</p>
        </div>
        <span className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          Delivery Partner
        </span>
      </div>

      {/* Tab bar */}
      <div className="border-b border-cz-border mb-6">
        <div className="flex">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`relative px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-colors ${
                activeTab === i ? 'text-cz-accent-orange' : 'text-cz-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === i
                  ? 'bg-cz-accent-orange text-white'
                  : 'bg-cz-card-bg text-cz-text-secondary border border-cz-border'
              }`}>
                {loading ? '…' : tab.count}
              </span>
              {activeTab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cz-accent-orange rounded-t" />}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div className="max-w-[600px] mx-auto">
        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : currentData.length === 0 ? (
          <EmptyState
            icon={activeTab === 0 ? Package : CheckCircle2}
            title={activeTab === 0 ? 'No active orders' : 'No completed orders'}
            description={activeTab === 0
              ? 'You have no orders assigned for pickup or delivery right now.'
              : 'No orders completed in the last 30 days.'
            }
          />
        ) : (
          currentData.map(order => (
            <OrderCard key={order._id} order={order} onAction={handleAction} />
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
