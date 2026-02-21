import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, Briefcase, CheckCircle2 } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/img.jpeg';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'team_lead'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'email' || e.target.name === 'password') {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        setError('');

        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                result = await register(formData.name, formData.email, formData.password, formData.role);
            }

            if (result.success) {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData?.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.message || 'Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#FAF9F8]">
            {/* Left Side - Branding & Info */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex w-1/2 bg-[#3E2723] relative overflow-hidden flex-col justify-between p-16 text-[#D7CCC8]"
            >
                {/* Background Patterns */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="#D7CCC8" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-4 mb-20"
                    >
                        {/* 
                            TODO: PLACE YOUR LOGO FILE IN `client/public/logo.png` 
                            If your file has a different name or extension (e.g., .jpg, .svg), update the src below.
                        */}
                        {/* 
                            Using custom logo from src/assets/img.jpeg
                        */}
                        {/* 
                            ZOOM CONTROL: 
                            - Change `scale-150` to `scale-100`, `scale-125`, etc. to adjust zoom.
                            - Or use arbitrary values like `scale-[2]` for 2x zoom.
                        */}
                        <div className="w-20 h-20 rounded-full border-2 border-[#D7CCC8] shadow-lg overflow-hidden flex items-center justify-center">
                            <img src={logoImg} alt="Logo" className="w-full h-full object-cover scale-125" />
                        </div>
                        <span className="text-xl tracking-widest uppercase font-light text-[#D7CCC8]">Project and Lead Management</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-6xl font-bold leading-tight mb-8 text-[#FAF9F8]"
                    >
                        Manage your <br />
                        <span className="text-[#D7CCC8]">Projects</span> with <br />
                        Confidence.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-xl max-w-md text-[#D7CCC8]/80 leading-relaxed"
                    >
                        Streamline your workflow, track progress, and boost productivity with our intuitive management platform.
                    </motion.p>
                </div>

                {/* Footer / Copyright */}
                {/* Footer Removed as per request */}
            </motion.div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 relative flex items-center justify-center p-8 lg:p-16 bg-[#FAF9F8] overflow-hidden">
                {/* Animated Background Blobs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -top-20 -right-20 w-96 h-96 bg-[#D7CCC8]/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, -90, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#3E2723]/10 rounded-full blur-3xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-md relative z-10 bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50"
                >
                    {/* Logo Placeholder (Mobile Only) */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        <div className="w-16 h-16 bg-[#3E2723] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                            <Briefcase className="w-8 h-8 text-[#FAF9F8]" />
                        </div>
                    </div>

                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-bold text-[#3E2723] mb-3">
                            {isLogin ? 'Welcome Back' : 'Get Started'}
                        </h2>
                        <p className="text-[#3E2723]/60">
                            {isLogin ? 'Please enter your details to sign in.' : 'Create an account to join the team.'}
                        </p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative mb-1">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            placeholder=" "
                                            value={formData.name}
                                            onChange={handleChange}
                                            required={!isLogin}
                                            className="peer w-full px-5 pt-6 pb-2 bg-white/50 border-2 border-[#D7CCC8]/50 rounded-xl focus:border-[#3E2723] focus:bg-white text-[#3E2723] outline-none transition-all"
                                        />
                                        <label
                                            htmlFor="name"
                                            className="absolute left-5 top-2 text-xs font-bold text-[#3E2723] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-[#3E2723]/60 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-[#3E2723] pointer-events-none"
                                        >
                                            Full Name
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder=" "
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="peer w-full px-5 pt-6 pb-2 bg-white/50 border-2 border-[#D7CCC8]/50 rounded-xl focus:border-[#3E2723] focus:bg-white text-[#3E2723] outline-none transition-all"
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-5 top-2 text-xs font-bold text-[#3E2723] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-[#3E2723]/60 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-[#3E2723] pointer-events-none"
                            >
                                Email Address
                            </label>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                id="password"
                                placeholder=" "
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="peer w-full px-5 pt-6 pb-2 bg-white/50 border-2 border-[#D7CCC8]/50 rounded-xl focus:border-[#3E2723] focus:bg-white text-[#3E2723] outline-none transition-all"
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-5 top-2 text-xs font-bold text-[#3E2723] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-[#3E2723]/60 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-[#3E2723] pointer-events-none"
                            >
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3E2723]/50 hover:text-[#3E2723]"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative">
                                        <select
                                            name="role"
                                            id="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="peer w-full px-5 pt-6 pb-2 bg-white/50 border-2 border-[#D7CCC8]/50 rounded-xl focus:border-[#3E2723] focus:bg-white text-[#3E2723] appearance-none cursor-pointer outline-none transition-all"
                                        >
                                            <option value="team_lead">Team Lead</option>
                                            <option value="team_member">Team Member</option>
                                        </select>
                                        <label
                                            htmlFor="role"
                                            className="absolute left-5 top-2 text-xs font-bold text-[#3E2723] pointer-events-none"
                                        >
                                            Role
                                        </label>
                                        <ArrowRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3E2723]/50 rotate-90 pointer-events-none" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#3E2723] text-[#FAF9F8] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center lg:text-left">
                        <p className="text-[#3E2723]/70">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', password: '', role: 'team_lead' }); }}
                                className="ml-2 font-bold text-[#3E2723] hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
