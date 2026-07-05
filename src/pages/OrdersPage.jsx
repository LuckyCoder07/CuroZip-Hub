import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, AlertTriangle, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import PageHeader from '../components/shared/PageHeader';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import SelectDropdown from '../components/shared/SelectDropdown';
import Modal from '../components/shared/Modal';

const API = 'http://localhost:5000/api';

const ALL_STATUSES = [
  'All',
  'Booked',
  'Pickup Assigned',
  'Picked Up',
  'In Transit',
  'At Destination Hub',
  'Out for Delivery',
  'Delivered',
  'Failed / Returned',
];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Quick Assign Modal ──────────────────────────────────────────────────────

const QuickAssignModal = ({ order, myHubId, token, onClose, onSaved }) => {
  const { addToast } = useToast();
  const [vendorOptions, setVendorOptions] = useState([]);
  const [pickupPartnerOptions, setPickupPartnerOptions] = useState([]);
  const [deliveryPartnerOptions, setDeliveryPartnerOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vendorId, setVendorId] = useState(order?.assignedVendorId?._id || order?.assignedVendorId || '');
  const [pickupPartnerId, setPickupPartnerId] = useState(order?.assignedPickupPartnerId?._id || order?.assignedPickupPartnerId || '');
  const [deliveryPartnerId, setDeliveryPartnerId] = useState(order?.assignedDeliveryPartnerId?._id || order?.assignedDeliveryPartnerId || '');

  const headers = { Authorization: `Bearer ${token}` };
  const fromCity = order?.pickup?.city;
  const toCity = order?.delivery?.city;
  const destHubId = order?.destinationHubId?._id || order?.destinationHubId;

  useEffect(() => {
    if (!order) return;
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
          (vendorRes.data || []).map(v => ({
            value: v._id,
            label: `${v.name} · ${v.vehicleType}`,
          }))
        );
        setPickupPartnerOptions(
          (pickupRes.data || []).map(p => ({ value: p._id, label: p.name }))
        );
        setDeliveryPartnerOptions(
          (deliveryRes.data || []).map(p => ({ value: p._id, label: p.name }))
        );
      } catch (e) {
        addToast('Failed to load assignment options', 'error');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [order]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const original = order;
      const calls = [];
      const origVendorId = original?.assignedVendorId?._id || original?.assignedVendorId || '';
      const origPickupId = original?.assignedPickupPartnerId?._id || original?.assignedPickupPartnerId || '';
      const origDeliveryId = original?.assignedDeliveryPartnerId?._id || original?.assignedDeliveryPartnerId || '';

      if (vendorId && vendorId !== origVendorId) {
        calls.push(axios.put(`${API}/orders/${order._id}/assign-vendor`, { vendorId }, { headers }));
      }
      if (pickupPartnerId && pickupPartnerId !== origPickupId) {
        calls.push(axios.put(`${API}/orders/${order._id}/assign-pickup-partner`, { partnerId: pickupPartnerId }, { headers }));
      }
      if (deliveryPartnerId && deliveryPartnerId !== origDeliveryId) {
        calls.push(axios.put(`${API}/orders/${order._id}/assign-delivery-partner`, { partnerId: deliveryPartnerId }, { headers }));
      }

      for (const call of calls) await call;

      addToast('Assignments saved successfully', 'success');
      onSaved();
    } catch (e) {
      addToast(e?.response?.data?.message || 'Failed to save assignments', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  const destCity = order?.destinationHubId?.city || toCity;

  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      title="Quick Assignment"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-cz-border text-cz-text-secondary hover:text-white hover:border-white/30 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-cz-accent-orange text-white rounded-lg font-semibold text-sm hover:bg-[#ea6c0a] transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Assignments'}
          </button>
        </div>
      }
    >
      {/* Order Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono font-bold text-cz-accent-orange text-base">{order.trackingId}</span>
          <span className="text-cz-text-secondary text-sm">
            {order.pickup?.city} → {order.delivery?.city}
          </span>
          <StatusBadge status={order.status} />
        </div>
      </div>
      <hr className="border-cz-border mb-5" />

      {/* Assignment Rows */}
      <div className="space-y-5">
        {/* Vendor */}
        <div>
          <p className="text-cz-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Fleet Vendor</p>
          {vendorOptions.length === 0 && !loadingOptions ? (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              No vendors for this route — contact admin
            </div>
          ) : (
            <SelectDropdown
              options={vendorOptions}
              value={vendorId}
              onChange={setVendorId}
              searchable
              placeholder="Select fleet vendor…"
              loading={loadingOptions}
            />
          )}
        </div>

        {/* Pickup Partner */}
        <div>
          <p className="text-cz-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Pickup Partner</p>
          <SelectDropdown
            options={pickupPartnerOptions}
            value={pickupPartnerId}
            onChange={setPickupPartnerId}
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
            value={deliveryPartnerId}
            onChange={setDeliveryPartnerId}
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
      </div>
    </Modal>
  );
};

// ─── Orders Tab Panel ─────────────────────────────────────────────────────────

const OrdersTab = ({ orders, isPickupTab, myHubId, token, onRefresh }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusOptions = ALL_STATUSES.map(s => ({ value: s, label: s }));

  const filtered = orders.filter(o => {
    const matchSearch =
      (o.trackingId || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const partnerLabel = isPickupTab ? 'Pickup Partner' : 'Delivery Partner';

  const columns = [
    {
      key: 'trackingId',
      label: 'Tracking ID',
      sortable: true,
      render: (val, row) => (
        <button
          onClick={() => navigate(`/orders/${row._id}`)}
          className="font-mono text-cz-accent-orange font-semibold hover:underline text-sm"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (val, row) => (
        <div>
          <p className="text-white text-sm font-medium">{val}</p>
          <p className="text-cz-text-secondary text-xs">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (val, row) => (
        <span className="text-cz-text-secondary text-xs">
          {row.pickup?.city} → {row.delivery?.city}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'assignedVendorId',
      label: 'Fleet Vendor',
      render: (val) =>
        val?.name ? (
          <span className="text-white text-sm">{val.name}</span>
        ) : (
          <span className="flex items-center gap-1 text-yellow-400 text-xs">
            <AlertTriangle size={12} />
            Unassigned
          </span>
        ),
    },
    {
      key: isPickupTab ? 'assignedPickupPartnerId' : 'assignedDeliveryPartnerId',
      label: partnerLabel,
      render: (val) =>
        val?.name ? (
          <span className="text-white text-sm">{val.name}</span>
        ) : (
          <span className="text-cz-text-secondary text-sm">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-cz-text-secondary text-xs">{formatDate(val)}</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(row)}
            className="px-3 py-1 text-xs font-semibold border border-cz-accent-orange text-cz-accent-orange rounded hover:bg-cz-accent-orange hover:text-white transition-colors"
          >
            Assign
          </button>
          <button
            onClick={() => navigate(`/orders/${row._id}`)}
            className="p-1.5 text-cz-text-secondary hover:text-white transition-colors rounded hover:bg-white/10"
          >
            <Eye size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cz-text-secondary" />
          <input
            type="text"
            placeholder="Search tracking ID or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-cz-card-bg border border-cz-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors"
          />
        </div>
        <div className="w-64">
          <SelectDropdown
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
          />
        </div>
        {(search || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-cz-text-secondary hover:text-white border border-cz-border rounded-lg hover:border-white/30 transition-colors"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No orders found"
        emptyDescription="Try adjusting your search or status filter."
      />

      {/* Quick Assign Modal */}
      {selectedOrder && (
        <QuickAssignModal
          order={selectedOrder}
          myHubId={myHubId}
          token={token}
          onClose={() => setSelectedOrder(null)}
          onSaved={() => { setSelectedOrder(null); onRefresh(); }}
        />
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const OrdersPage = () => {
  const { token, hubId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const myHubId = typeof hubId === 'object' ? hubId?._id : hubId;

  const fetchOrders = useCallback(async () => {
    if (!myHubId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders/hub/${myHubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(res.data) ? res.data : (res.data.orders || []));
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
    }
  }, [myHubId, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const pickupOrders = orders.filter(o => {
    const phId = o.pickupHubId?._id || o.pickupHubId;
    return phId === myHubId;
  });

  const deliveryOrders = orders.filter(o => {
    const dhId = o.destinationHubId?._id || o.destinationHubId;
    return dhId === myHubId;
  });

  const tabs = [
    { label: 'Pickup Orders', count: pickupOrders.length },
    { label: 'Delivery Orders', count: deliveryOrders.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Hub Orders" subtitle="Orders routed through your hub" />

      {/* Tab Bar */}
      <div className="border-b border-cz-border">
        <div className="flex gap-0">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`relative px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors ${
                activeTab === i
                  ? 'text-cz-accent-orange'
                  : 'text-cz-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === i
                    ? 'bg-cz-accent-orange text-white'
                    : 'bg-cz-card-bg text-cz-text-secondary border border-cz-border'
                }`}
              >
                {loading ? '…' : tab.count}
              </span>
              {activeTab === i && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cz-accent-orange rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-cz-text-secondary">
          <Loader2 size={20} className="animate-spin text-cz-accent-orange" />
          Loading orders…
        </div>
      ) : (
        <OrdersTab
          key={activeTab}
          orders={activeTab === 0 ? pickupOrders : deliveryOrders}
          isPickupTab={activeTab === 0}
          myHubId={myHubId}
          token={token}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
};

export default OrdersPage;
