# 75 Hard Tracker PWA

A Progressive Web App for tracking your 75 Hard Challenge progress. Built with Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, and Supabase.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Copy `.env.local.example` to `.env.local` and add your Supabase credentials
   - Run the SQL from `supabase/schema.sql` in the Supabase SQL editor

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Features

- ✅ PWA with offline support
- ✅ User authentication (login/register)
- ✅ Dark mode theme
- ✅ Mobile-first responsive design
- ✅ Supabase integration
- ✅ TypeScript for type safety
- ✅ Protected routes with middleware

## Project Structure

```
├── app/                  # Next.js app router pages
│   ├── auth/            # Authentication pages
│   └── dashboard/       # Protected dashboard
├── components/          # React components
│   └── ui/             # Shadcn UI components
├── lib/                # Utility functions
│   └── supabase/       # Supabase client configuration
├── public/             # Static assets and PWA icons
├── supabase/           # Database schema
└── types/              # TypeScript type definitions
```

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking