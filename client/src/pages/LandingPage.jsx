import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Users, Target, ShieldCheck,
    Zap, Clock, Layout, ArrowRight,
    Calculator, LineChart, Globe, Trophy
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    // Data for Project Velocity
    const velocityData = [
        { name: '82%', value: 82 },
        { name: '94%', value: 94 },
        { name: '88%', value: 88 },
        { name: '96%', value: 96 },
        { name: '91%', value: 91 },
        { name: '85%', value: 85 },
        { name: '89%', value: 89 },
    ];

    // Data for Lead Conversion %
    const conversionData = [
        { label: 'Leads', value: 95, fill: '#8B5CF6' },      // Violet
        { label: 'Intake', value: 88, fill: '#10B981' },     // Emerald
        { label: 'Conversion', value: 92, fill: '#EF4444' }, // Red
        { label: 'Closed', value: 85, fill: '#F59E0B' },     // Amber
        { label: 'Quality', value: 78, fill: '#3B82F6' },    // Blue
        { label: 'Completed', value: 100, fill: '#5D4037' }, // Brown
    ];

    // Data for Team Performance
    const performanceData = [
        { name: 'High', value: 45, fill: '#8B5CF6' },
        { name: 'Mid', value: 30, fill: '#10B981' },
        { name: 'Low', value: 25, fill: '#F59E0B' },
    ];

    const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page" style={{ backgroundColor: '#ffffff', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
            <Navbar onMenuToggle={() => { }} />

            <main style={{ maxWidth: '1400px', margin: '40px auto 120px', padding: '0 20px' }}>
                <div className="unified-card animate-on-scroll" style={{ 
                    background: 'var(--bg-soft)', 
                    borderRadius: '12px', 
                    padding: '60px 40px',
                    boxShadow: 'var(--shadow-lg)',
                    textAlign: 'center'
                }}>
                    {/* Hero Section Container */}
                    <div className="hero-content" style={{ marginBottom: '80px' }}>
                        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                            <img src="/logo.jpeg" alt="Logo" style={{ width: '120px', height: '120px', borderRadius: '20px', display: 'inline-block' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div className="hero-badge" style={{ 
                                background: '#ffffff', 
                                color: 'var(--primary-brand)', 
                                padding: '10px 30px', 
                                borderRadius: '100px', 
                                fontSize: '0.85rem', 
                                fontWeight: '800', 
                                letterSpacing: '2px', 
                                display: 'inline-block', 
                                marginBottom: '35px',
                                textTransform: 'uppercase',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                Project and Lead Management
                            </div>
                            <h1 className="hero-title-gradient">
                                Welcome to <br />
                                <span>AVANI ENTERPRISES</span>
                            </h1>
                        </div>
                        <p style={{ 
                            maxWidth: '800px', 
                            margin: '0 auto 50px', 
                            fontSize: '1.1rem', 
                            lineHeight: '1.6', 
                            color: 'var(--text-secondary)', 
                            fontWeight: '500'
                        }}>
                            Avani Enterprises provides the ultimate digital workspace for team collaboration, 
                            lead intelligence, and automated performance tracking. 
                            Transform your workflow from chaos to clarity.
                        </p>
                        <div style={{ display: 'flex', gap: '25px', justifyContent: 'center' }}>
                            <button 
                                className="btn-primary-hero" 
                                onClick={() => navigate('/login')}
                                style={{ 
                                    background: 'var(--primary-brand)', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '12px 30px', 
                                    borderRadius: '15px', 
                                    fontWeight: '700', 
                                    fontSize: '1rem', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                                    boxShadow: 'var(--shadow-xl)'
                                }}
                            >
                                Login <ArrowRight size={18} />
                            </button>
                            <button 
                                className="btn-secondary-hero" 
                                onClick={() => navigate('/register')}
                                style={{ 
                                    background: 'white', 
                                    color: 'var(--primary-brand)', 
                                    border: '2px solid var(--primary-brand)', 
                                    padding: '12px 30px', 
                                    borderRadius: '15px', 
                                    fontWeight: '700', 
                                    fontSize: '1rem', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                    {/* Visualization Section Container */}
                    <div style={{ marginBottom: '80px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '100px' }}>
                            <span style={{ color: 'var(--primary-400)', fontWeight: '900', letterSpacing: '4px', fontSize: '0.8rem', display: 'block', marginBottom: '15px' }}>LEAD & PROJECT INTELLIGENCE</span>
                            <h2 style={{ fontSize: '2.6rem', fontWeight: '800', marginBottom: '25px', color: 'var(--primary-brand)', fontFamily: 'var(--font-heading)' }}>Data-Driven Growth</h2>
                            <p style={{ maxWidth: '750px', margin: '0 auto', fontSize: '1rem', color: 'var(--text-secondary)' }}>Stop guessing and start leading. Our analytics engine translates complex lead and project data into actionable growth strategies.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
                            <div className="viz-card animate-on-scroll" style={{ background: 'var(--primary-50)', padding: '35px', borderRadius: '40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Project Velocity</h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '30px', opacity: 0.8 }}>Real-time monitoring of task completions and milestone progression across all projects.</p>
                                <div style={{ height: '220px', width: '100%', marginBottom: '20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={velocityData}>
                                            <defs>
                                                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" hide />
                                            <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke="#8B5CF6" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorProd)"
                                                label={{ position: 'top', fill: '#8B5CF6', fontSize: 10, fontWeight: 'bold' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.7, color: 'var(--text-secondary)', marginTop: 'auto' }}>
                                    "Tracking 100% milestone accuracy across project lifecycles."
                                </p>
                            </div>

                            <div className="viz-card animate-on-scroll" style={{ background: 'var(--primary-50)', padding: '35px', borderRadius: '40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Lead Conversion %</h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '30px', opacity: 0.8 }}>Real-time percentage breakdown of lead intake, conversion, and project success metrics.</p>
                                <div style={{ height: '220px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={conversionData}>
                                            <XAxis 
                                                dataKey="label" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 9, fontWeight: 'bold' }} 
                                            />
                                            <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                                            <Bar 
                                                dataKey="value" 
                                                radius={[10, 10, 0, 0]} 
                                                barSize={25}
                                                label={{ position: 'top', fill: '#333', fontSize: 10, fontWeight: 'bold', formatter: (val) => `${val}%` }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="viz-card animate-on-scroll" style={{ background: 'var(--primary-50)', padding: '35px', borderRadius: '40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Project Success</h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '30px', opacity: 0.8 }}>Easily monitor and track project records, efficiency, and progress across different project teams in real-time.</p>
                                <div style={{ height: '220px', width: '100%', marginBottom: '20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={performanceData}
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={8}
                                                dataKey="value"
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {performanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#8B5CF6' }}>Cross-Project</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '6px' }}>synchronized tracking</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Features Grid Container */}
                    <div style={{ marginBottom: '80px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '100px' }}>
                            <span style={{ color: 'var(--primary-brand)', fontWeight: '900', letterSpacing: '4px', fontSize: '0.8rem', display: 'block', marginBottom: '15px' }}>MANAGEMENT ECOSYSTEM</span>
                            <h2 style={{ fontSize: '2.6rem', fontWeight: '800', marginBottom: '25px', color: 'var(--primary-brand)', fontFamily: 'var(--font-heading)' }}>Built for Scalable Growth</h2>
                            <p style={{ maxWidth: '750px', margin: '0 auto', fontSize: '1rem', color: 'var(--text-secondary)' }}>A comprehensive ecosystem designed to eliminate friction and maximize project and lead efficiency.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                            {[
                                { icon: <Clock />, title: "Real-time Status Updates", desc: "No more long emails. Daily project updates for every team member automatically compiled into simple reports." },
                                { icon: <Zap />, title: "Intelligent Lead Assignment", desc: "Our algorithm routes leads to the most qualified and available team member instantly for rapid conversion." },
                                { icon: <Target />, title: "Milestone Benchmarking", desc: "Set and track project milestones across teams with integrated progress tracking and completion scoring." },
                                { icon: <ShieldCheck />, title: "Enterprise-Grade Security", desc: "Your lead and project data is encrypted and protected with role-based access controls and audits." },
                                { icon: <Globe />, title: "Cross-Project Collaboration", desc: "Break silos with shared workspaces for leads, tasks, and project-specific communications." },
                                { icon: <Trophy />, title: "Productivity & Rewards", desc: "Boost morale with integrated badges, leaderboards, and milestone-based incentive trackers." }
                            ].map((feature, i) => (
                                <div key={i} className="feature-item animate-on-scroll" style={{ 
                                    padding: '50px', 
                                    borderRadius: '40px', 
                                    backgroundColor: 'white',
                                    transition: 'all 0.4s ease',
                                    border: '1px solid transparent'
                                }}>
                                    <div style={{ 
                                        width: '60px', 
                                        height: '60px', 
                                        background: 'var(--primary-brand)', 
                                        color: 'white', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        marginBottom: '30px',
                                        borderRadius: '20px',
                                        margin: '0 auto 30px'
                                    }}>
                                        <span style={{ display: 'flex' }}>{feature.icon}</span>
                                    </div>
                                    <h4 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '15px', fontFamily: 'var(--font-heading)' }}>{feature.title}</h4>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '500' }}>{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final CTA Container */}
                    <div style={{ marginBottom: '60px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ background: 'var(--primary-50)', padding: '60px 0', borderRadius: '60px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)', overflow: 'hidden', maxWidth: '900px', width: '100%' }}>
                            <div style={{ padding: '0 40px', textAlign: 'center' }}>
                                <div className="animate-on-scroll">
                                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary-brand)', fontFamily: 'var(--font-heading)' }}>Ready to Upgrade Your Workplace?</h2>
                                    <p style={{ fontSize: '1.1rem', marginBottom: '35px', opacity: 0.9, maxWidth: '650px', margin: '0 auto 35px', color: 'var(--text-secondary)' }}>Join Avani Enterprises and experience the future of Project and Lead management today.</p>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            onClick={() => navigate('/login')}
                                            style={{ 
                                                background: 'var(--primary-brand)', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '16px 45px', 
                                                borderRadius: '100px', 
                                                fontWeight: '700', 
                                                fontSize: '1.05rem', 
                                                cursor: 'pointer', 
                                                transition: 'all 0.3s ease',
                                                boxShadow: 'var(--shadow-md)'
                                            }}
                                            className="hover-lift"
                                        >
                                            Get Started Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style>{`
                .animate-on-scroll {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .animate-in {
                    opacity: 1;
                    transform: translateY(0);
                }
                .btn-primary-hero:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 25px 50px rgba(62, 39, 35, 0.4);
                }
                .btn-secondary-hero:hover {
                    background: var(--primary-brand);
                    color: white;
                }
                .feature-item:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 25px 50px rgba(62, 39, 35, 0.1);
                }
                .hero-title-gradient {
                    font-size: 4.8rem;
                    font-weight: 950;
                    margin-bottom: 35px;
                    line-height: 1.1;
                    font-family: var(--font-heading);
                    background: linear-gradient(180deg, #3E2723 0%, #A16D47 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    display: inline-block;
                }
                @media (max-width: 768px) {
                    .hero-title-gradient { font-size: 3rem !important; }
                    .cta-gradient-card h2 { font-size: 2.5rem !important; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
