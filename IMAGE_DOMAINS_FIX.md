# Next.js Image Domains Fix

## Problem

The application was showing an error when trying to display images from randomuser.me:

```
Error: Invalid src prop (https://randomuser.me/api/portraits/women/4.jpg) on `next/image`, hostname "randomuser.me" is not configured under images in your `next.config.js`
```

## Root Cause

Next.js requires explicit configuration for external image domains for security and optimization purposes. The `randomuser.me` domain was used in the contacts data but was not configured in the Next.js configuration.

## Solution

Updated the `next.config.ts` file to include `randomuser.me` in the list of allowed image domains:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'picsum.photos',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'randomuser.me',
      port: '',
      pathname: '/**',
    },
  ],
},
```

## How It Works

1. The `remotePatterns` configuration in Next.js specifies which external domains are allowed for image optimization.
2. Each entry includes:
   - `protocol`: The protocol to use (https)
   - `hostname`: The domain name (randomuser.me)
   - `port`: The port (empty for standard ports)
   - `pathname`: The path pattern ('/**' to allow all paths)

3. This configuration allows Next.js to:
   - Optimize images from these domains
   - Cache them for better performance
   - Apply security measures

## Verification

After making this change, images from randomuser.me should load properly in the application. The error should no longer appear in the browser console.

## Additional Notes

If you need to add more external image domains in the future, follow the same pattern in the `next.config.ts` file. Common image domains you might need to add include:
- cloudinary.com
- imgur.com
- googleusercontent.com
- githubusercontent.com 