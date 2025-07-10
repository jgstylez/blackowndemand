import React, { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Linkedin, Mail, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessUrl: string;
  businessDescription?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  businessName,
  businessUrl,
  businessDescription
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `Check out ${businessName} on BlackOWNDemand - Supporting Black-owned businesses worldwide!`;
  const fullUrl = `${window.location.origin}${businessUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      action: handleCopyLink,
      className: copied 
        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
        : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
      className: 'bg-sky-500 text-white hover:bg-sky-600 border-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
      className: 'bg-blue-700 text-white hover:bg-blue-800 border-blue-700'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`;
        window.open(url, '_blank');
      },
      className: 'bg-green-600 text-white hover:bg-green-700 border-green-600'
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => {
        const subject = encodeURIComponent(`Check out ${businessName} on BlackOWNDemand`);
        const body = encodeURIComponent(`${shareText}\n\n${businessDescription || ''}\n\nVisit: ${fullUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
      className: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600'
    }
  ];

  // Check if Web Share API is available
  const canUseWebShare = navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: shareText,
          url: fullUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share {businessName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {canUseWebShare && (
          <button
            onClick={handleNativeShare}
            className="w-full mb-4 p-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Share via Device
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${option.className}`}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{option.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Share URL:</p>
          <p className="text-sm text-white break-all">{fullUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;