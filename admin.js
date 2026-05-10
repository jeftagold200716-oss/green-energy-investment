// Supabase Config
const SUPABASE_URL = 'https://sbxtpvuieiokjawltqjq.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHRwdnVpZWlva2phd2x0cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDEwMzEsImV4cCI6MjA5Mzk3NzAzMX0.G-BtkLvLgswoxhQlRS7k68ykHb9EUWBrXSg1PVq3pgY';
const _adminSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initAdmin() {
    loadDeposits();
    loadWithdrawals();
}

// 1. Publish Product
async function publishProduct() {
    const name = document.getElementById('p_name').value;
    const price = document.getElementById('p_price').value;
    const daily = document.getElementById('p_return').value;

    if(!name || !price || !daily) return alert("Fill all product details");

    const { error } = await _adminSupabase.from('products').insert([
        { name, price, daily_return: daily }
    ]);

    if (!error) {
        alert("Product is now LIVE!");
        location.reload();
    }
}

// 2. Load Deposits
async function loadDeposits() {
    const { data: deposits } = await _adminSupabase.from('deposits').select('*').eq('status', 'pending');
    const list = document.getElementById('deposit-list');
    
    deposits.forEach(dep => {
        list.innerHTML += `
            <tr class="border-t border-slate-700">
                <td class="p-5 font-bold">${dep.sender_name}</td>
                <td class="p-5 text-emerald-400">₦${dep.amount}</td>
                <td class="p-5 text-slate-500 text-xs">${new Date(dep.created_at).toLocaleDateString()}</td>
                <td class="p-5 text-right flex justify-end gap-2">
                    <button onclick="confirmDeposit('${dep.id}', '${dep.user_id}', ${dep.amount})" class="bg-emerald-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-500">Confirm & Credit</button>
                    <button onclick="deleteRequest('deposits', '${dep.id}')" class="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white">Delete</button>
                </td>
            </tr>
        `;
    });
}

// 3. Confirm Deposit Logic
async function confirmDeposit(id, userId, amount) {
    // 1. Fetch current user profile
    const { data: profile } = await _adminSupabase.from('profiles').select('*').eq('id', userId).single();

    // 2. Update balance and total_deposited
    const newBalance = parseFloat(profile.wallet_balance) + parseFloat(amount);
    const newTotalDep = parseFloat(profile.total_deposited) + parseFloat(amount);

    await _adminSupabase.from('profiles').update({ 
        wallet_balance: newBalance, 
        total_deposited: newTotalDep 
    }).eq('id', userId);

    // 3. Mark deposit as confirmed
    await _adminSupabase.from('deposits').update({ status: 'confirmed' }).eq('id', id);

    alert("User account credited!");
    location.reload();
}

// 4. Load Withdrawals
async function loadWithdrawals() {
    const { data: withdrawals } = await _adminSupabase.from('withdrawals').select('*').eq('status', 'pending');
    const list = document.getElementById('withdraw-list');
    
    withdrawals.forEach(wd => {
        list.innerHTML += `
            <tr class="border-t border-slate-700">
                <td class="p-5">
                    <p class="font-bold text-sm">${wd.bank_details}</p>
                </td>
                <td class="p-5 text-slate-400">₦${wd.amount_requested}</td>
                <td class="p-5 text-emerald-400 font-black text-lg">₦${wd.amount_to_pay}</td>
                <td class="p-5 text-right flex justify-end gap-2">
                    <button onclick="confirmWithdrawal('${wd.id}')" class="bg-emerald-600 px-4 py-2 rounded-lg text-xs font-bold">Paid</button>
                    <button onclick="deleteRequest('withdrawals', '${wd.id}')" class="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold">Reject</button>
                </td>
            </tr>
        `;
    });
}

async function confirmWithdrawal(id) {
    await _adminSupabase.from('withdrawals').update({ status: 'completed' }).eq('id', id);
    alert("Withdrawal marked as Paid");
    location.reload();
}

async function deleteRequest(table, id) {
    if(confirm("Are you sure you want to delete/reject this?")) {
        await _adminSupabase.from(table).delete().eq('id', id);
        location.reload();
    }
}

initAdmin();