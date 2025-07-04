# Image Migration Guide

This guide explains how to migrate business images from the CDN to Supabase storage.

## Overview

The migration process will:
1. Download images from `https://cdn.blackdollarnetwork.com/`
2. Upload them to Supabase storage
3. Update database records with new URLs
4. Track migration progress and handle errors

## Prerequisites

1. **Environment Variables**: Ensure you have these set:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

## Step 1: Run Database Migration

First, set up the storage bucket and tracking table:

```bash
# Apply the storage setup migration
supabase db push
```

This creates:
- `business-images` storage bucket
- Proper access policies
- `image_migration_log` table for tracking

## Step 2: Check Current Images

Before migrating, check what images exist:

```bash
npm run check-images
```

This will show:
- Total number of images
- Breakdown by URL type (CDN, relative, etc.)
- Sample URLs that will be migrated

## Step 3: Run Migration

Execute the image migration:

```bash
npm run migrate-images
```

The script will:
- Download each image from the CDN
- Upload to Supabase storage with organized naming
- Update database records
- Log success/failure for each image
- Provide progress updates

## Step 4: Verify Migration

After migration, check the results:

1. **Check migration log**:
   ```sql
   SELECT status, COUNT(*) 
   FROM image_migration_log 
   GROUP BY status;
   ```

2. **Verify images are accessible**:
   - Visit your application
   - Check that business images display correctly
   - Test image loading on different pages

## Migration Features

### Error Handling
- Continues on individual failures
- Logs all errors with details
- Provides summary at completion

### Resume Capability
- Skips already migrated images
- Can be run multiple times safely
- Tracks progress in database

### File Organization
- Images stored in `businesses/` folder
- Unique naming: `{businessId}_{timestamp}_{random}.{ext}`
- Preserves original file types

### Monitoring
- Real-time progress updates
- Detailed logging
- Migration status tracking

## Troubleshooting

### Common Issues

1. **Network timeouts**: The script will retry failed downloads
2. **Invalid file types**: Non-image files are skipped with logging
3. **Storage quota**: Monitor Supabase storage usage

### Manual Cleanup

If you need to restart migration:

```sql
-- Clear migration log
DELETE FROM image_migration_log;

-- Reset image URLs (if needed)
UPDATE businesses 
SET image_url = REPLACE(image_url, 'supabase.co', 'cdn.blackdollarnetwork.com')
WHERE image_url LIKE '%supabase.co%';
```

## Post-Migration

1. **Update image upload logic**: Ensure new images go to Supabase
2. **Monitor performance**: Check image loading speeds
3. **Backup**: Consider backing up the migration log
4. **Cleanup**: Remove old CDN images after verification

## Storage Policies

The migration sets up these storage policies:
- Public read access for all business images
- Authenticated users can upload new images
- Users can manage their own business images

## File Structure

```
business-images/
├── businesses/
│   ├── {businessId}_{timestamp}_{random}.webp
│   ├── {businessId}_{timestamp}_{random}.jpg
│   └── ...
```

## Support

If you encounter issues:
1. Check the `image_migration_log` table for error details
2. Verify environment variables are set correctly
3. Ensure Supabase storage is properly configured
4. Check network connectivity to CDN