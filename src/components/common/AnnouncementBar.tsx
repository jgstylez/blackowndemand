import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useFeatureFlag from '../../hooks/useFeatureFlag';

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string;
  link_text: string;
  background_color: string;
  text_color: string;
}

const AnnouncementBar = () => {
  // Always call all hooks at the top level
  const isEnabled = useFeatureFlag('enable_announcement_bar', false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if the feature is enabled
    if (isEnabled) {
      fetchActiveAnnouncement();
    } else {
      setLoading(false);
    }
  }, [isEnabled]);

  const fetchActiveAnnouncement = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_announcement');
      
      if (error) {
        console.error('Error fetching announcement:', error);
        return;
      }

      if (data && data.length > 0) {
        setAnnouncement(data[0]);
        
        // Check if user has dismissed this announcement
        const dismissedId = localStorage.getItem('dismissed-announcement');
        if (dismissedId === data[0].id) {
          setIsVisible(false);
        }
      }
    } catch (err) {
      console.error('Error fetching announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('dismissed-announcement', announcement.id);
      setIsVisible(false);
    }
  };

  // Conditional return after all hooks have been called
  if (!isEnabled || loading || !announcement || !isVisible) {
    return null;
  }

  const isExternalLink = announcement.link_url?.startsWith('http');

  return (
    <div 
      className="relative px-4 py-3 text-center text-sm font-medium transition-all duration-300"
      style={{ 
        backgroundColor: announcement.background_color,
        color: announcement.text_color 
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
          {announcement.title && (
            <span className="font-semibold">{announcement.title}</span>
          )}
          <span>{announcement.message}</span>
          
          {announcement.link_url && announcement.link_text && (
            <>
              {isExternalLink ? (
                <a
                  href={announcement.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline transition-all"
                  style={{ color: announcement.text_color }}
                >
                  {announcement.link_text}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Link
                  to={announcement.link_url}
                  className="underline hover:no-underline transition-all"
                  style={{ color: announcement.text_color }}
                >
                  {announcement.link_text}
                </Link>
              )}
            </>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;