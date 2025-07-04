import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Supabase storage configuration
export const STORAGE_BASE_URL = 'https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/business-images/';

// Helper function to get proper image URL
export const getBusinessImageUrl = (imageUrl: string | null | undefined): string => {
  // If no image URL provided, return placeholder
  if (!imageUrl) {
    return 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg';
  }

  // If it's already a full URL (starts with http), use it as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Handle both simple filenames and paths like "images/filename.webp"
  // Extract just the filename from any path structure
  let filename = imageUrl;
  if (imageUrl.includes('/')) {
    const parts = imageUrl.split('/');
    filename = parts[parts.length - 1]; // Get the last part (filename)
  }
  
  // Remove any leading dots or slashes
  filename = filename.replace(/^[./]+/, '');
  
  // Construct the full Supabase storage URL
  return `${STORAGE_BASE_URL}${filename}`;
};

export const uploadBusinessImage = async (file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `business-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('business-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const createBusiness = async (businessData: any) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .insert(businessData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
};