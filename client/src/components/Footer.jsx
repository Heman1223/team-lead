import React from 'react';
import { Mail, MapPin, Phone, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.jpeg" alt="Avani Enterprises Logo" />
              <div className="footer-logo-text">
                <h3>AVANI</h3>
                <h3>ENTERPRISES</h3>
              </div>
            </div>
            <p className="footer-tagline">
              Empowering sales teams with trust & technology.<br />
              Simplifying Sales, One Deal at a Time.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <MapPin size={18} />
                <span>Tower B, 3rd Floor, Unitech Cyber Park, Sector 39, Gurugram, Haryana 122002</span>
              </div>
            </div>
            <div className="footer-social">
              <a href="#"><Instagram size={20} /></a>
              <a href="#"><Facebook size={20} /></a>
              <a href="#"><Twitter size={20} /></a>
              <a href="#"><Linkedin size={20} /></a>
              <a href="#"><Mail size={20} /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Sales Portal</h4>
            <div className="footer-hr-line"></div>
            <h5>Key Features</h5>
            <ul>
              <li>• Lead Intelligence</li>
              <li>• Project Velocity</li>
              <li>• Milestone Management</li>
              <li>• Performance Analytics</li>
            </ul>
          </div>

          <div className="footer-links footer-projects">
            <h4>Other Projects</h4>
            <div className="footer-hr-line"></div>
            <ul className="external-links">
              <li>• <a href="https://hr-portal-sage.vercel.app/" target="_blank" rel="noopener noreferrer">HR Management</a></li>
              <li>• <a href="#" target="_blank" rel="noopener noreferrer">Project & Leads</a></li>
              <li>• <a href="https://crm-sales-portal.vercel.app/" target="_blank" rel="noopener noreferrer">Sales Edge Portal</a></li>
              <li>• <a href="https://placement-management-system-six.vercel.app/login" target="_blank" rel="noopener noreferrer">Placement System</a></li>
              <li>• <a href="https://placement-management-system-80spgis9n.vercel.app/login" target="_blank" rel="noopener noreferrer">Student & Agency</a></li>
              <li>• <a href="https://shoes-ecommerce-iota.vercel.app/" target="_blank" rel="noopener noreferrer">E-Commerce Store</a></li>
            </ul>
          </div>

          <div className="footer-map">
            <h4>Visit Us</h4>
            <div className="footer-hr-line"></div>
            <div className="map-wrapper">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.013444983088!2d77.0543633150777!3d28.433946282496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d195c898c6d3f%3A0xe37852c00d436c64!2sUnitech%20Cyber%20Park!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="150"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Avani Sales CRM - Avani Project and lead management | <Link to="/privacy-policy">Privacy Policy</Link></p>
        </div>
      </div>

      <style>{`
        .global-footer {
          background-color: var(--primary-brand);
          color: white;
          padding: 60px 20px 20px;
          border-radius: 40px 40px 0 0;
          margin-top: 40px;
          font-family: var(--font-primary);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .footer-brand .footer-logo {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .footer-brand .footer-logo img {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          object-fit: cover;
        }

        .footer-logo-text h3 {
          margin: 0;
          font-size: 1.2rem;
          color: white;
          line-height: 1.1;
          letter-spacing: 1px;
        }

        .footer-tagline {
          font-style: italic;
          font-size: 0.95rem;
          font-weight: 500;
          opacity: 1;
          margin-bottom: 25px;
          max-width: 350px;
          line-height: 1.6;
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .footer-social {
          display: flex;
          gap: 15px;
        }

        .footer-social a {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .footer-social a:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }

        .footer-links h4, .footer-map h4 {
          color: white;
          font-size: 1.4rem;
          margin-bottom: 5px;
        }

        .footer-hr-line {
          width: 60px;
          height: 3px;
          background: white;
          margin-bottom: 25px;
        }

        .footer-links h5 {
          color: white;
          font-size: 1.1rem;
          margin-bottom: 15px;
        }

        .footer-links ul {
          list-style: none;
          padding: 0;
        }

        .footer-links ul li {
          font-size: 0.9rem;
          margin-bottom: 12px;
          opacity: 0.9;
        }

        .footer-projects {
          margin-left: -40px;
        }

        .external-links li a {
          color: white;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .external-links li a:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
          text-align: center;
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .footer-bottom a {
          color: white;
          text-decoration: underline;
          font-weight: 600;
          opacity: 1;
          transition: opacity 0.2s;
        }

        .footer-bottom a:hover {
          opacity: 0.8;
        }

        .heart {
          color: #ff4d4d;
        }

        @media (max-width: 992px) {
          .footer-main {
            grid-template-columns: 1fr 1fr;
          }
          .footer-projects {
            margin-left: 0;
          }
        }

        @media (max-width: 768px) {
          .footer-main {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 30px;
          }

          .footer-brand .footer-logo, .contact-item {
            justify-content: center;
          }

          .footer-social {
            justify-content: center;
          }

          .footer-hr-line {
            margin: 0 auto 20px;
          }

          .footer-tagline {
            max-width: 100%;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
