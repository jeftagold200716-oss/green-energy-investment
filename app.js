// 1. Supabase Configuration
const SUPABASE_URL = 'https://sbxtpvuieiokjawltqjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHRwdnVpZWlva2phd2x0cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDEwMzEsImV4cCI6MjA5Mzk3NzAzMX0.G-BtkLvLgswoxhQlRS7k68ykHb9EUWBrXSg1PVq3pgY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Initialize App
async function initApp() {
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session) {
        console.log("No active session, products will load as public.");
    } else {
        updateUI(session.user.id);
    }
    
    fetchProducts();
}

// 3. Fetch Products from Admin Table
async function fetchProducts() {
    console.log("Syncing with market...");
    
    const { data: products, error } = await _supabase
        .from('products')
        .select('*')
        .order('price', { ascending: true });

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    const container = document.getElementById('product-container');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <p class="text-slate-400 text-xs font-bold uppercase tracking-tighter">No investment plans active yet.</p>
            </div>`;
        return;
    }

    container.innerHTML = ''; // Clear loading spinner

    products.forEach(p => {
        // --- BIGGER CARDS & DURATION LOGIC ---
        const productHtml = `
            <div class="bg-white p-8 rounded-[3rem] shadow-md border border-slate-100 relative overflow-hidden mb-8 transition-transform active:scale-95">
                <div class="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-5 py-2 rounded-bl-2xl uppercase tracking-widest">
                    Active Plan
                </div>
                
                <div class="mb-6">
                    <h3 class="font-black text-slate-800 text-2xl mb-1 uppercase tracking-tighter">${p.name}</h3>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p class="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                            Contract: ${p.duration_days || p.validity_days || '90'} Days
                        </p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Daily Income</span>
                        <span class="text-emerald-600 font-black text-xl">₦${Number(p.daily_return).toLocaleString()}</span>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price</span>
                        <span class="text-slate-800 font-black text-xl">₦${Number(p.price).toLocaleString()}</span>
                    </div>
                </div>

                <button onclick="buyProduct('${p.id}', ${p.price})" class="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] text-lg shadow-xl shadow-slate-200 hover:bg-emerald-700 transition-colors uppercase tracking-tight">
                    Start Investing Now
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', productHtml);
    });
}

// 4. UI Helpers (Balance Display)
async function updateUI(userId) {
    if (!userId) return;
    
    const { data: profile, error } = await _supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Profile Fetch Error:", error.message);
        return;
    }

    const balanceEl = document.getElementById('balance');
    if (balanceEl && profile) {
        balanceEl.innerText = `₦${Number(profile.wallet_balance).toLocaleString()}`;
    }
}

// 5. Investment Logic
async function buyProduct(productId, price) {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (!user) {
        alert("Please login to invest!");
        return;
    }

    const { data: profile } = await _supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

    if (profile.wallet_balance < price) {
        return alert("⚠️ Insufficient Balance! Please deposit more funds.");
    }

    // Process Purchase
    const { error: invError } = await _supabase.from('user_investments').insert([
        { user_id: user.id, product_id: productId, amount: price, status: 'active' }
    ]);

    if (invError) {
        alert("Transaction Failed: " + invError.message);
    } else {
        // Deduct balance
        await _supabase.from('profiles').update({ 
            wallet_balance: profile.wallet_balance - price 
        }).eq('id', user.id);

        alert("🎉 Investment Successful!");
        location.reload(); 
    }
}

// Global helper for modals
function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    show ? modal.classList.add('active') : modal.classList.remove('active');
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);
