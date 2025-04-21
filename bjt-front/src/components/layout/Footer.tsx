import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/global.css';

// 内联样式
const styles = {
  footerContainer: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    padding: '40px 20px',
    width: '100%',
    borderTop: '1px solid #444444'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    position: 'relative'
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%'
  },
  footerLogo: {
    marginBottom: '20px'
  },
  footerLogoImg: {
    maxHeight: '40px',
    filter: 'brightness(0) invert(1)' /* 将logo变成白色 */
  },
  footerNav: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: '20px',
    borderBottom: '1px solid #444444',
    paddingBottom: '15px'
  },
  footerNavItem: {
    color: '#FFFFFF',
    textDecoration: 'none',
    marginRight: '20px',
    marginBottom: '10px',
    fontSize: '14px'
  },
  footerCompanyInfo: {
    fontSize: '14px',
    lineHeight: 1.5
  },
  companyName: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  companyNameEn: {
    fontSize: '13px',
    marginBottom: '5px'
  },
  companyAddress: {
    fontSize: '12px',
    color: '#CCCCCC',
    maxWidth: '600px'
  },
  footerSocial: {
    display: 'flex',
    position: 'absolute',
    right: '120px',
    top: '0'
  },
  socialIcon: {
    color: '#FFFFFF',
    marginLeft: '15px',
    fontSize: '18px'
  },
  footerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  footerQrCode: {
    width: '80px',
    height: '80px',
    backgroundColor: '#FFFFFF',
    padding: '5px',
    borderRadius: '4px'
  },
  footerQrCodeImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  footerIcon: {
    width: '20px',
    height: '20px',
    display: 'inline-block',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain'
  }
};

export interface FooterProps {
  logo?: string;
  companyName?: string;
  companyNameChinese?: string;
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
  qrCode?: string;
  navigation?: Array<{
    label: string;
    url: string;
  }>;
}

const Footer: React.FC<FooterProps> = ({
  logo = '/images/logo-footer.webp',
  companyName = 'HANGZHOU BING JIA TECH. CO., LTD.',
  companyNameChinese = '杭州丙甲科技有限公司',
  copyrightYear = new Date().getFullYear(),
  contactInfo = {
    address: 'Room 201, 1st and 2nd Floors, Building 7, No. 8-2 8-3, 8-5 Keji Avenue, Yuhang Street, Yuhang District, Hangzhou City, Zhejiang Province, China',
    phone: '+86 123 456 7890',
    email: 'info@bjt-system.com',
  },
  socialLinks = [
    { name: 'facebook', url: '#', icon: <i className="fa fa-facebook"></i> },
    { name: 'twitter', url: '#', icon: <i className="fa fa-twitter"></i> },
    { name: 'pinterest', url: '#', icon: <i className="fa fa-pinterest"></i> },
    { name: 'linkedin', url: '#', icon: <i className="fa fa-linkedin"></i> },
    { name: 'youtube', url: '#', icon: <i className="fa fa-youtube"></i> },
  ],
  className = '',
  qrCode = '/images/barcode.webp',
  navigation = [],
}) => {
  return (
    <footer style={styles.footerContainer} className={className}>
      <div style={styles.footerContent}>
        {/* Logo and company info */}
        <div style={styles.footerLeft}>
          <div style={styles.footerLogo}>
            <img src={logo} alt={companyName} style={styles.footerLogoImg} />
          </div>
          
          {/* Navigation */}
          <div style={styles.footerNav}>
            {navigation.map((item) => (
              <Link key={item.label} to={item.url} style={styles.footerNavItem}>
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Company information */}
          <div style={styles.footerCompanyInfo}>
            <p style={styles.companyName}>{companyNameChinese}</p>
            <p style={styles.companyNameEn}>{companyName}</p>
            <p style={styles.companyAddress}>{contactInfo.address}</p>
          </div>
        </div>
        
        {/* Social media links */}
        <div style={styles.footerSocial}>
          {socialLinks.map((link) => (
            <a 
              key={link.name}
              href={link.url}
              style={styles.socialIcon}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
            >
              {link.icon}
            </a>
          ))}
        </div>
        
        {/* QR Code */}
        <div style={styles.footerRight}>
          <div style={styles.footerQrCode}>
            <img src={qrCode} alt="QR Code" style={styles.footerQrCodeImg} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 