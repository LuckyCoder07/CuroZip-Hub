import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Eye, Bike, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import HubLayout from '../components/HubLayout';
import PageHeader from '../components/shared/PageHeader';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import StatusBadge from '../components/shared/StatusBadge';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

const AddPartnerModal = ({ isOpen, onClose, onSave, myHubId, token }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(
        `${API}/users`,
        { ...form, role: 'delivery_partner', hubId: myHubId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Delivery partner added successfully', 'success');
      onSave(res.data.user);
      onClose();
    } catch (e) {
      addToast(e.response?.data?.message || 'Failed to add partner', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Delivery Partner"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-cz-border text-cz-text-secondary hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-cz-accent-orange text-white rounded-lg font-semibold text-sm hover:bg-[#ea6c0a] transition-colors flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Partner
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} id="add-partner-form" className="space-y-4">
        <div>
          <label className="block text-cz-text-secondary text-sm font-medium mb-1">Full Name *</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-cz-dark-bg border border-cz-border rounded-lg px-3 py-2 text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors" placeholder="e.g. Rahul Kumar" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-cz-text-secondary text-sm font-medium mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-cz-dark-bg border border-cz-border rounded-lg px-3 py-2 text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors" placeholder="partner@curozip.com" />
          </div>
          <div>
            <label className="block text-cz-text-secondary text-sm font-medium mb-1">Phone *</label>
            <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-cz-dark-bg border border-cz-border rounded-lg px-3 py-2 text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors" placeholder="10-digit number" />
          </div>
        </div>
        <div>
          <label className="block text-cz-text-secondary text-sm font-medium mb-1">Password *</label>
          <div className="relative">
            <input required type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-cz-dark-bg border border-cz-border rounded-lg px-3 py-2 text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors" placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cz-text-secondary hover:text-white">
              <Eye size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-cz-accent-orange cursor-pointer" id="isActive" />
          <label htmlFor="isActive" className="text-white text-sm cursor-pointer">Active</label>
        </div>
        <p className="text-cz-text-secondary text-xs italic mt-2">This partner will be assigned to your hub and can login at hub.curozip.com</p>
      </form>
    </Modal>
  );
};

const PartnerDetailSlideOver = ({ partner, orders, onClose }) => {
  const navigate = useNavigate();
  if (!partner) return null;

  const activeOrders = orders.filter(o => 
    (o.assignedPickupPartnerId?._id === partner._id || o.assignedDeliveryPartnerId?._id === partner._id) && 
    !['Delivered', 'Failed / Returned'].includes(o.status)
  );

  const deliveredTotal = orders.filter(o => 
    (o.assignedPickupPartnerId?._id === partner._id || o.assignedDeliveryPartnerId?._id === partner._id) && 
    o.status === 'Delivered'
  );

  const deliveredThisMonth = deliveredTotal.filter(o => {
    const d = new Date(o.updatedAt || o.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const recentOrders = [...activeOrders, ...deliveredTotal].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-cz-card-bg shadow-2xl z-50 flex flex-col border-l border-cz-border animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-cz-border relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-1.5 text-cz-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-xl border border-green-500/30">
              {partner.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">{partner.name}</h2>
              <p className="text-cz-text-secondary text-sm">{partner.phone}</p>
              <p className="text-cz-text-secondary text-sm">{partner.email}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${partner.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-cz-border text-cz-text-secondary'}`}>
              {partner.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-cz-dark-bg border border-cz-border rounded-lg p-3 text-center">
              <p className="text-cz-text-secondary text-xs">Active</p>
              <p className="text-white font-bold text-lg">{activeOrders.length}</p>
            </div>
            <div className="bg-cz-dark-bg border border-cz-border rounded-lg p-3 text-center">
              <p className="text-cz-text-secondary text-xs truncate">This Month</p>
              <p className="text-green-400 font-bold text-lg">{deliveredThisMonth.length}</p>
            </div>
            <div className="bg-cz-dark-bg border border-cz-border rounded-lg p-3 text-center">
              <p className="text-cz-text-secondary text-xs">Total Del</p>
              <p className="text-white font-bold text-lg">{deliveredTotal.length}</p>
            </div>
          </div>

          <hr className="border-cz-border mb-6" />

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-sm font-semibold">Recent Orders</h3>
              {recentOrders.length > 0 && (
                <button onClick={() => navigate('/orders')} className="text-cz-accent-orange text-xs hover:underline">View All</button>
              )}
            </div>
            
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-cz-text-secondary text-sm text-center py-4 italic">No orders assigned yet</p>
              ) : (
                recentOrders.map(o => (
                  <div key={o._id} className="bg-cz-dark-bg border border-cz-border p-3 rounded-lg hover:border-cz-accent-orange/50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${o._id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-cz-accent-orange text-sm font-semibold">{o.trackingId}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="text-cz-text-secondary text-xs">
                      {o.pickup?.city} → {o.delivery?.city}
                    </div>
                    <div className="text-cz-text-secondary text-[10px] mt-2">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DeliveryPartnersPage = () => {
  const { token, hubId } = useAuth();
  const { addToast } = useToast();
  const [partners, setPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const myHubId = typeof hubId === 'object' ? hubId?._id : hubId;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    if (!myHubId || !token) return;
    setLoading(true);
    try {
      const [partnersRes, ordersRes] = await Promise.all([
        axios.get(`${API}/users/delivery-partners/${myHubId}`, { headers }),
        axios.get(`${API}/orders/hub/${myHubId}`, { headers })
      ]);
      setPartners(partnersRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (e) {
      console.error(e);
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [myHubId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleStatus = async (partner) => {
    try {
      // Find the row and optimistically update
      setPartners(prev => prev.map(p => p._id === partner._id ? { ...p, isActive: !p.isActive } : p));
      
      const endpoint = partner.isActive ? `${API}/users/${partner._id}` : `${API}/users/${partner._id}`; 
      // Wait, DELETE /api/users/:id deactivates. Or PUT /api/users/:id with isActive.
      // We'll just use PUT with { isActive: !partner.isActive }
      await axios.put(`${API}/users/${partner._id}`, { isActive: !partner.isActive }, { headers });
      addToast(`Partner ${partner.isActive ? 'deactivated' : 'activated'}`, 'success');
    } catch (e) {
      addToast('Failed to update status', 'error');
      // Revert on error
      setPartners(prev => prev.map(p => p._id === partner._id ? { ...p, isActive: partner.isActive } : p));
    }
  };

  const getPartnerStats = (partnerId) => {
    const pOrders = orders.filter(o => o.assignedPickupPartnerId?._id === partnerId || o.assignedDeliveryPartnerId?._id === partnerId || o.assignedPickupPartnerId === partnerId || o.assignedDeliveryPartnerId === partnerId);
    
    const active = pOrders.filter(o => !['Delivered', 'Failed / Returned'].includes(o.status)).length;
    
    const now = new Date();
    const delThisMonth = pOrders.filter(o => {
      if (o.status !== 'Delivered') return false;
      const d = new Date(o.updatedAt || o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return { active, delThisMonth };
  };

  const columns = [
    {
      key: 'partner',
      label: 'Partner',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-sm border border-green-500/30">
            {row.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-bold">{row.name}</p>
            <p className="text-cz-text-secondary text-xs">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => <span className="text-cz-text-secondary text-sm">{val}</span>
    },
    {
      key: 'activeOrders',
      label: 'Active Orders',
      render: (val, row) => {
        const stats = getPartnerStats(row._id);
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs font-bold">
            {stats.active} Orders
          </span>
        );
      }
    },
    {
      key: 'deliveredMonth',
      label: 'Delivered This Month',
      render: (val, row) => {
        const stats = getPartnerStats(row._id);
        return <span className="text-green-400 font-bold text-sm">{stats.delThisMonth}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <button 
          onClick={() => toggleStatus(row)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${row.isActive ? 'bg-green-500' : 'bg-cz-border'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${row.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedPartner(row)} className="p-1.5 text-cz-text-secondary hover:text-white rounded hover:bg-white/10 transition-colors">
            <Eye size={16} />
          </button>
          <button className="p-1.5 text-cz-text-secondary hover:text-white rounded hover:bg-white/10 transition-colors">
            <Pencil size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 relative">
      <PageHeader 
        title="Delivery Partners" 
        subtitle="Last-mile agents for your hub" 
        actionLabel="+ Add Partner" 
        onAction={() => setShowAddModal(true)} 
      />

      <div className="bg-cz-card-bg border-l-[3px] border-l-green-500 p-4 rounded-lg flex items-start gap-3 border border-cz-border border-l-green-500 mb-5">
        <Bike size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
        <p className="text-cz-text-secondary text-sm leading-relaxed">
          Delivery partners are last-mile agents who handle door-to-door pickups and deliveries within your hub's serviceable pincodes.
        </p>
      </div>

      <DataTable 
        columns={columns} 
        data={partners} 
        loading={loading}
        emptyTitle="No delivery partners found"
        emptyDescription="Add a partner to start assigning them to orders."
      />

      <AddPartnerModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSave={(newPartner) => setPartners(prev => [newPartner, ...prev])} 
        myHubId={myHubId}
        token={token}
      />

      {selectedPartner && (
        <PartnerDetailSlideOver 
          partner={selectedPartner} 
          orders={orders} 
          onClose={() => setSelectedPartner(null)} 
        />
      )}
    </div>
  );
};

export default DeliveryPartnersPage;
