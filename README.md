# BlackOWNDemand - Black Business Directory

![BlackOWNDemand Logo](https://slsmqurdsbmiqrcwdbnf.supabase.co/storage/v1/object/public/static//bod_bg_img_v2.png)

## Overview

BlackOWNDemand is a global business directory empowering Black-owned businesses and professionals through technology, community, and connection—spotlighting, supporting, and scaling success across every industry.

## Features

- **Business Directory**: Search and browse Black-owned businesses by category, location, and tags
- **Business Profiles**: Detailed business listings with contact information, images, and social media links
- **VIP Membership**: Exclusive benefits for VIP members including priority placement and special recognition
- **Verification System**: Verified badge for authenticated businesses
- **User Dashboard**: Business owners can manage their listings and track analytics
- **Admin Panel**: Comprehensive admin tools for platform management

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Netlify
- **State Management**: React Context API
- **Routing**: React Router
- **UI Components**: Custom components with Lucide React icons
- **Forms**: React Hook Form
- **Image Handling**: Supabase Storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/black-business-directory.git
   cd black-business-directory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com
   VITE_SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The project uses Supabase as the backend. The database schema is defined in the `supabase/migrations` directory. To set up the database:

1. Install the Supabase CLI
2. Run migrations:
   ```bash
   supabase db push
   ```

## Deployment

### Development Deployment

```bash
npm run deploy:dev
```

### Production Deployment

```bash
npm run deploy:prod
```

## Email Configuration

The application uses Supabase Edge Functions for email handling:

1. **Environment Variables**:
   - `VITE_PRIMARY_SUPPORT_EMAIL`: Primary recipient for contact forms (default: support@blackdollarnetwork.com)
   - `VITE_SECONDARY_SUPPORT_EMAIL`: Secondary recipient for BCC (default: jlgreen@blackdollarnetwork.com)

2. **Edge Functions**:
   - `send-contact-email`: Handles contact form submissions
   - `subscribe`: Manages newsletter subscriptions

3. **Email Templates**:
   - Contact form emails include sender details and message content
   - All emails are automatically BCC'd to the secondary support email

## Project Structure

```
/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── admin/       # Admin panel components
│   │   ├── ads/         # Advertisement components
│   │   ├── auth/        # Authentication components
│   │   ├── business/    # Business listing components
│   │   ├── common/      # Shared components
│   │   ├── dashboard/   # User dashboard components
│   │   ├── members/    # VIP member components
│   │   ├── layout/      # Layout components
│   │   ├── payment/     # Payment processing components
│   │   ├── utils/       # Utility components
│   │   └── verification/# Business verification components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library code and utilities
│   │   └── emailConfig.ts # Email configuration
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Entry point
├── supabase/
│   ├── functions/       # Supabase Edge Functions
│   │   ├── send-contact-email/ # Contact form handler
│   │   └── subscribe/   # Newsletter subscription handler
│   └── migrations/      # Database migrations
├── .env.example         # Example environment variables
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Black Dollar Network for their vision and support
- The Black business community for their inspiration
- All contributors who have helped build this platform

## Contact

For questions or support, please contact us through our [contact form](https://blackowndemand.com/contact).