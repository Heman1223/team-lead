import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Eye, EyeOff, AlertCircle, 
    User, Briefcase, BarChart, 
    ChevronRight, Mail, Lock, UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'team_member'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await register(formData.name, formData.email, formData.password, formData.role);
            if (result.success) {
                // Get the user data to check role for redirection
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData?.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.message || 'Sign Up failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page-wrapper" style={{ 
            minHeight: '100vh', 
            backgroundColor: '#F5ECE5', 
            fontFamily: 'var(--font-primary)',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #F5ECE5 0%, #DBC1AD 100%)'
        }}>
            <Navbar onMenuToggle={() => {}} />

            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '40px 20px'
            }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="auth-container"
                    style={{ 
                        width: '100%', 
                        maxWidth: '1000px', 
                        display: 'flex', 
                        borderRadius: '0px', 
                        overflow: 'visible', 
                        boxShadow: '0 30px 80px rgba(62, 39, 35, 0.2)',
                        backgroundColor: 'white',
                        minHeight: '550px',
                        position: 'relative'
                    }}
                >
                    {/* Left Side - Info Panel */}
                    <div className="auth-info-panel" style={{ 
                    flex: '1', 
                    background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)', 
                    color: 'white', 
                    padding: '60px 45px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    clipPath: 'polygon(0% 0%, 93% 0%, 100% 50%, 93% 100%, 0% 100%)',
                    position: 'relative',
                    zIndex: 1
                }}>        <div style={{ textAlign: 'center', marginBottom: '35px', paddingRight: '15px' }}>
                            <div style={{ 
                                width: '90px', 
                                height: '90px', 
                                background: 'rgba(255,255,255,0.08)', 
                                borderRadius: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                margin: '0 auto 20px',
                                border: '1.5px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <img src="/logo.jpeg" alt="Logo" style={{ width: '70px', height: '70px', borderRadius: '15px' }} />
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '6px', letterSpacing: '2px', fontFamily: 'var(--font-heading)', color: '#FDFCFB' }}>PROJECT PORTAL</h1>
                            <p style={{ fontSize: '1.1rem', opacity: 1, fontWeight: '600', letterSpacing: '0.5px', color: '#F5ECE5' }}>Connecting Ideas, Driving Success</p>
                        </div>

                        <div style={{ marginBottom: '40px', paddingRight: '15px' }}>
                            <p style={{ lineHeight: '1.6', opacity: 1, fontSize: '0.95rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto', color: '#F5ECE5' }}>
                                Empowering your team with a seamless, precise, and premium project and lead management experience.
                                Manage leads, track projects, and analyze performance efficiently.
                            </p>
                        </div>

                        <div className="features-mini-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '300px', margin: '0 auto', paddingRight: '15px' }}>
                            {[
                                { icon: <User size={20} />, label: "Lead Intelligence" },
                                { icon: <Briefcase size={20} />, label: "Project Collaboration" },
                                { icon: <BarChart size={20} />, label: "Performance Analytics" }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '5px 0' }}>
                                    <div style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: '#FDFCFB',
                                        opacity: 0.9
                                    }}>
                                        {item.icon}
                                    </div>
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center Decoration Arrow - Moved outside clipped panel to prevent cutting */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '50%',
                        top: '50%', 
                        transform: 'translate(-50%, -50%)',
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        padding: '4px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#3E2723',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <ChevronRight size={24} />
                        </div>
                    </div>

                    {/* Right Side - Form Panel */}
                    <div className="auth-form-panel" style={{ 
                        flex: '1', 
                        backgroundColor: '#F5ECE5', 
                        padding: '60px 45px 60px 65px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                            <h2 style={{ fontSize: '2.4rem', color: '#1A110B', marginBottom: '10px', fontFamily: 'var(--font-heading)', fontWeight: '900' }}>
                                Create Account
                            </h2>
                            <p style={{ color: '#5C4033', opacity: 0.6, fontSize: '0.95rem', fontWeight: '500' }}>
                                Select your role to get started
                            </p>
                        </div>

                        {/* Role Selector Tabs - Pill-like design */}
                        <div style={{ 
                            display: 'flex', 
                            background: 'white', 
                            borderRadius: '8px', 
                            padding: '4px', 
                            marginBottom: '25px',
                            border: '1px solid #DBC1AD'
                        }}>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, role: 'team_member'})}
                                style={{ 
                                    flex: 1, 
                                    padding: '10px', 
                                    borderRadius: '6px', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: formData.role === 'team_member' ? '#3E2723' : 'transparent',
                                    color: formData.role === 'team_member' ? 'white' : '#8D6E63'
                                }}
                            >
                                Member
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, role: 'team_lead'})}
                                style={{ 
                                    flex: 1, 
                                    padding: '10px', 
                                    borderRadius: '6px', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: formData.role === 'team_lead' ? '#3E2723' : 'transparent',
                                    color: formData.role === 'team_lead' ? 'white' : '#8D6E63'
                                }}
                            >
                                Lead
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, role: 'admin'})}
                                style={{ 
                                    flex: 1, 
                                    padding: '10px', 
                                    borderRadius: '6px', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: formData.role === 'admin' ? '#3E2723' : 'transparent',
                                    color: formData.role === 'admin' ? 'white' : '#8D6E63'
                                }}
                            >
                                Admin
                            </button>
                        </div>

                        {error && (
                            <div style={{ 
                                padding: '15px 20px', 
                                backgroundColor: '#FEF2F2', 
                                color: '#B91C1C', 
                                borderRadius: '12px', 
                                marginBottom: '30px', 
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                border: '1px solid #FEE2E2',
                                fontWeight: '500'
                            }}>
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#1A110B' }}>Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                placeholder="Your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #DBC1AD',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: 'white'
                                }}
                                className="input-focus"
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#1A110B' }}>Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #DBC1AD',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: 'white'
                                }}
                                className="input-focus"
                            />
                        </div>

                        <div className="form-group" style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#1A110B' }}>Password</label>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #DBC1AD',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: 'white'
                                }}
                                className="input-focus"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ 
                                    position: 'absolute', 
                                    right: '16px', 
                                    top: '38px', 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#A1887F', 
                                    cursor: 'pointer' 
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button 
                            disabled={loading}
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                backgroundColor: '#3E2723', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                fontWeight: '700',
                                fontSize: '1.05rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(62, 39, 35, 0.2)'
                            }}
                            className="login-btn-hover"
                        >
                            {loading ? 'Processing...' : 'Sign Up'}
                        </button>

                            <div style={{ textAlign: 'center', marginTop: '25px' }}>
                                <p style={{ fontSize: '1rem', color: '#5C4033', fontWeight: '500' }}>
                                    Already have an account? 
                                    <button 
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            color: '#A16D47', 
                                            fontWeight: '800', 
                                            cursor: 'pointer', 
                                            marginLeft: '8px',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        Login here
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>

            <Footer />

            <style>{`
                .input-focus:focus {
                    border-color: #5D4037 !important;
                    box-shadow: 0 0 0 4px rgba(93, 64, 55, 0.1);
                }
                .login-btn-hover:hover {
                    transform: translateY(-3px);
                    background-color: #3E2723 !important;
                    box-shadow: 0 20px 45px rgba(62, 39, 35, 0.4) !important;
                }
                @media (max-width: 950px) {
                    .auth-container { flex-direction: column; max-width: 550px !important; }
                    .auth-info-panel { padding: 50px 40px !important; }
                    .auth-info-panel div[style*="position: absolute"] { display: none !important; }
                    .auth-form-panel { padding: 50px 40px !important; }
                    h1 { font-size: 2.5rem !important; }
                    h2 { font-size: 2.2rem !important; }
                }
            `}</style>
        </div>
    );
};

export default Register;
