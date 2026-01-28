import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  TrendingUp, ShoppingBag, DollarSign, Clock, Printer, X, 
  BarChart3, Calendar, Package, ChevronRight, Search, 
  AlertTriangle, AlertCircle, Info, RefreshCw, CheckCircle2 
} from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({ 
    todayMoney: 0, 
    todayOrders: 0, 
    topProducts: [], 
    recentOrders: [], 
    weeklySales: [] 
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const LOW_STOCK_THRESHOLD = 10;
  const API_URL = 'https://your-backend-name.railway.app';


  // Live Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const lowStockItems = stats.topProducts?.filter(p => Number(p.stock) <= LOW_STOCK_THRESHOLD) || [];

  const handlePrintOldReceipt = (order) => {
    const printWindow = window.open('', '', 'width=350,height=600');
    const htmlContent = `
      <html><head><title>Receipt #${order.id}</title><style>
        body { font-family: 'Arial', sans-serif; font-size: 12px; margin: 0; padding: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 16px; font-weight: bold; }
        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total { border-top: 1px dashed #000; margin-top: 15px; padding-top: 10px; font-weight: bold; font-size: 14px; text-align: right; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style></head><body>
        <div class="header"><div class="title">THE COFFEE BAR</div><div>Date: ${new Date(order.createdAt).toLocaleString('en-US')}</div><div>Invoice: #${order.id} (Copy)</div></div>
        <div class="items">${order.items.map(item => `<div class="item"><span>${item.product?.name || 'Deleted Item'} x${item.quantity}</span><span>${(Number(item.price) * item.quantity).toLocaleString()}</span></div>`).join('')}</div>
        <div class="total">Net Total: ${Number(order.total).toLocaleString()} THB</div>
        <div class="footer">Thank you for your business!</div>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const maxSales = Math.max(...(stats.weeklySales?.map(d => Number(d.total)) || [0]), 1);

  const filteredOrders = stats.recentOrders.filter(order => {
    const term = searchTerm.toLowerCase();
    const idMatch = order.id.toString().includes(term);
    const productMatch = order.items.some(item => item.product?.name.toLowerCase().includes(term));
    return idMatch || productMatch;
  });

  const currentDayName = currentTime.toLocaleDateString('en-US', { weekday: 'short' });

  const renderProductImage = (image, fallbackText = '☕') => {
    if (image && (image.startsWith('/') || image.startsWith('http'))) {
        const src = image.startsWith('/uploads') ? `${API_URL}${image}` : image;
        return <img src={src} className="w-full h-full object-cover shadow-inner" alt="product" />;
    }
    return <span className="flex items-center justify-center h-full text-lg opacity-40">{fallbackText}</span>;
  };

  return (
    <div className="p-8 bg-[#F1F5F9] min-h-screen font-sans text-slate-800 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 p-4 rounded-[1.5rem] shadow-xl shadow-slate-200">
            <BarChart3 className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Weekly Analytics 📊</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Insights</p>
              <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 animate-pulse">
                <Info size={12}/> DATA RESETS EVERY SUNDAY AT 00:00 AM
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           {/* ✅ DATE & TIME FIXED: Year 2026 is explicitly included */}
           <div className="text-right hidden xl:block border-r border-slate-200 pr-6">
              <div className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                {currentTime.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second: '2-digit', hour12: true})}
              </div>
              <div className="text-[11px] font-black text-indigo-600 mt-2 uppercase tracking-widest">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
           </div>
           
           <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all w-80">
              <Search size={18} className="text-slate-400 mr-3"/>
              <input 
                 type="text" 
                 placeholder="Search by Invoice ID..." 
                 className="text-sm outline-none text-slate-600 w-full font-bold placeholder:text-slate-300"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <button 
             onClick={fetchDashboardData} 
             disabled={isLoading}
             className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
           >
             <RefreshCw size={16} className={isLoading ? "animate-spin" : ""}/>
             {isLoading ? "Syncing..." : "Refresh Data"}
           </button>
        </div>
      </div>

      {/* --- INVENTORY ALERT --- */}
      {lowStockItems.length > 0 && (
        <div className="mb-10">
           <div className="bg-white border-l-8 border-amber-500 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-md relative overflow-hidden">
             <div className="absolute right-0 top-0 text-slate-50 pointer-events-none -mr-12 -mt-12"><AlertTriangle size={220} /></div>
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-2xl"><AlertTriangle size={32}/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Stock Alert ⚠️</h3>
                   <p className="text-sm text-slate-500 font-bold">Detected <span className="text-amber-600 underline">{lowStockItems.length} items</span> below threshold.</p>
                </div>
             </div>
             <div className="flex-1 flex gap-4 overflow-x-auto pb-2 relative z-10 no-scrollbar">
                {lowStockItems.map((item, idx) => (
                   <div key={idx} className="bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl shadow-sm flex items-center gap-4 min-w-[260px]">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">{renderProductImage(item.image)}</div>
                      <div>
                        <p className="text-xs font-black text-slate-700 truncate w-32 uppercase">{item.name}</p>
                        <p className="text-[10px] font-black text-rose-500 mt-1">Stock: {item.stock} Units</p>
                      </div>
                   </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <StatCard 
          label="Weekly Revenue" 
          value={stats.weeklySales?.reduce((a,b) => a + Number(b.total), 0)} 
          unit="THB" 
          icon={<DollarSign size={24}/>} 
          color="emerald"
          desc="Accumulated Sales"
        />
        <StatCard 
          label="Total Orders" 
          value={stats.recentOrders?.length || 0} 
          unit="Orders" 
          icon={<ShoppingBag size={24}/>} 
          color="blue"
          desc="Completed Transactions"
        />

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Weekly Flow</p>
                <p className="text-xs font-bold text-slate-600 uppercase">Daily Revenue</p>
             </div>
             <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100"><BarChart3 size={20}/></div>
          </div>
          <div className="flex items-end justify-between gap-3 h-28 px-2">
            {stats.weeklySales?.map((day, idx) => {
                const heightPercent = (Number(day.total) / maxSales) * 100;
                const isToday = day.name === currentDayName;
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-900 text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl shadow-2xl transition-all z-50 whitespace-nowrap">
                            {Number(day.total).toLocaleString()} THB
                        </div>
                        <div className="w-full flex items-end justify-center h-full">
                           <div 
                              style={{ height: `${Math.max(heightPercent, 8)}%` }} 
                              className={`w-full max-w-[18px] rounded-full transition-all duration-1000 ${isToday ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.6)] ring-4 ring-indigo-50' : 'bg-slate-200 group-hover:bg-indigo-300'}`}
                           ></div>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day.name}</span>
                    </div>
                )
            })}
          </div>
        </div>
      </div>

      {/* --- GRIDS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[680px] overflow-hidden">
          <div className="p-8 border-b border-slate-50">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                <TrendingUp className="text-rose-500" size={24}/> Best Sellers
             </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
            {stats.topProducts.map((p, index) => (
              <div key={index} className="flex items-center gap-5 p-5 rounded-[2rem] bg-white hover:bg-slate-50 border border-slate-100 group shadow-sm transition-all">
                <div className="relative shrink-0">
                   <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex items-center justify-center">{renderProductImage(p.image)}</div>
                   <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white border-4 border-white shadow-xl ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'}`}>
                    {index + 1}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                   <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{p.name}</p>
                   <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">{Number(p.price).toLocaleString()} THB</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{p.qty} Sold</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[680px] overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  <Clock className="text-indigo-600" size={24}/> Transaction Log
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-9">Weekly Accumulated Data</p>
             </div>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Total</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                     <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-indigo-50/30 transition-all cursor-pointer group">
                        <td className="px-8 py-6">
                           <span className="font-black text-xs text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 uppercase tracking-tighter">#{order.id}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{new Date(order.createdAt).toLocaleDateString('en-US', {day:'2-digit', month:'short', weekday:'short'})}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(order.createdAt).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">
                           {Number(order.total).toLocaleString()} THB
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                              <CheckCircle2 size={12}/> PAID ✅
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:translate-x-1">
                              <ChevronRight size={20}/>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-white">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Order Details</h3>
                    <p className="text-[11px] font-black text-indigo-600 mt-1 font-mono tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded-md inline-block">Invoice: #{selectedOrder.id}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-400 border border-slate-100"><X size={28}/></button>
              </div>

              <div className="p-12 overflow-y-auto flex-1 bg-slate-50/30">
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 mb-10">
                    <div className="space-y-6">
                       {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                             <div className="flex gap-5">
                                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-[11px] font-black text-white">x{item.quantity}</div>
                                <div>
                                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.product?.name || 'Deleted Item'}</p>
                                   <p className="text-[11px] font-black text-slate-400 mt-1">{Number(item.price).toLocaleString()} THB / Unit</p>
                                </div>
                             </div>
                             <p className="text-sm font-black text-slate-900">{(Number(item.price) * item.quantity).toLocaleString()} THB</p>
                          </div>
                       ))}
                    </div>
                    <div className="mt-10 pt-10 border-t-4 border-dashed border-slate-50 flex justify-between items-end">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Net Total 💰</span>
                       <span className="text-5xl font-black text-slate-900 tracking-tighter">{Number(selectedOrder.total).toLocaleString()} <span className="text-sm">THB</span></span>
                    </div>
                 </div>
                 <div className="text-center px-10">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Timestamp 🕒</p>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{new Date(selectedOrder.createdAt).toLocaleString('en-US')}</p>
                 </div>
              </div>

              <div className="p-10 bg-white border-t border-slate-50">
                 <button onClick={() => handlePrintOldReceipt(selectedOrder)} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-indigo-600 shadow-2xl transition-all uppercase tracking-[0.2em] text-[12px]">
                    <Printer size={20}/> Re-Print Receipt 🖨️
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, icon, color, desc }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100 border-emerald-100 ring-emerald-50",
    blue: "bg-blue-50 text-blue-600 shadow-blue-100 border-blue-100 ring-blue-50"
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative border-b-8 border-b-transparent hover:border-b-indigo-500/30">
      <div className={`absolute -right-10 -bottom-10 opacity-5 group-hover:scale-125 transition-transform duration-1000 ${colors[color].split(' ')[1]}`}>
        {icon}
      </div>
      <div className="flex justify-between items-start mb-8">
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{desc}</p>
         </div>
         <div className={`p-4 rounded-[1.5rem] shadow-lg border ring-8 transition-all group-hover:rotate-12 ${colors[color]}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-3 relative z-10">
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{value.toLocaleString()}</h3>
        <span className="text-lg font-black text-slate-400 tracking-tight uppercase">{unit}</span>
      </div>
    </div>
  );
}

export default Dashboard;