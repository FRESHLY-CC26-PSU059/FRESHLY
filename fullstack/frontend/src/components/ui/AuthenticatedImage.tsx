import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Scan } from 'lucide-react';

interface AuthenticatedImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function AuthenticatedImage({ src, alt = '', className = '', fallback }: AuthenticatedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setBlobUrl(src);
      setLoading(false);
      return;
    }

    // Check if it's an external URL (excluding our own API)
    // If it starts with http but isn't our API origin, we treats it as external
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const apiOrigin = new URL(apiUrl).origin;
    const isExternal = (src.startsWith('http://') || src.startsWith('https://')) && !src.startsWith(apiOrigin);

    if (isExternal) {
      setBlobUrl(src);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadImg = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Use the authorized api instance to fetch the image as a blob
        const response = await api.get(src, { responseType: 'blob' });
        
        if (isMounted) {
          const url = URL.createObjectURL(response.data);
          setBlobUrl(url);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImg();

    return () => {
      isMounted = false;
    };
  }, [src]);

  // Separate cleanup for revoking object URLs
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-app-bg animate-pulse ${className}`}>
        <div className="w-1/3 h-1/3 bg-app-text-secondary/10 rounded-full" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-app-bg text-app-text-secondary/30 ${className}`}>
        {fallback || <Scan className="w-1/2 h-1/2" />}
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
