// 1. Supabase Configuration
const SUPABASE_URL = 'https://sbxtpvuieiokjawltqjq.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHRwdnVpZWlva2phd2x0cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDEwMzEsImV4cCI6MjA5Mzk3NzAzMX0.G-BtkLvLgswoxhQlRS7k68ykHb9EUWBrXSg1PVq3pgY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Management
let currentUser = null;

// 2. Initialize App
async function initApp() {
    // For this build, we assume the user session is handled or fixed for testing
    // In a real app, use _supabase.auth.getUser()
    fetchProducts();
    updateUI();
}

// 3. Fetch Products from Admin Table
async function fetchProducts() {
    const { data: products, error } = await _supabase
        .from('products')
        .select('*')
        .order('price', { ascending: true });

    if (error) return console.error("Error loading products:", error);

    const container = document.getElementById('product-container');
    container.innerHTML = ''; 

    products.forEach(product => {
        const productHtml = `
            <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div class="flex justify-between items-start">
                    <div class="flex gap-3">
                        <div class="bg-emerald-50 p-3 rounded-2xl">
                            <img src="${product.image_url || 'https://img.icons8.com/fluency/48/solar-panel.png'}" class="w-8 h-8"/>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800">${product.name}</h4>
                            <p class="text-xs text-slate-400 font-medium">ROI: 24-Hour Cycle</p>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
                    <div>
                        <p class="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Investment</p>
                        <p class="text-lg font-black text-emerald-600">₦${Number(product.price).toLocaleString()}</p>
                    </div>
                    <div class="text-center px-4">
                        <p class="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Daily Return</p>
                        <p class="text-md font-bold text-slate-700">₦${Number(product.daily_return).toLocaleString()}</p>
                    </div>
                    <button onclick="buyProduct('${product.id}', ${product.price})" class="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-600">Invest</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', productHtml);
    });
}

// 4. Deposit Logic (WhatsApp & DB)
async function initiateDeposit() {
    const name = document.getElementById('dep_name').value;
    const amount = document.getElementById('dep_amount').value;
    const proofFile = document.getElementById('dep_proof').files[0];

    if (!name || !amount || !proofFile) {
        return alert("Please fill all fields and upload a screenshot.");
    }

    // WhatsApp Message
    const adminWhatsApp = "237698771429"; // REPLACE WITH YOUR NUMBER
    const message = `*NEW DEPOSIT REQUEST*%0A` +
                    `Name: ${name}%0A` +
                    `Amount: ₦${amount}%0A` +
                    `Status: Payment Made. Check Admin Panel for Screenshot.`;

    // Save to Supabase 'deposits' table
    const { error } = await _supabase.from('deposits').insert([
        { sender_name: name, amount: amount, status: 'pending' }
    ]);

    if (!error) {
        alert("Request logged. Redirecting to WhatsApp for final proof...");
        window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
        toggleModal('depositModal', false);
    }
}

// 5. Withdrawal Logic (The 5k Rules)
async function initiateWithdraw() {
    const amount = parseFloat(document.getElementById('wd_amount').value);
    const bank = document.getElementById('wd_bank').value;
    const account = document.getElementById('wd_account').value;

    // Fetch user profile for validation
    const { data: profile } = await _supabase.from('profiles').select('*').single();

    if (amount < 5000) return alert("Minimum withdrawal is ₦5,000");
    if (profile.total_deposited < 5000) return alert("Total deposit must be ₦5,000+ to withdraw.");
    if (amount > profile.wallet_balance) return alert("Insufficient balance.");

    const fee = amount * 0.20; // 20% Fee
    const payable = amount - fee;

    // 1. Debit account immediately (as requested)
    const { error: updateErr } = await _supabase
        .from('profiles')
        .update({ wallet_balance: profile.wallet_balance - amount })
        .eq('id', profile.id);

    if (!updateErr) {
        // 2. Log request for Admin
        await _supabase.from('withdrawals').insert([{
            user_id: profile.id,
            amount_requested: amount,
            amount_to_pay: payable,
            bank_details: `${bank} - ${account}`,
            status: 'pending'
        }]);

        alert(`Request Sent! ₦${payable} will be sent after 20% fee.`);
        toggleModal('withdrawModal', false);
        updateUI();
    }
}

// 6. Investment Logic
async function buyProduct(productId, price) {
    const { data: profile } = await _supabase.from('profiles').select('*').single();

    if (profile.wallet_balance < price) {
        return alert("Insufficient balance to buy this tier. Please deposit first.");
    }

    // Deduct balance and add to investments
    await _supabase.from('profiles').update({ 
        wallet_balance: profile.wallet_balance - price 
    }).eq('id', profile.id);

    await _supabase.from('user_investments').insert([{
        user_id: profile.id,
        product_id: productId,
        status: 'active'
    }]);

    alert("Investment successful! Profit starts in 24 hours.");
    updateUI();
}

// UI Helpers
function toggleModal(id, show) {
    const modal = document.getElementById(id);
    show ? modal.classList.add('active') : modal.classList.remove('active');
}

async function updateUI() {
    const { data: profile } = await _supabase.from('profiles').select('wallet_balance').single();
    if (profile) {
        document.getElementById('balance').innerText = `₦${Number(profile.wallet_balance).toLocaleString()}`;
    }
}

// Start
initApp();