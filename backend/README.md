# Ceynova Backend API

Node.js + Express + MongoDB backend for the Ceynova Digital Solutions admin panel.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/ceynova   # or MongoDB Atlas URI
JWT_SECRET=your_long_random_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ceynova2026
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Run the server

**Development (auto-restart on changes):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Admin login, returns JWT | No |
| GET | `/api/auth/verify` | Verify JWT token | Bearer token |

**Login body:**
```json
{ "username": "admin", "password": "ceynova2026" }
```

---

### Projects
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects` | Get all projects | No |
| GET | `/api/projects?cat=web` | Filter by category | No |
| GET | `/api/projects/:id` | Get single project | No |
| POST | `/api/projects` | Create new project | ✅ Admin |
| PUT | `/api/projects/:id` | Update project | ✅ Admin |
| DELETE | `/api/projects/:id` | Delete project | ✅ Admin |
| DELETE | `/api/projects/:id/images` | Remove specific images | ✅ Admin |

**Project fields:**
```json
{
  "title": "Project Name",
  "desc": "Short description",
  "cat": "web | mobile | uiux | ecommerce | ai | branding | marketing",
  "yr": "2026",
  "tags": "React, Node.js",
  "featured": "true",
  "order": "1"
}
```

**Image upload:** use `multipart/form-data` with field name `images` (supports multiple files).

---

### Health Check
| Method | Endpoint |
|--------|----------|
| GET | `/api/health` |

---

## Uploaded Images
Images are stored in the `uploads/` folder and served at:
```
http://localhost:5000/uploads/<filename>
```

## Notes
- JWT tokens expire after **8 hours**
- Max image file size: **10MB per file**, up to **10 images** per request
- Supported formats: `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`
