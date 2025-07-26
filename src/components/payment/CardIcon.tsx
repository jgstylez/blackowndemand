
import React from 'react';

export interface CardIconProps {
  type: string;
  className?: string;
}

const CardIcon: React.FC<CardIconProps> = ({ type, className = "h-6 w-6" }) => {
  const getCardIcon = () => {
    switch (type.toLowerCase()) {
      case 'visa':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="15" x="0" y="4" rx="2" fill="#1A1F71"/>
            <text x="2" y="13" fontSize="8" fill="white" fontWeight="bold">VISA</text>
          </svg>
        );
      case 'mastercard':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="15" x="0" y="4" rx="2" fill="#FF5F00"/>
            <circle cx="9" cy="11.5" r="4" fill="#EB001B"/>
            <circle cx="15" cy="11.5" r="4" fill="#F79E1B"/>
          </svg>
        );
      case 'amex':
      case 'american express':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="15" x="0" y="4" rx="2" fill="#006FCF"/>
            <text x="2" y="13" fontSize="6" fill="white" fontWeight="bold">AMEX</text>
          </svg>
        );
      case 'discover':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="15" x="0" y="4" rx="2" fill="#FF6000"/>
            <text x="2" y="13" fontSize="5" fill="white" fontWeight="bold">DISCOVER</text>
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="14" x="2" y="5" rx="2"/>
            <line x1="2" x2="22" y1="10" y2="10"/>
          </svg>
        );
    }
  };

  return getCardIcon();
};

export default CardIcon;
