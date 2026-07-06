import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, ArrowRight, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/shared/ToastContext';
import PageHeader from '../components/shared/PageHeader';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import OrderLifecycleTracker from '../components/shared/OrderLifecycleTracker';

const API = 'https://curozip-admin.onrender.com/api';

const CustomerDetailSlideOver = ({ customer, onClose }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  if (!customer) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-cz-card-bg shadow-2xl z-50 flex flex-col border-l border-cz-border animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-cz-border relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-1.5 text-cz-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xl border border-blue-500/30">
              {customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">{customer.name}</h2>
              <p className="text-cz-text-secondary text-sm">{customer.phone}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">
              {customer.orders.length} Orders
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {customer.orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => {
            const isExpanded = expandedCard === order._id;
            return (
              <div key={order._id} className="border border-cz-border bg-cz-dark-bg rounded-xl overflow-hidden transition-colors hover:border-cz-border/80">
                <div 
                  className="p-4 cursor-pointer flex flex-col gap-3"
                  onClick={() => setExpandedCard(isExpanded ? null : order._id)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-cz-accent-orange font-bold text-sm">{order.trackingId}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    {order.pickup?.city} <ArrowRight size={14} className="text-cz-text-secondary" /> {order.delivery?.city}
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-cz-text-secondary text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-cz-text-secondary text-xs font-medium">₹{order.amount}</span>
                      {isExpanded ? <ChevronUp size={16} className="text-cz-text-secondary" /> : <ChevronDown size={16} className="text-cz-text-secondary" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-cz-border bg-[#101522]">
                    <div className="scale-90 origin-left mb-2 -ml-2">
                      <OrderLifecycleTracker currentStatus={order.status} />
                    </div>
                    <p className="text-cz-text-secondary text-[10px] mb-4 uppercase tracking-wider">
                      Last updated: {new Date(order.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-cz-text-secondary text-[10px] uppercase">Vendor</p>
                        <p className="text-white text-xs font-medium truncate">{order.assignedVendorId?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-cz-text-secondary text-[10px] uppercase">Pickup Partner</p>
                        <p className="text-white text-xs font-medium truncate">{order.assignedPickupPartnerId?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-cz-text-secondary text-[10px] uppercase">Delivery Partner</p>
                        <p className="text-white text-xs font-medium truncate">{order.assignedDeliveryPartnerId?.name || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const CustomersPage = () => {
  const { token, hubId } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const myHubId = typeof hubId === 'object' ? hubId?._id : hubId;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = useCallback(async () => {
    if (!myHubId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders/hub/${myHubId}`, { headers });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      addToast('Failed to load customers data', 'error');
    } finally {
      setLoading(false);
    }
  }, [myHubId, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Group orders by customerPhone for Sending vs Receiving
  const sendingCustomersMap = new Map();
  const receivingCustomersMap = new Map();

  orders.forEach(order => {
    const isSending = (order.pickupHubId?._id || order.pickupHubId) === myHubId;
    const isReceiving = (order.destinationHubId?._id || order.destinationHubId) === myHubId;

    if (isSending) {
      if (!sendingCustomersMap.has(order.customerPhone)) {
        sendingCustomersMap.set(order.customerPhone, {
          name: order.customerName,
          phone: order.customerPhone,
          orders: []
        });
      }
      sendingCustomersMap.get(order.customerPhone).orders.push(order);
    }

    if (isReceiving) {
      // Receiving customer is the recipient, so use delivery.phone
      const rPhone = order.delivery?.phone || order.customerPhone;
      const rName = order.delivery?.name || order.customerName;
      if (!receivingCustomersMap.has(rPhone)) {
        receivingCustomersMap.set(rPhone, {
          name: rName,
          phone: rPhone,
          orders: []
        });
      }
      receivingCustomersMap.get(rPhone).orders.push(order);
    }
  });

  const sendingCustomers = Array.from(sendingCustomersMap.values());
  const receivingCustomers = Array.from(receivingCustomersMap.values());

  const currentCustomers = activeTab === 0 ? sendingCustomers : receivingCustomers;

  const filteredCustomers = currentCustomers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  ).sort((a,b) => {
    // sort by latest order date descending
    const aLatest = Math.max(...a.orders.map(o => new Date(o.createdAt).getTime()));
    const bLatest = Math.max(...b.orders.map(o => new Date(o.createdAt).getTime()));
    return bLatest - aLatest;
  });

  const tabs = [
    { label: 'Sending Customers', count: sendingCustomers.length },
    { label: 'Receiving Customers', count: receivingCustomers.length }
  ];

  const columns = [
    {
      key: 'name',
      label: 'Customer Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/30">
            {val?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
          </div>
          <span className="text-white font-medium text-sm">{val}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => <span className="text-cz-text-secondary text-sm">{val}</span>
    },
    {
      key: 'orderCount',
      label: 'Total Orders',
      render: (val, row) => (
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
          {row.orders.length}
        </span>
      )
    },
    {
      key: 'lastOrder',
      label: 'Last Order',
      render: (val, row) => {
        const lastOrder = row.orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        return (
          <div className="flex items-center gap-3">
            <span className="font-mono text-cz-accent-orange font-semibold text-xs">{lastOrder.trackingId}</span>
            <StatusBadge status={lastOrder.status} />
          </div>
        );
      }
    },
    {
      key: 'lastDate',
      label: 'Last Order Date',
      render: (val, row) => {
        const lastOrder = row.orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        return (
          <span className="text-cz-text-secondary text-sm">
            {new Date(lastOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (val, row) => (
        <button 
          onClick={() => setSelectedCustomer(row)}
          className="px-3 py-1.5 border border-cz-border text-cz-text-secondary hover:text-white hover:border-white/30 rounded-lg text-xs font-semibold transition-colors"
        >
          View Orders
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Customers & Orders" subtitle="Customers with orders via your hub" />

      {/* Tab Bar */}
      <div className="border-b border-cz-border">
        <div className="flex gap-0">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`relative px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors ${
                activeTab === i ? 'text-cz-accent-orange' : 'text-cz-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === i ? 'bg-cz-accent-orange text-white' : 'bg-cz-card-bg text-cz-text-secondary border border-cz-border'
              }`}>
                {loading ? '…' : tab.count}
              </span>
              {activeTab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cz-accent-orange rounded-t" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cz-text-secondary" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-cz-card-bg border border-cz-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-cz-text-secondary focus:outline-none focus:border-cz-accent-orange transition-colors"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredCustomers} 
        loading={loading}
        emptyTitle="No customers found"
        emptyDescription="Try adjusting your search criteria or checking the other tab."
      />

      {selectedCustomer && (
        <CustomerDetailSlideOver 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
        />
      )}
    </div>
  );
};

export default CustomersPage;
