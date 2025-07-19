import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  X, 
  Save, 
  Send,
  Calendar,
  Clock,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  Check,
  FileText,
  Image,
  Link,
  MessageSquare,
  Sparkles,
  Building2,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NewsletterIssue {
  id: string;
  subject: string;
  preview_text: string | null;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  html_content: string | null;
  text_content: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  content_items?: ContentItem[];
}

interface ContentItem {
  id: string;
  newsletter_id: string;
  type: string;
  position: number;
  title: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  business_id: string | null;
  ad_id: string | null;
  is_ai_generated: boolean;
  ai_prompt: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  source: string | null;
  created_at: string;
}

interface NewsletterManagementProps {
  onUpdate?: () => void;
}

const NewsletterManagement: React.FC<NewsletterManagementProps> = ({ onUpdate }) => {
  const [newsletters, setNewsletters] = useState<NewsletterIssue[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'subscribers' | 'create'>('issues');
  const [editingNewsletter, setEditingNewsletter] = useState<NewsletterIssue | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContentType, setAiContentType] = useState<'news' | 'business' | 'referral'>('news');

  // New newsletter form state
  const [formData, setFormData] = useState({
    subject: '',
    preview_text: '',
    scheduled_for: '',
    content_items: [] as ContentItem[]
  });

  useEffect(() => {
    fetchNewsletters();
    fetchSubscriberCount();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For each newsletter, fetch its content items
      const newslettersWithContent = await Promise.all((data || []).map(async (newsletter) => {
        const { data: contentItems } = await supabase
          .from('newsletter_content_items')
          .select('*')
          .eq('newsletter_id', newsletter.id)
          .order('position');
          
        return {
          ...newsletter,
          content_items: contentItems || []
        };
      }));
      
      setNewsletters(newslettersWithContent);
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      setSubscriberCount(count || 0);
    } catch (err) {
      console.error('Error fetching subscriber count:', err);
    }
  };

  const handleCreateNewsletter = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!formData.subject.trim()) {
        setError('Subject is required');
        return;
      }
      
      // Create the newsletter issue
      const { data: newsletter, error: newsletterError } = await supabase
        .from('newsletter_issues')
        .insert({
          subject: formData.subject,
          preview_text: formData.preview_text,
          scheduled_for: formData.scheduled_for || null,
          status: formData.scheduled_for ? 'scheduled' : 'draft'
        })
        .select()
        .single();
        
      if (newsletterError) throw newsletterError;
      
      // Create content items if any
      if (formData.content_items.length > 0) {
        const contentItemsWithNewsletterId = formData.content_items.map(item => ({
          ...item,
          newsletter_id: newsletter.id
        }));
        
        const { error: contentError } = await supabase
          .from('newsletter_content_items')
          .insert(contentItemsWithNewsletterId);
          
        if (contentError) throw contentError;
      }
      
      setSuccess('Newsletter created successfully');
      setFormData({
        subject: '',
        preview_text: '',
        scheduled_for: '',
        content_items: []
      });
      
      fetchNewsletters();
      setActiveTab('issues');
      onUpdate?.();
    } catch (err) {
      console.error('Error creating newsletter:', err);
      setError('Failed to create newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNewsletter = async () => {
    if (!editingNewsletter) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Update the newsletter issue
      const { error: updateError } = await supabase
        .from('newsletter_issues')
        .update({
          subject: editingNewsletter.subject,
          preview_text: editingNewsletter.preview_text,
          scheduled_for: editingNewsletter.scheduled_for,
          status: editingNewsletter.scheduled_for ? 'scheduled' : 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNewsletter.id);
        
      if (updateError) throw updateError;
      
      // Handle content items (this would be more complex in a real implementation)
      // For simplicity, we're not updating content items here
      
      setSuccess('Newsletter updated successfully');
      setEditingNewsletter(null);
      fetchNewsletters();
    } catch (err) {
      console.error('Error updating newsletter:', err);
      setError('Failed to update newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNewsletter = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this newsletter? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('newsletter_issues')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSuccess('Newsletter deleted successfully');
      fetchNewsletters();
      onUpdate?.();
    } catch (err) {
      console.error('Error deleting newsletter:', err);
      setError('Failed to delete newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async (id: string, isTest: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // If it's a test send, validate the test email
      if (isTest && (!testEmail || !testEmail.includes('@'))) {
        setError('Please enter a valid test email address');
        setLoading(false);
        return;
      }
      
      // Call the edge function to send the newsletter
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          newsletterId: id,
          testEmail: isTest ? testEmail : null
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send newsletter');
      }
      
      setSuccess(isTest ? 'Test email sent successfully' : 'Newsletter sent successfully');
      
      // If it wasn't a test, refresh the newsletter list
      if (!isTest) {
        fetchNewsletters();
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error sending newsletter:', err);
      setError(err instanceof Error ? err.message : 'Failed to send newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for content generation');
      return;
    }
    
    try {
      setIsGeneratingContent(true);
      setError(null);
      
      // Call the edge function to generate content
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-newsletter-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: aiContentType
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate content');
      }
      
      // Add the generated content to the form
      const newContentItem: ContentItem = {
        id: `temp-${Date.now()}`, // Temporary ID for UI
        newsletter_id: '',
        type: aiContentType,
        position: formData.content_items.length,
        title: result.title || `Generated ${aiContentType} content`,
        content: result.content,
        image_url: null,
        link_url: null,
        business_id: null,
        ad_id: null,
        is_ai_generated: true,
        ai_prompt: aiPrompt
      };
      
      setFormData(prev => ({
        ...prev,
        content_items: [...prev.content_items, newContentItem]
      }));
      
      setAiPrompt('');
      setSuccess('Content generated successfully');
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleAddContentItem = (type: string) => {
    const newItem: ContentItem = {
      id: `temp-${Date.now()}`, // Temporary ID for UI
      newsletter_id: '',
      type,
      position: formData.content_items.length,
      title: '',
      content: '',
      image_url: null,
      link_url: null,
      business_id: null,
      ad_id: null,
      is_ai_generated: false,
      ai_prompt: null
    };
    
    setFormData(prev => ({
      ...prev,
      content_items: [...prev.content_items, newItem]
    }));
  };

  const handleRemoveContentItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      content_items: prev.content_items.filter((_, i) => i !== index)
    }));
  };

  const handleContentItemChange = (index: number, field: keyof ContentItem, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.content_items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      return {
        ...prev,
        content_items: updatedItems
      };
    });
  };

  const moveContentItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.content_items.length - 1)
    ) {
      return;
    }
    
    setFormData(prev => {
      const updatedItems = [...prev.content_items];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap items
      [updatedItems[index], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[index]];
      
      // Update positions
      updatedItems.forEach((item, i) => {
        item.position = i;
      });
      
      return {
        ...prev,
        content_items: updatedItems
      };
    });
  };

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter(subscriber => 
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subscriber.first_name && subscriber.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (subscriber.last_name && subscriber.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination for subscribers
  const totalSubscriberPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderNewslettersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Newsletter Issues</h3>
        <button
          onClick={() => setActiveTab('create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Newsletter
        </button>
      </div>

      {loading && newsletters.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
              <div className="flex justify-between">
                <div className="h-4 bg-gray-700 rounded w-1/4" />
                <div className="h-8 bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No newsletters created yet</p>
          <button
            onClick={() => setActiveTab('create')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create First Newsletter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {newsletters.map(newsletter => (
            <div key={newsletter.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                <div>
                  <h4 className="text-lg font-medium text-white">{newsletter.subject}</h4>
                  {newsletter.preview_text && (
                    <p className="text-gray-400 text-sm">{newsletter.preview_text}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    newsletter.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                    newsletter.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {newsletter.status.charAt(0).toUpperCase() + newsletter.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {new Date(newsletter.created_at).toLocaleDateString()}</span>
                </div>
                
                {newsletter.scheduled_for && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Scheduled: {new Date(newsletter.scheduled_for).toLocaleString()}</span>
                  </div>
                )}
                
                {newsletter.sent_at && (
                  <div className="flex items-center gap-1">
                    <Send className="h-3 w-3" />
                    <span>Sent: {new Date(newsletter.sent_at).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" />
                  <span>{newsletter.content_items?.length || 0} content blocks</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {newsletter.status !== 'sent' && (
                  <>
                    <button
                      onClick={() => setEditingNewsletter(newsletter)}
                      className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4 inline mr-1" />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => {
                        setTestEmail('');
                        setEditingNewsletter(newsletter);
                        setShowPreview(true);
                      }}
                      className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Preview
                    </button>
                    
                    <button
                      onClick={() => handleSendNewsletter(newsletter.id, true)}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 inline mr-1" />
                      Test Send
                    </button>
                    
                    {newsletter.status !== 'scheduled' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to send this newsletter to all subscribers?')) {
                            handleSendNewsletter(newsletter.id);
                          }
                        }}
                        disabled={loading}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Send className="h-4 w-4 inline mr-1" />
                        Send Now
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => handleDeleteNewsletter(newsletter.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubscribersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Subscribers</h3>
          <p className="text-gray-400 text-sm">
            {subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => {
              fetchSubscribers();
              fetchSubscriberCount();
            }}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {subscribers.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No subscribers yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Subscribers will appear here when people sign up for your newsletter
          </p>
        </div>
      ) : loading && subscribers.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 text-sm">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedSubscribers.map(subscriber => (
                  <tr key={subscriber.id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-white">{subscriber.email}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {subscriber.first_name || subscriber.last_name 
                        ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subscriber.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        subscriber.status === 'unsubscribed' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{subscriber.source || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(subscriber.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          // Handle subscriber actions
                          console.log('View subscriber:', subscriber.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalSubscriberPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSubscribers.length)} of {filteredSubscribers.length} subscribers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-white">
                  Page {currentPage} of {totalSubscriberPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalSubscriberPages, prev + 1))}
                  disabled={currentPage === totalSubscriberPages}
                  className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCreateNewsletter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Create Newsletter</h3>
        <button
          onClick={() => setActiveTab('issues')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
          Cancel
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject Line *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Enter newsletter subject"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preview Text
            </label>
            <input
              type="text"
              value={formData.preview_text}
              onChange={(e) => setFormData(prev => ({ ...prev, preview_text: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              placeholder="Brief preview text (appears in email clients)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to save as draft
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Content Blocks</h4>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => handleAddContentItem('text')}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Add Text
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => handleAddContentItem('image')}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  <Image className="h-4 w-4 inline mr-1" />
                  Add Image
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => handleAddContentItem('business')}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Add Business
                </button>
              </div>
            </div>
          </div>
          
          {/* AI Content Generator */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              AI Content Generator
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Type
                </label>
                <select
                  value={aiContentType}
                  onChange={(e) => setAiContentType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="news">News Article</option>
                  <option value="business">Business Spotlight</option>
                  <option value="referral">Referral Campaign</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prompt
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                  placeholder="Describe what you want the AI to write about..."
                />
              </div>
              
              <button
                onClick={handleGenerateContent}
                disabled={isGeneratingContent || !aiPrompt.trim()}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGeneratingContent ? (
                  <>
                    <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Content Items */}
          {formData.content_items.length === 0 ? (
            <div className="text-center py-8 bg-gray-700 rounded-lg">
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No content blocks added yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Add content blocks using the buttons above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.content_items.map((item, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 relative">
                  <div className="absolute right-2 top-2 flex gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => moveContentItem(index, 'up')}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    
                    {index < formData.content_items.length - 1 && (
                      <button
                        onClick={() => moveContentItem(index, 'down')}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveContentItem(index)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mb-3 flex items-center gap-2">
                    {item.type === 'text' && <FileText className="h-5 w-5 text-blue-400" />}
                    {item.type === 'image' && <Image className="h-5 w-5 text-purple-400" />}
                    {item.type === 'business' && <Building2 className="h-5 w-5 text-green-400" />}
                    {item.type === 'news' && <FileText className="h-5 w-5 text-yellow-400" />}
                    {item.type === 'referral' && <Users className="h-5 w-5 text-orange-400" />}
                    
                    <span className="text-white font-medium capitalize">
                      {item.is_ai_generated ? 'AI-Generated ' : ''}{item.type} Block
                    </span>
                    
                    {item.is_ai_generated && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                        AI
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3 pl-7">
                    {(item.type === 'text' || item.type === 'news' || item.type === 'business' || item.type === 'referral') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => handleContentItemChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                            placeholder="Section title (optional)"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Content
                          </label>
                          <textarea
                            value={item.content || ''}
                            onChange={(e) => handleContentItemChange(index, 'content', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                            placeholder="Enter content text"
                          />
                        </div>
                      </>
                    )}
                    
                    {(item.type === 'image' || item.type === 'business') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={item.image_url || ''}
                          onChange={(e) => handleContentItemChange(index, 'image_url', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    )}
                    
                    {(item.type === 'text' || item.type === 'image' || item.type === 'business') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Link URL (optional)
                        </label>
                        <input
                          type="url"
                          value={item.link_url || ''}
                          onChange={(e) => handleContentItemChange(index, 'link_url', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                          placeholder="https://example.com"
                        />
                      </div>
                    )}
                    
                    {item.type === 'business' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Business ID (optional)
                        </label>
                        <input
                          type="text"
                          value={item.business_id || ''}
                          onChange={(e) => handleContentItemChange(index, 'business_id', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                          placeholder="Business UUID"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateNewsletter}
            disabled={loading || !formData.subject.trim()}
            className="flex-1 py-3 px-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Newsletter'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreviewModal = () => {
    if (!showPreview || !editingNewsletter) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Newsletter Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="bg-white rounded-lg p-6 text-black">
              <h1 className="text-2xl font-bold mb-4">{editingNewsletter.subject}</h1>
              
              {editingNewsletter.preview_text && (
                <p className="text-gray-600 italic mb-6">{editingNewsletter.preview_text}</p>
              )}
              
              <div className="space-y-6">
                {editingNewsletter.content_items?.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                    {item.title && (
                      <h2 className="text-xl font-semibold mb-3">{item.title}</h2>
                    )}
                    
                    {item.content && (
                      <div className="mb-4 whitespace-pre-line">{item.content}</div>
                    )}
                    
                    {item.image_url && (
                      <div className="mb-4">
                        <img 
                          src={item.image_url} 
                          alt={item.title || 'Newsletter image'} 
                          className="max-w-full rounded-lg"
                        />
                      </div>
                    )}
                    
                    {item.link_url && (
                      <a 
                        href={item.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {item.type === 'business' ? 'View Business' : 'Learn More'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Send Test Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-grow px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  <button
                    onClick={() => handleSendNewsletter(editingNewsletter.id, true)}
                    disabled={loading || !testEmail.includes('@')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close Preview
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to send this newsletter to all subscribers?')) {
                      handleSendNewsletter(editingNewsletter.id);
                      setShowPreview(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send to All Subscribers'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Newsletter Management</h2>
          <p className="text-gray-400">Create and send newsletters to your subscribers</p>
        </div>
        
        <div className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-lg text-sm font-medium">
          Development Mode Only
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'issues'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Newsletter Issues
        </button>
        <button
          onClick={() => {
            setActiveTab('subscribers');
            if (subscribers.length === 0) {
              fetchSubscribers();
            }
          }}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'subscribers'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Subscribers
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Create Newsletter
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'issues' && renderNewslettersList()}
      {activeTab === 'subscribers' && renderSubscribersList()}
      {activeTab === 'create' && renderCreateNewsletter()}

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
};

export default NewsletterManagement;