import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/global.css';

export interface FooterProps {
  logo?: string;
  companyName?: string;
  copyrightYear?: number;
  contactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  socialLinks?: Array<{
    name: string;
    url: string;
    icon: React.ReactNode;
  }>;
  className?: string;
  quickLinks?: Array<{
    title: string;
    links: Array<{
      label: string;
      url: string;
    }>;
  }>;
}

const Footer: React.FC<FooterProps> = ({
  logo = '/images/logo-footer.webp',
  companyName = 'BJT Product Management System',
  copyrightYear = new Date().getFullYear(),
  contactInfo = {
    address: 'Hangzhou, Zhejiang Province, China',
    phone: '+86 123 456 7890',
    email: 'info@bjt-system.com',
  },
  socialLinks = [],
  className = '',
  quickLinks = [
    {
      title: 'Products',
      links: [
        { label: 'Machines', url: '/products/machines' },
        { label: 'Consumables', url: '/products/consumables' },
        { label: 'Spare Parts', url: '/products/spare-parts' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Documentation', url: '/docs' },
        { label: 'FAQs', url: '/faqs' },
        { label: 'Contact Us', url: '/contact' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', url: '/about' },
        { label: 'Careers', url: '/careers' },
        { label: 'Privacy Policy', url: '/privacy' },
      ],
    },
  ],
}) => {
  return (
    <footer className={className}>
      <div className="container">
        <div className="grid">
          {/* Company Info */}
          <div>
            <div className="company-logo">
              <img src={logo} alt={companyName} />
            </div>
            <p>{contactInfo.address}</p>
            <p>
              <strong>Phone:</strong> {contactInfo.phone}
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${contactInfo.email}`}>
                {contactInfo.email}
              </a>
            </p>
            {socialLinks.length > 0 && (
              <div className="social-links">
                {socialLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {quickLinks.map((section) => (
            <div key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.url}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t">
          <p className="text-sm">© {copyrightYear} {companyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 