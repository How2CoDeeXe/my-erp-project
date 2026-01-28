import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShoppingCart, Trash2, Plus, Edit2, X, Save, Package, 
  Image as ImageIcon, Upload, Coffee,
  CheckCircle, AlertCircle, Printer, Snowflake, Flame, 
  ChevronRight, CreditCard, Search, LayoutGrid, ListFilter,
  CalendarDays, ChevronDown 
} from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
// --- ✅ ส่วนที่เพิ่มใหม่: Component ย่อยสำหรับจัดการรูปภาพ (แก้จอขาว) ---
const ProductImage = ({ image, category }) => {
  const [hasError, setHasError] = useState(false);

  // ตรวจสอบว่ามีข้อมูลรูปภาพหรือไม่ (ไม่ว่าง และไม่ใช่คำว่า null)
  const hasImage = image && image !== '' && image !== 'null';

  // จัดการ URL: ถ้าเริ่มด้วย /uploads ให้เติม localhost, ถ้าไม่ ก็ใช้ค่าเดิม
const src =
  hasImage && image.startsWith('/uploads')
    ? `${API_URL}${image}`
    : image;

  // ถ้าไม่มีรูป หรือ โหลดรูปแล้ว Error -> ให้แสดง Emoji
  if (!hasImage || hasError) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center">
        <span className="text-6xl drop-shadow-sm filter grayscale-[0.1]">
           {category === 'dessert' ? '🍰' : '☕'}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={category} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      onError={() => setHasError(true)} // ถ้ารูปเสีย ให้เซ็ต State เป็น Error เพื่อสลับไปโชว์ Emoji
    />
  );
};
// -------------------------------------------------------------------

function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all'); 
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => { 
    fetchProducts(); 
  }, []);

  const addToCart = (product, tempType = 'hot') => {
    if (isEditMode) return;
    if (product.stock <= 0) return alert('Out of Stock');
    
    const extraPrice = tempType === 'cold' ? 10 : 0;
    const finalPrice = Number(product.price) + extraPrice;
    
    const typeLabel = tempType === 'cold' ? '(Cold)' : '(Hot)';
    const displayName = product.category === 'drink' ? `${product.name} ${typeLabel}` : product.name;
    
    const cartItemId = `${product.id}-${tempType}`;
    const existingItem = cart.find(item => item.cartItemId === cartItemId);
    
    if (existingItem) {
      if (existingItem.qty >= product.stock) return alert('Insufficient Stock');
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartItemId, name: displayName, price: finalPrice, qty: 1, tempType }]);
    }
  };

  const removeFromCart = (cartItemId) => setCart(cart.filter(item => item.cartItemId !== cartItemId));
  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const processPayment = async () => {
    try {
      const res = await api.post('/orders', { items: cart.map(item => ({ id: item.id, qty: item.qty, price: item.price })), total: totalAmount });
      setLastOrder({ id: res.data.order.id, items: [...cart], total: totalAmount });
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      setCart([]);
      fetchProducts();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
      setShowCheckoutModal(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastOrder) return;
    const printWindow = window.open('', '', 'width=350,height=600');
    const htmlContent = `
      <html><head><title>Receipt</title><style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .brand { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .meta { font-size: 10px; color: #777; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .item span:first-child { font-weight: 500; }
        .total { border-top: 2px solid #333; margin-top: 15px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; }
      </style></head><body>
        <div class="header">
            <div class="brand">THE COFFEE BAR</div>
        </div>
        <div class="meta">
            <div>Date: ${new Date().toLocaleString()}</div>
            <div>Order ID: #${lastOrder.id}</div>
        </div>
        <div class="items">${lastOrder.items.map(item => `<div class="item"><span>${item.name} x${item.qty}</span><span>${(item.price * item.qty).toLocaleString()}</span></div>`).join('')}</div>
        <div class="total"><span>TOTAL</span><span>${lastOrder.total.toLocaleString()} THB</span></div>
        <div class="footer">Thank you for your visit.</div>
      </body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = e.target.imageFile.files[0];
    
    if (!file && editingProduct.image) {
      formData.set('image', editingProduct.image);
    }
    
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingProduct.id) {
        await api.put(`/products/${editingProduct.id}`, formData, config);
      } else {
        await api.post('/products', formData, config);
      }
      fetchProducts();
      setEditingProduct(null);
      setPreviewImage(null);
    } catch { alert('Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); fetchProducts(); } catch { alert('Delete failed'); }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      
      {/* --- LEFT PANEL: Product Grid --- */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <div className="bg-white h-20 px-6 border-b border-gray-200 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gray-900 p-2.5 rounded-lg">
                <Coffee className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">THE COFFEE BAR</h1>
              <p className="text-xs text-gray-400 font-medium">Point of Sale System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             {/* Date & Time Display */}
             <div className="text-right hidden md:block">
                <div className="text-2xl font-semibold text-gray-700 tabular-nums tracking-tight leading-none">
                    {currentTime.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="text-xs text-gray-400 font-medium mt-1 flex items-center justify-end gap-1">
                    <CalendarDays size={10} />
                    {currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
             </div>

             <button 
                onClick={() => setIsEditMode(!isEditMode)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isEditMode ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
             >
                {isEditMode ? <><Save size={16}/> Done Editing</> : <><Edit2 size={16}/> Manage Menu</>}
             </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-4 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
           <div className="flex gap-2">
              {['all', 'drink', 'dessert'].map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)} 
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategory === cat ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}
                >
                  {cat === 'all' ? 'All Items' : cat === 'drink' ? 'Drinks' : 'Desserts'}
                </button>
              ))}
           </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-20">
            {/* Add New Card */}
            {isEditMode && (
              <div onClick={() => { setEditingProduct({ category: 'drink' }); setPreviewImage(null); }} className="bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all h-[260px] group">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                    <Plus size={24} className="text-gray-400 group-hover:text-indigo-600" />
                </div>
                <span className="text-gray-500 font-medium text-sm group-hover:text-indigo-600">Add New Product</span>
              </div>
            )}

            {/* Product Cards */}
            {products.filter(p => activeCategory === 'all' || p.category === activeCategory).map((p) => (
              <div key={p.id} className={`group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-[260px] flex flex-col overflow-hidden relative ${p.stock === 0 ? 'opacity-60' : ''}`}>
                
                {/* Image Area */}
                <div className="h-[140px] w-full bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    
                    {/* ✅ เปลี่ยนมาเรียกใช้ Component ใหม่ที่นี่ */}
                    <ProductImage image={p.image} category={p.category} />
                    
                    {/* Stock Tag */}
                    {!isEditMode && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-600 shadow-sm border border-gray-100">
                            {p.stock} left
                        </div>
                    )}

                    {/* Edit Mode Overlay */}
                    {isEditMode && (
                      <div className="absolute inset-0 bg-gray-900/40 z-20 flex items-center justify-center gap-3 animate-in fade-in">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setPreviewImage(p.image); }} className="p-2.5 bg-white text-indigo-600 rounded-full shadow-lg hover:bg-indigo-50 transition-all"><Edit2 size={18}/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-2.5 bg-white text-red-500 rounded-full shadow-lg hover:bg-red-50 transition-all"><Trash2 size={18}/></button>
                      </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-white relative z-10">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">{p.name}</h3>
                    <p className="text-indigo-600 font-bold text-base">{p.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">THB</span></p>
                  </div>
                  
                  {!isEditMode && p.stock > 0 && (
                    <div className="mt-3">
                        {p.category === 'drink' ? (
                            <div className="flex gap-2">
                              <button onClick={() => addToCart(p, 'hot')} className="flex-1 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center gap-1">
                                <Flame size={12}/> Hot
                              </button>
                              <button onClick={() => addToCart(p, 'cold')} className="flex-1 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1">
                                <Snowflake size={12}/> Cold
                              </button>
                            </div>
                        ) : (
                            <button onClick={() => addToCart(p, 'hot')} className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group-hover:gap-3">
                                Add to Order <ChevronRight size={12} />
                            </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: Professional Cart --- */}
      <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl">
        
        {/* Cart Header */}
        <div className="h-20 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-indigo-600"/> Current Order
            </h2>
            <div className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200">
                {cart.reduce((a,b)=>a+b.qty,0)} Items
            </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ListFilter size={24} className="text-gray-400" />
                </div>
                <p className="font-medium text-sm text-gray-400">No items added yet</p>
            </div>
          ) : (
             <div className="space-y-3">
                 {cart.map((item) => (
                  <div key={item.cartItemId} className="flex flex-col bg-white p-4 rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group transition-all hover:border-indigo-200">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3 overflow-hidden">
                             {/* Clean Temp Indicator */}
                             {item.tempType && (
                                 <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${item.tempType === 'cold' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                             )}
                             <div>
                                 <h4 className="font-semibold text-gray-700 text-sm leading-tight">{item.name}</h4>
                                 <p className="text-xs text-gray-400 mt-0.5">{item.price.toLocaleString()} THB / unit</p>
                             </div>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                    
                    {/* Qty Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <span className="text-xs font-bold text-gray-600 px-3 py-0.5">Qty: {item.qty}</span>
                        </div>
                        <button onClick={() => removeFromCart(item.cartItemId)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14}/>
                        </button>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-6">
                <span className="text-sm font-medium text-gray-500">Total Amount</span>
                <div className="text-right">
                    <span className="font-bold text-3xl text-gray-900 tracking-tight">{totalAmount.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 font-medium ml-1">THB</span>
                </div>
            </div>
            
            <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0} 
                className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
                <CreditCard size={18}/> Process Payment
            </button>
        </div>
      </div>

      {/* --- MODAL: Edit Product --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Product Name</label>
                <input name="name" defaultValue={editingProduct.name} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Americano" />
              </div>
              
              {/* --- Category Selection --- */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                <div className="relative">
                    <select 
                        name="category" 
                        defaultValue={editingProduct.category || 'drink'} 
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                    >
                        <option value="drink">☕ Drink (Coffee/Tea)</option>
                        <option value="dessert">🍰 Dessert (Cake/Bakery)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
              {/* --------------------------- */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Price (THB)</label>
                    <input name="price" type="number" defaultValue={editingProduct.price} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00"/>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Stock Qty</label>
                    <input name="stock" type="number" defaultValue={editingProduct.stock || 0} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0"/>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product Image</label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {previewImage || editingProduct.image ? (
<img
  src={
    previewImage ||
    (editingProduct.image?.startsWith('/uploads')
      ? `${API_URL}${editingProduct.image}`
      : editingProduct.image)
  }
  className="w-full h-full object-cover"
  alt="Preview"
/>


                      ) : (<ImageIcon size={24} className="text-gray-300"/>)}
                  </div>
                  <div className="flex-1 space-y-3">
                      <label className="block cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg text-xs font-medium text-center transition-colors">
                        Choose File
                        <input type="file" name="imageFile" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files[0]) setPreviewImage(URL.createObjectURL(e.target.files[0])); }} />
                      </label>
                      <input type="text" name="image" defaultValue={editingProduct?.image || ''} placeholder="Or paste image URL" className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        onChange={(e) => { const val = e.target.value; setEditingProduct(prev => ({ ...prev, image: val })); if (val.startsWith('http')) setPreviewImage(val); }} />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Confirm Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Payment</h3>
            <p className="text-sm text-gray-500 mb-6">Total amount to be charged</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
                <span className="block text-4xl font-bold text-gray-900 tracking-tight">{totalAmount.toLocaleString()} <span className="text-base font-normal text-gray-500">THB</span></span>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-3 rounded-lg font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={processPayment} className="flex-1 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-2xl p-10 w-full max-w-sm text-center shadow-2xl relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h3>
            <p className="text-gray-500 text-sm mb-8">The order has been processed successfully.</p>
            
            <div className="space-y-3">
              <button onClick={handlePrintReceipt} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors text-sm">
                <Printer size={18}/> Print Receipt
              </button>
              <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors">
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;