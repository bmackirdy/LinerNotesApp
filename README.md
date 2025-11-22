# Liner Notes

A clean, distraction-free web app for vinyl record collectors to catalog, organize, and share their physical collections.

Liner Notes helps vinyl collectors catalog, maintain, and share their record collections, track condition and updates, build wish lists, and connect with fellow enthusiasts.

## Tech Stack
- React (Vite) PWA client in `client/`
- Express API in `api/`
- Supabase for auth and database
- Documentation in `docs/`

## Repository Layout
- `client/` — React PWA (local dev with Vite)
- `api/` — Express API (local dev with Node)
- `supabase/` — SQL migrations and seeds
- `docs/` — PRD, sitemap, OpenAPI, deployment notes

## 🚀 Project Status

### ✅ **Currently Working**
- **🔍 Music Search** - Search albums, artists, and labels from database
- **🔐 Authentication** - User signup/login with Supabase Auth
- **🎨 Modern UI** - Responsive design with Tailwind CSS and shadcn/ui
- **☁️ Cloud API** - AWS Lambda backend with full CRUD operations
- **🗄️ Database** - Supabase PostgreSQL with music catalog

### 🔄 **In Development**
- **📚 Collection Management** - Add albums to personal collections
- **❤️ Wishlist Feature** - Save albums to wishlist
- **👤 User Profiles** - Display user stats and preferences

### 🛠️ **Tech Stack**
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** AWS Lambda, Serverless Framework
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** AWS Amplify (Frontend), AWS Serverless (API)

### 📊 **Database Schema**
```sql
albums (id, title, artist, release_date, cover_image)
collections (id, name, created_at)
profiles (id, username, avatar_url)
labels (id, name)
artists (id, name)
```

### 🔗 **API Endpoints**
- `GET /dev/v1/search?q=<query>` - Search music catalog
- `GET /dev/v1/collections` - Get user collections
- `POST /dev/collections/albums` - Add album to collection
- `GET /health` - API health check
- `GET /debug` - Debug information

### 🌐 **Live URLs**
- **🚀 Live App:** https://main.d3ga9m7f9af0en.amplifyapp.com/
- **🔧 API:** https://rm0dtjuzqf.execute-api.us-east-1.amazonaws.com
- **🗄️ Supabase:** https://zceqlyijatqngsbgxcip.supabase.co
- **💻 Local:** http://localhost:3000

---

## Getting Started (coming soon)
Setup scripts and instructions will be added after scaffolding the client, API, and Supabase project.

---

GitHub repo: https://github.com/bmackirdy/LinerNotesApp


DEPLOYED Application: https://main.d3ga9m7f9af0en.amplifyapp.com/