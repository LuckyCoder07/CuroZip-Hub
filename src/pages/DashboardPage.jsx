import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';

const statusConfig = {
  'Booked': '#3b82f6',
  'Pickup Assigned': '#8b5cf6',
  'Picked Up': '#6366f1',
  'In Transit': '#eab308',
  'At Destination Hub': '#f97316',
  'Out for Delivery': '#06b6d4',
  'Delivered': '#22c55e',
  'Failed / Returned': '#ef4444'
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-cz-card-bg rounded-xl border border-cz-border p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-cz-text-secondary text-sm">{label}</p>
      <p className="text-cz-text-primary text-2xl font-bold mt-0.5">{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { token, user, hubId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [hubInfo, setHubInfo] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!hubId || !token) return;
      try {
        setLoading(true);
        // Ensure hubId is a string if it's an object
        const resolvedHubId = typeof hubId === 'object' ? hubId._id : hubId;
        
        const [ordersRes, authRes] = await Promise.all([
          axios.get(`https://curozip-admin.onrender.com/api/orders/hub/${resolvedHubId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('https://curozip-admin.onrender.com/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.orders || []));
        
        // Extract the populated hub details from the user data
        const userData = authRes.data.user || authRes.data;
        if (userData && userData.hubId) {
          setHubInfo(userData.hubId);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [hubId, token]);

  const today = new Date().toDateString();

  // Compute Stats
  const newOrdersToday = orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
  const inTransit = orders.filter(o => o.status === 'In Transit').length;
  const outForDelivery = orders.filter(o => o.status === 'Out for Delivery').length;
  const deliveredToday = orders.filter(o => o.status === 'Delivered' && new Date(o.updatedAt).toDateString() === today).length;

  const stats = [
    { icon: Package, label: 'New Orders Today', value: newOrdersToday, color: 'bg-orange-500/20 text-orange-400' },
    { icon: Clock, label: 'In Transit', value: inTransit, color: 'bg-yellow-500/20 text-yellow-400' },
    { icon: TrendingUp, label: 'Out for Delivery', value: outForDelivery, color: 'bg-cyan-500/20 text-cyan-400' },
    { icon: Users, label: 'Delivered Today', value: deliveredToday, color: 'bg-green-500/20 text-green-400' },
  ];

  // Pending Assignments
  const pendingAssignments = orders.filter(o => 
    !o.assignedVendorId || !o.assignedPickupPartnerId || !o.assignedDeliveryPartnerId
  );

  const pendingColumns = [
    {
      key: 'trackingId',
      label: 'Tracking ID',
      sortable: true,
      render: (val, row) => <span className="font-mono text-cz-accent-orange font-medium">{val || row._id.substring(0,8)}</span>
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (val, row) => val || row.customer?.name || 'Unknown'
    },
    {
      key: 'route',
      label: 'Route',
      render: (val, row) => `${row.originCity || 'N/A'} → ${row.destinationCity || 'N/A'}`
    },
    {
      key: 'missingItems',
      label: 'Missing Assignments',
      render: (val, row) => (
        <div className="flex flex-wrap gap-1">
          {!row.assignedVendorId && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Vendor</span>}
          {!row.assignedPickupPartnerId && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Pickup Partner</span>}
          {!row.assignedDeliveryPartnerId && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Delivery Partner</span>}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (val, row) => (
        <button 
          onClick={() => navigate(`/orders/${row._id}`)}
          className="bg-cz-accent-orange text-white text-xs px-3 py-1 rounded hover:bg-[#ea6c0a] transition-colors"
        >
          Assign
        </button>
      )
    }
  ];

  // Status Breakdown Chart Data
  const statusCounts = {};
  orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const chartData = Object.keys(statusCounts).map(status => ({
    name: status,
    count: statusCounts[status],
    fill: statusConfig[status] || '#9ca3af'
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Row 1: Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Row 2: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column (60% equivalent ~ 3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-cz-card-bg rounded-xl border border-cz-border overflow-hidden h-full">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-cz-border">
              <AlertCircle size={20} className="text-cz-accent-orange" />
              <h2 className="text-cz-text-primary font-bold text-lg">Pending Assignments</h2>
              <span className="ml-2 bg-cz-accent-orange text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pendingAssignments.length}
              </span>
            </div>
            <div className="p-4">
              <DataTable 
                columns={pendingColumns} 
                data={pendingAssignments} 
                loading={loading} 
                emptyTitle="No pending assignments"
                emptyDescription="All orders have vendors and partners assigned."
              />
            </div>
          </div>
        </div>

        {/* Right Column (40% equivalent ~ 2 cols) */}
        <div className="lg:col-span-2">
          <div className="bg-cz-card-bg rounded-xl border border-cz-border p-6 h-full">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-cz-border rounded w-1/2"></div>
                <div className="h-4 bg-cz-border rounded w-3/4"></div>
                <div className="h-4 bg-cz-border rounded w-full"></div>
              </div>
            ) : hubInfo ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-white font-bold text-xl">{hubInfo.name || 'Unknown Hub'}</h2>
                  <p className="text-cz-text-secondary text-sm mt-1">{hubInfo.city}, {hubInfo.state}</p>
                  <p className="text-cz-text-secondary text-xs mt-1">{hubInfo.address}</p>
                </div>
                
                <hr className="border-cz-border" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-cz-text-secondary">Manager:</span>
                    <span className="text-white">{hubInfo.managerName || user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cz-text-secondary">Phone:</span>
                    <span className="text-white">{hubInfo.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cz-text-secondary">Email:</span>
                    <span className="text-white">{hubInfo.email || 'N/A'}</span>
                  </div>
                </div>

                <hr className="border-cz-border" />
                
                <div>
                  <h3 className="text-white text-sm font-bold mb-3">Serviceable Pincodes:</h3>
                  <div className="flex flex-wrap gap-2">
                    {hubInfo.serviceablePincodes?.map((pin, i) => (
                      <span key={i} className="bg-[#1f2937] text-white text-xs font-medium px-2.5 py-1 rounded">
                        {pin}
                      </span>
                    )) || <span className="text-cz-text-secondary text-xs">None found</span>}
                  </div>
                </div>

                <hr className="border-cz-border" />

                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-bold">Active Delivery Partners:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {/* Assuming we get partner count from somewhere, maybe mock it for now if not available in hubInfo */}
                    {hubInfo.deliveryPartnersCount || 0}
                  </span>
                </div>

              </div>
            ) : (
              <div className="text-cz-text-secondary text-sm">Hub information unavailable.</div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Status Breakdown Chart */}
      <div className="bg-cz-card-bg rounded-xl border border-cz-border p-6">
        <h2 className="text-white font-bold text-lg mb-6">Today's Order Status Breakdown</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center animate-pulse">
            <div className="text-cz-text-secondary">Loading chart...</div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: '#0a0e1a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-cz-text-secondary text-sm">No orders to display</div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
