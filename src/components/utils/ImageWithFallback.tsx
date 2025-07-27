import React, { useState } from 'react';
import { logError } from '../../lib/errorLogger';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
  alt: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * A component that renders an image with a fallback if the primary image fails to load.
 * Also includes proper error logging and accessibility attributes.
 */
const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      // Log the error
      logError(`Image failed to load: ${src}`, {
        context: 'ImageWithFallback',
        level: 'warning',
        metadata: {
          originalSrc: src,
          fallbackSrc,
          alt
        }
      });

      // Set fallback image
      setImgSrc(fallbackSrc);
      setHasError(true);

      // Call custom onError handler if provided
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default ImageWithFallback;