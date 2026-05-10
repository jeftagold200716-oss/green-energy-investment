const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
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
    const phone = document.getElementById('auth_phone').value;
    const password = document.getElementById('auth_pass').value;

    if (phone.length < 10) return alert("Please enter a valid phone number");
    if (password.length < 6) return alert("Password must be at least 6 characters");

    if (isLoginMode) {
        // LOGIN LOGIC
        // Note: Supabase uses email/pass by default. For phone/pass, we use a trick: 
        // We format the phone as an email address internally (e.g., 080123@phone.com)
        const { data, error } = await _supabase.auth.signInWithPassword({
            email: `${phone}@phone.com`,
            password: password,
        });
        if (error) return alert(error.message);
        window.location.href = "index.html";
    } else {
        // REGISTER LOGIC
        const confirm = document.getElementById('auth_confirm').value;
        const tnc = document.getElementById('auth_tnc').checked;

        if (password !== confirm) return alert("Passwords do not match!");
        if (!tnc) return alert("Please accept the Terms & Conditions");

        const { data, error } = await _supabase.auth.signUp({
            email: `${phone}@phone.com`,
            password: password,
        });

        if (error) return alert(error.message);
        alert("Account created successfully! You can now login.");
        toggleAuthMode();
    }
}
