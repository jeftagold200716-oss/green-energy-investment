const SUPABASE_URL = 'https://sbxtpvuieiokjawltqjq.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHRwdnVpZWlva2phd2x0cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDEwMzEsImV4cCI6MjA5Mzk3NzAzMX0.G-BtkLvLgswoxhQlRS7k68ykHb9EUWBrXSg1PVq3pgY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function handleSignUp() {
    const email = document.getElementById('auth_email').value;
    const password = document.getElementById('auth_pass').value;

    if (!email || !password) return alert("Fill all fields");

    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        alert(error.message);
    } else {
        // Create the profile entry automatically
        const { error: profileError } = await _supabase
            .from('profiles')
            .insert([{ id: data.user.id, wallet_balance: 0, total_deposited: 0 }]);
        
        if (!profileError) {
            alert("Registration successful! Please check your email for confirmation (if enabled) or proceed to Login.");
        }
    }
}

async function handleLogin() {
    const email = document.getElementById('auth_email').value;
    const password = document.getElementById('auth_pass').value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Login failed: " + error.message);
    } else {
        // Save session and redirect
        window.location.href = "index.html";
    }
}