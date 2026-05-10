const SUPABASE_URL = 'https://sbxtpvuieiokjawltqjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHRwdnVpZWlva2phd2x0cWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDEwMzEsImV4cCI6MjA5Mzk3NzAzMX0.G-BtkLvLgswoxhQlRS7k68ykHb9EUWBrXSg1PVq3pgY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isLoginMode = false;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Login' : 'Create Account';
    document.getElementById('primary-btn').innerText = isLoginMode ? 'LOGIN' : 'CREATE ACCOUNT';
    document.getElementById('toggle-btn').innerText = isLoginMode ? "Don't have an account? Register" : "Already have an account? Login";
    document.getElementById('reg-fields').style.display = isLoginMode ? 'none' : 'block';
}

async function handleAuth() {
    const phone = document.getElementById('auth_phone').value.trim();
    const password = document.getElementById('auth_pass').value;

    if (phone.length < 10) return alert("Enter valid phone number");
    if (password.length < 6) return alert("Password too short (min 6)");

    if (isLoginMode) {
        // --- LOGIN LOGIC ---
        const { error } = await _supabase.auth.signInWithPassword({
            email: `${phone}@phone.com`,
            password: password,
        });
        
        if (error) return alert(error.message);
        
        // SUCCESS: Redirect to the internal dashboard
        window.location.href = "dashboard.html"; 
    } else {
        // --- REGISTER LOGIC ---
        const confirm = document.getElementById('auth_confirm').value;
        const tnc = document.getElementById('auth_tnc').checked;

        if (password !== confirm) return alert("Passwords do not match");
        if (!tnc) return alert("Accept the T&C to continue");

        const { error } = await _supabase.auth.signUp({
            email: `${phone}@phone.com`,
            password: password,
        });

        if (error) return alert(error.message);
        
        alert("Registration successful! Now please login.");
        toggleAuthMode();
    }
}

// Force the page to start on "Registration" view
window.onload = () => {
    isLoginMode = false;
    const regFields = document.getElementById('reg-fields');
    if(regFields) regFields.style.display = 'block';
};
