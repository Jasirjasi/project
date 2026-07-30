import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-redirect if already logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                navigate('/admin/dashboard');
            }
        });
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (loginError) throw loginError;
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-brand">
                    <div className="admin-brand-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h2>Admin Portal</h2>
                    <p className="admin-login-subtitle">Sign in to manage client wedding configurations</p>
                </div>
                {error && <div className="admin-error">{error}</div>}
                <form onSubmit={handleLogin} className="admin-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="admin-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
