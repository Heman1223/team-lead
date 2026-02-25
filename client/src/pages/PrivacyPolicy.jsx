import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Eye, FileText, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="privacy-policy-page" style={{ backgroundColor: '#ffffff', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
            <Navbar onMenuToggle={() => { }} />

            <main style={{ maxWidth: '1000px', margin: '60px auto 120px', padding: '0 20px' }}>
                <div className="animate-on-scroll" style={{ 
                    background: 'var(--bg-soft)', 
                    borderRadius: '30px', 
                    padding: '80px 60px',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)'
                }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--primary-brand)', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            marginBottom: '40px',
                            padding: '0'
                        }}
                    >
                        <ArrowLeft size={18} /> Back to Home
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: 'var(--primary-brand)', 
                            color: 'white', 
                            borderRadius: '24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 25px'
                        }}>
                            <Shield size={40} />
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary-brand)', marginBottom: '15px', fontFamily: 'var(--font-heading)' }}>Privacy Policy</h1>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Last Updated: January 2025</p>
                    </div>

                    <div style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        <p style={{ marginBottom: '40px', fontSize: '1.2rem', textAlign: 'center' }}>
                            At Avani Enterprises, we prioritize the privacy and security of our employees' data. 
                            This Privacy Policy outlines how we collect, use, and protect your information within the portal.
                        </p>

                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText size={24} /> 1. Information We Collect
                            </h2>
                            <p style={{ marginBottom: '15px' }}>We collect essential information to facilitate human resource management and project operations, including but not limited to:</p>
                            <ul style={{ listStyle: 'none', padding: '0' }}>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span><strong>Personal Identification:</strong> Name, Employee ID, Department, and Contact details.</span>
                                </li>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span><strong>Professional Records:</strong> Attendance logs, Leave history, and Performance metrics.</span>
                                </li>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span><strong>Live Location Tracking:</strong> When you mark your attendance, we capture your geo-location data (Geo-fencing) to ensure accuracy and compliance with site-specific work requirements.</span>
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Eye size={24} /> 2. How We Use Your Data
                            </h2>
                            <ul style={{ listStyle: 'none', padding: '0' }}>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span>To monitor and validate daily attendance through live geo-fencing.</span>
                                </li>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span>To process leave applications and manage workforce availability.</span>
                                </li>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span>To generate performance analytics and project reports.</span>
                                </li>
                                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', background: 'var(--primary-brand)', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
                                    <span>To facilitate transparent communication between employees and management.</span>
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Lock size={24} /> 3. Data Security & Retention
                            </h2>
                            <p>
                                Your data is stored in encrypted databases and is only accessible by authorized personnel. 
                                We implement strict security protocols to prevent unauthorized access or data leakage. 
                                Records are retained for the duration of your employment and as required by legal guidelines.
                            </p>
                        </section>

                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Shield size={24} /> 4. Employee Consent
                            </h2>
                            <p>
                                By using the Avani Portal and marking your attendance, you explicitly consent to the collection 
                                of your professional data and real-time location verification for administrative purposes.
                            </p>
                        </section>

                        <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '40px', marginTop: '60px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '20px' }}>5. Contact Information</h2>
                            <p style={{ marginBottom: '25px' }}>If you have any questions regarding your data privacy, please reach out to the Management Department at:</p>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                background: 'white', 
                                padding: '15px 25px', 
                                borderRadius: '100px', 
                                border: '1px solid var(--border-light)',
                                fontWeight: '700',
                                color: 'var(--primary-brand)'
                            }}>
                                kp@avanienterprises.in
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />

            <style>{`
                .animate-on-scroll {
                    animation: fadeInUp 1s ease-out;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicy;
