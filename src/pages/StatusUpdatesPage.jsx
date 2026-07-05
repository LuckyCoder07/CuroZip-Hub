import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, ChevronDown, Filter, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import PageHeader from '../components/shared/PageHeader';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';

const API = 'http://localhost:5000/api';

const ALL_STATUSES = [
  'Booked', 'Pickup Assigned', 'Picked Up', 'In Transit', 
  'At Destination Hub', 'Out for Delivery', 'Delivered', 'Failed / Returned'
];

const StatusPopover = ({ order, myHubId, onClose, onUpdate }) => {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Available statuses based on hub scoping
  const isPickupHub = order.pickupHubId?._id === myHubId || order.pickupHubId === myHubId;
  const isDestinationHub = order.destinationHubId?._id === myHubId || order.destinationHubId === myHubId;

  let availableStatuses = [];
  if (isPickupHub && isDestinationHub) {
    availableStatuses = ALL_STATUSES;
  } else if (isPickupHub) {
    availableStatuses = ['Booked', 'Pickup Assigned', 'Picked Up', 'In Transit'];
  } else if (isDestinationHub) {
    availableStatuses = ['At Destination Hub', 'Out for Delivery', 'Delivered', 'Failed / Returned'];
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === order.status && !note) return onClose();
    setSaving(true);
    await onUpdate([order._id], status, note);
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-64 bg-cz-card-bg border border-cz-border rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-bold">Update Status</span>
            <button type="button" onClick={onClose} className="text-cz-text-secondary hover:text-white"><X size={16}/></button>
          </div>
          <div>
            <label className="block text-cz-text-secondary text-xs mb-1">New Status</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-cz-dark-bg border border-cz-border text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:border-cz-accent-orange"
            >
              {availableStatuses.map(s => (
                <option key={s} value={s} disabled={ALL_STATUSES.indexOf(s) < ALL_STATUSES.indexOf(order.status)}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-cz-text-secondary text-xs mb-1">Internal Note (Optional)</label>
            <input 
              type="text" 
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="E.g. Package damaged"
              className="w-full bg-cz-dark-bg border border-cz-border text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:border-cz-accent-orange"
            />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-cz-accent-orange text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#ea6c0a] transition-colors flex justify-center items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Update'}
          </button>
        </form>
      </div>
    </>
  );
};

const StatusUpdatesPage = () => {
  const { token, hubId } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Selection & Bulk Actions
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState(null);

  const myHubId = typeof hubId === 'object' ? hubId?._id : hubId;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = useCallback(async () => {
    if (!myHubId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders/hub/${myHubId}`, { headers });
      // Only keep orders that are not fully delivered/returned if we want a clean workspace, 
      // but let's keep all and let them filter.
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [myHubId, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (orderIds, newStatus, internalNote) => {
    try {
      const promises = orderIds.map(id => 
        axios.put(`${API}/orders/${id}/status`, { status: newStatus, internalNote }, { headers })
      );
      await Promise.all(promises);
      
      addToast(`Updated ${orderIds.length} order(s) successfully`, 'success');
      
      // Optimistically update
      setOrders(prev => prev.map(o => {
        if (orderIds.includes(o._id)) {
          return { ...o, status: newStatus, internalNote: internalNote || o.internalNote };
        }
        return o;
      }));
      
      setSelectedRows([]);
      setBulkStatus('');
      setBulkNote('');
    } catch (e) {
      addToast(e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkStatus) return addToast('Please select a status', 'error');
    setBulkSaving(true);
    await handleUpdateStatus(selectedRows, bulkStatus, bulkNote);
    setBulkSaving(false);
  };

  const filteredOrders = orders.filter(o => 
    (filterStatus === 'All' || o.status === filterStatus)
  ).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const columns = [
    {
      key: 'trackingId',
      label: 'Tracking ID',
      render: (val) => <span className="font-mono text-cz-accent-orange font-semibold text-sm">{val}</span>
    },
    {
      key: 'route',
      label: 'Route',
      render: (val, row) => (
        <span className="text-white text-sm font-medium">
          {row.pickup?.city} → {row.delivery?.city}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Current Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (val, row) => (
        <div className="text-cz-text-secondary text-sm">
          {new Date(row.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • 
          {new Date(row.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Update',
      render: (val, row) => (
        <div className="relative inline-block text-left">
          <button 
            onClick={(e) => { e.stopPropagation(); setOpenPopoverId(openPopoverId === row._id ? null : row._id); }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
          >
            Update <ChevronDown size={14} />
          </button>
          {openPopoverId === row._id && (
            <StatusPopover 
              order={row} 
              myHubId={myHubId} 
              onClose={() => setOpenPopoverId(null)} 
              onUpdate={handleUpdateStatus} 
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 relative">
      <PageHeader title="Bulk Status Updates" subtitle="Update multiple order statuses at once" />

      {/* Filter Bar */}
      <div className="flex items-center gap-4 p-1">
        <div className="flex items-center gap-2 bg-cz-card-bg border border-cz-border rounded-lg px-3 py-2">
          <Filter size={16} className="text-cz-text-secondary" />
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar - Sticky when items selected */}
      <div className={`transition-all duration-300 ease-in-out ${selectedRows.length > 0 ? 'opacity-100 max-h-24 translate-y-0' : 'opacity-0 max-h-0 -translate-y-4 overflow-hidden'}`}>
        <div className="bg-cz-accent-orange/10 border border-cz-accent-orange/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cz-accent-orange flex items-center justify-center text-white font-bold text-sm">
              {selectedRows.length}
            </div>
            <span className="text-cz-text-primary font-semibold text-sm">Orders Selected</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="bg-cz-dark-bg border border-cz-border text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-cz-accent-orange min-w-[160px]"
            >
              <option value="" disabled>Select New Status...</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <input 
              type="text"
              placeholder="Add internal note..."
              value={bulkNote}
              onChange={e => setBulkNote(e.target.value)}
              className="bg-cz-dark-bg border border-cz-border text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-cz-accent-orange w-48"
            />

            <button 
              onClick={handleBulkSubmit}
              disabled={bulkSaving || !bulkStatus}
              className="bg-cz-accent-orange text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#ea6c0a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {bulkSaving ? <Loader2 size={16} className="animate-spin" /> : 'Apply to All'}
            </button>
            
            <button 
              onClick={() => setSelectedRows([])}
              className="p-2 text-cz-text-secondary hover:text-white transition-colors"
              title="Clear selection"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredOrders} 
        loading={loading}
        searchable={true}
        checkboxes={true}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        emptyIcon={CheckCircle2}
        emptyTitle="No orders to update"
        emptyDescription="All caught up! No orders match the selected filters."
      />
    </div>
  );
};

export default StatusUpdatesPage;
