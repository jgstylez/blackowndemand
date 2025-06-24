import React, { useEffect } from 'react';

interface SecuritySealProps {
  userId?: string;
  className?: string;
}

const SecuritySeal: React.FC<SecuritySealProps> = ({
  userId = 'mID766440',
  className = '',
}) => {
  useEffect(() => {
    // Ensure global variable is available before script loads
    (window as any).SaintSealID = 'saint-seal-container';

    const script = document.createElement('script');
    script.src = `https://secure.saintcorporation.com/cgi-bin/websaint/asv_seal.js?user=${userId}`;
    script.type = 'text/javascript';

    // Append to <body> so it can write globally
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [userId]);

  return (
    <div id="saint-seal-container" className={className}></div>
  );
};

export default SecuritySeal;
