# WeWinBid - API Reference

<div align="center">

**Complete API Documentation**

*Version 2.0 - Janvier 2026*

Base URL: `https://api.wewinbid.com` | Dev: `http://localhost:3000`

</div>

---

## Table des Matières

1. [Authentication](#authentication)
2. [Tenders API](#tenders-api)
3. [Documents API](#documents-api)
4. [AI API](#ai-api)
5. [Team API](#team-api)
6. [Marketplace API](#marketplace-api)
7. [Analytics API](#analytics-api)
8. [Webhooks](#webhooks)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview

WeWinBid uses **Supabase Auth** with JWT tokens. All authenticated endpoints require the `Authorization` header.

### Headers

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
Accept-Language: fr | en | de | es | it | pt | nl | ar
```

### Obtaining a Token

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

const token = data.session?.access_token;
```

### Token Refresh

Tokens are automatically refreshed by the Supabase client. Manual refresh:

```typescript
const { data, error } = await supabase.auth.refreshSession();
```

---

## Tenders API

### List Tenders

```http
GET /api/tenders
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (DRAFT, IDENTIFIED, etc.) |
| `country` | string | ISO 3166-1 alpha-2 country code |
| `sector` | string | Sector identifier |
| `minBudget` | number | Minimum budget filter |
| `maxBudget` | number | Maximum budget filter |
| `deadline` | string | Filter by deadline (ISO 8601) |
| `search` | string | Search in title/description |
| `sort` | string | Field:direction (e.g., `deadline:asc`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Marché de vidéosurveillance",
      "reference": "AO-2026-001",
      "description": "Installation de caméras...",
      "status": "ANALYZING",
      "budget_min": 50000,
      "budget_max": 100000,
      "deadline": "2026-02-15T12:00:00Z",
      "country": "FR",
      "sector": "security",
      "buyer": {
        "id": "uuid",
        "name": "Ville de Paris",
        "type": "public"
      },
      "ai_score": 85,
      "documents_count": 3,
      "created_at": "2026-01-20T10:00:00Z",
      "updated_at": "2026-01-25T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Get Single Tender

```http
GET /api/tenders/:id
```

**Response (200):**

```json
{
  "id": "uuid",
  "title": "Marché de vidéosurveillance",
  "reference": "AO-2026-001",
  "description": "Installation de caméras de surveillance...",
  "full_description": "Detailed description...",
  "status": "ANALYZING",
  "budget_min": 50000,
  "budget_max": 100000,
  "deadline": "2026-02-15T12:00:00Z",
  "submission_deadline": "2026-02-10T18:00:00Z",
  "country": "FR",
  "region": "Île-de-France",
  "sector": "security",
  "subsector": "video_surveillance",
  "tender_type": "public_french",
  "procedure_type": "open",
  "buyer": {
    "id": "uuid",
    "name": "Ville de Paris",
    "type": "public",
    "siret": "12345678901234",
    "contact_email": "marches@paris.fr"
  },
  "requirements": {
    "certifications": ["ISO 9001", "APSAD"],
    "insurance_min": 1000000,
    "experience_years": 3,
    "financial_capacity": 200000
  },
  "documents": [
    {
      "id": "uuid",
      "name": "Cahier des charges.pdf",
      "type": "specifications",
      "size": 2048576,
      "url": "..."
    }
  ],
  "ai_score": {
    "overall": 85,
    "criteria": {
      "sector_match": 90,
      "certifications": 80,
      "experience": 85,
      "financial_capacity": 82,
      "geographic_coverage": 88
    },
    "recommendations": [
      "Mettre en avant votre certification APSAD",
      "Inclure 3 références similaires"
    ],
    "calculated_at": "2026-01-25T10:00:00Z"
  },
  "response": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "progress": 60,
    "steps_completed": ["administrative", "technical"],
    "steps_pending": ["financial", "submission"]
  },
  "created_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-25T14:30:00Z"
}
```

---

### Create Tender

```http
POST /api/tenders
```

**Body:**

```json
{
  "title": "Marché de vidéosurveillance",
  "reference": "AO-2026-001",
  "description": "Installation de caméras...",
  "budget_min": 50000,
  "budget_max": 100000,
  "deadline": "2026-02-15T12:00:00Z",
  "country": "FR",
  "sector": "security",
  "buyer_id": "uuid",
  "tender_type": "public_french"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "title": "Marché de vidéosurveillance",
  "status": "DRAFT",
  "created_at": "2026-01-25T10:00:00Z"
}
```

---

### Update Tender

```http
PATCH /api/tenders/:id
```

**Body:** (partial update)

```json
{
  "status": "QUALIFIED",
  "notes": "Tender qualified after review"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "status": "QUALIFIED",
  "updated_at": "2026-01-25T15:00:00Z"
}
```

---

### Delete Tender

```http
DELETE /api/tenders/:id
```

**Response (204):** No content

---

### Get Drafts (Ongoing Tenders)

```http
GET /api/tenders/drafts
```

Returns tenders with status: `DRAFT`, `ANALYSIS`, `IN_PROGRESS`, `REVIEW`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Specific draft status |
| `urgency` | string | `critical`, `urgent`, `normal` |
| `search` | string | Search query |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Marché informatique",
      "status": "IN_PROGRESS",
      "progress": 65,
      "deadline": "2026-02-01T12:00:00Z",
      "days_remaining": 7,
      "urgency": "urgent",
      "buyer_name": "Conseil Régional"
    }
  ],
  "summary": {
    "total": 12,
    "by_status": {
      "DRAFT": 3,
      "ANALYSIS": 2,
      "IN_PROGRESS": 5,
      "REVIEW": 2
    },
    "critical_count": 2,
    "urgent_count": 4
  }
}
```

---

## Documents API

### Upload Document

```http
POST /api/documents
Content-Type: multipart/form-data
```

**Form Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The document file |
| `tender_id` | string | Associated tender (optional) |
| `type` | string | Document type (kbis, insurance, dc1, etc.) |
| `expires_at` | string | Expiration date (ISO 8601) |

**Response (201):**

```json
{
  "id": "uuid",
  "name": "KBIS_2026.pdf",
  "type": "kbis",
  "size": 524288,
  "mime_type": "application/pdf",
  "url": "https://storage.supabase.co/...",
  "expires_at": "2026-12-31T23:59:59Z",
  "created_at": "2026-01-25T10:00:00Z"
}
```

**Limits:**
- Max file size: 10MB
- Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG

---

### List Documents

```http
GET /api/documents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tender_id` | string | Filter by tender |
| `type` | string | Document type |
| `expiring` | boolean | Show expiring documents |
| `search` | string | Search in name |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "KBIS_2026.pdf",
      "type": "kbis",
      "size": 524288,
      "expires_at": "2026-12-31T23:59:59Z",
      "days_until_expiry": 340,
      "is_expiring_soon": false
    }
  ],
  "summary": {
    "total": 25,
    "expiring_soon": 3,
    "expired": 1
  }
}
```

---

### Delete Document

```http
DELETE /api/documents/:id
```

**Response (204):** No content

---

## AI API

### Generate AI Score

```http
POST /api/ai/score
```

**Body:**

```json
{
  "tender_id": "uuid",
  "company_id": "uuid",
  "force_refresh": false
}
```

**Response (200):**

```json
{
  "score": 85,
  "criteria": [
    {
      "name": "sector_match",
      "label": "Correspondance sectorielle",
      "score": 90,
      "weight": 0.3,
      "max_points": 30,
      "earned_points": 27,
      "analysis": "Forte correspondance avec le secteur sécurité électronique"
    },
    {
      "name": "certifications",
      "label": "Certifications",
      "score": 80,
      "weight": 0.2,
      "max_points": 20,
      "earned_points": 16,
      "analysis": "Certification ISO 9001 présente, APSAD manquante"
    },
    {
      "name": "experience",
      "label": "Expérience",
      "score": 85,
      "weight": 0.2,
      "max_points": 20,
      "earned_points": 17,
      "analysis": "5 ans d'expérience avec 12 références similaires"
    },
    {
      "name": "financial_capacity",
      "label": "Capacité financière",
      "score": 82,
      "weight": 0.15,
      "max_points": 15,
      "earned_points": 12.3,
      "analysis": "Chiffre d'affaires suffisant (ratio 2.5x)"
    },
    {
      "name": "geographic_coverage",
      "label": "Couverture géographique",
      "score": 88,
      "weight": 0.15,
      "max_points": 15,
      "earned_points": 13.2,
      "analysis": "Présence confirmée en Île-de-France"
    }
  ],
  "recommendations": [
    "Obtenir la certification APSAD pour améliorer le score de +5 points",
    "Mettre en avant vos 12 références similaires dans le mémoire technique",
    "Inclure une attestation de capacité financière récente"
  ],
  "estimated_win_rate": "75-85%",
  "category": "excellent",
  "cached": false,
  "calculated_at": "2026-01-25T10:30:00Z"
}
```

**Rate Limit:** 20 requests/minute

---

### Generate Image (DALL-E 3)

```http
POST /api/ai/generate-image
```

**Body:**

```json
{
  "prompt": "Une équipe professionnelle célébrant la victoire d'un appel d'offres",
  "style": "professional",
  "size": "1024x1024",
  "quality": "hd",
  "context": "LinkedIn post celebrating tender win"
}
```

**Styles disponibles:**

| Style | Description |
|-------|-------------|
| `professional` | Clean, corporate imagery |
| `creative` | Artistic, vibrant colors |
| `technical` | Technical diagrams, blueprints |
| `minimalist` | Simple, clean design |
| `corporate` | Business-focused imagery |
| `modern` | Contemporary design |
| `illustration` | Hand-drawn style |
| `infographic` | Data visualization style |

**Sizes:**

| Size | Aspect Ratio |
|------|--------------|
| `1024x1024` | Square (1:1) |
| `1792x1024` | Landscape (16:9) |
| `1024x1792` | Portrait (9:16) |

**Response (200):**

```json
{
  "success": true,
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "revisedPrompt": "A professional team of business people in modern office...",
  "metadata": {
    "style": "professional",
    "size": "1024x1024",
    "quality": "hd",
    "model": "dall-e-3",
    "generatedAt": "2026-01-25T10:30:00Z"
  }
}
```

**Rate Limit:** 10 requests/minute

---

### Generate Presentation

```http
POST /api/ai/generate-presentation
```

**Body:**

```json
{
  "topic": "Notre proposition pour le marché de vidéosurveillance",
  "slideCount": 8,
  "style": "professional",
  "includeImages": true,
  "language": "fr",
  "context": {
    "company_name": "SecurTech SAS",
    "tender_title": "Marché vidéosurveillance Ville de Paris"
  }
}
```

**Response (200):**

```json
{
  "presentation": {
    "title": "Notre proposition pour le marché de vidéosurveillance",
    "subtitle": "SecurTech SAS - Solution innovante et fiable",
    "slides": [
      {
        "number": 1,
        "type": "title",
        "title": "Notre proposition",
        "subtitle": "Marché vidéosurveillance Ville de Paris",
        "imageUrl": "https://...",
        "notes": "Slide d'introduction - 30 secondes"
      },
      {
        "number": 2,
        "type": "content",
        "title": "Qui sommes-nous ?",
        "content": [
          "15 ans d'expérience en sécurité électronique",
          "200+ installations réussies",
          "Certifications ISO 9001 et APSAD"
        ],
        "imageUrl": "https://...",
        "notes": "Présenter brièvement l'entreprise"
      }
    ],
    "metadata": {
      "totalSlides": 8,
      "estimatedDuration": "15-20 minutes",
      "generatedAt": "2026-01-25T10:30:00Z"
    }
  }
}
```

**Rate Limit:** 5 requests/minute

---

### Generate Document

```http
POST /api/ai/generate-document
```

**Body:**

```json
{
  "type": "memoire_technique",
  "tender_id": "uuid",
  "company_id": "uuid",
  "options": {
    "include_references": true,
    "include_methodology": true,
    "include_team": true,
    "language": "fr"
  }
}
```

**Document Types:**

| Type | Description |
|------|-------------|
| `memoire_technique` | Technical memory |
| `lettre_motivation` | Cover letter |
| `dc1` | Candidature form |
| `dc2` | Declaration form |
| `dc4` | Subcontracting form |
| `acte_engagement` | Commitment act |
| `dpgf` | Price breakdown |

**Response (200):**

```json
{
  "document": {
    "type": "memoire_technique",
    "title": "Mémoire Technique - Marché Vidéosurveillance",
    "content": "# 1. Présentation de l'entreprise\n\n...",
    "format": "markdown",
    "sections": [
      { "title": "Présentation", "wordCount": 450 },
      { "title": "Méthodologie", "wordCount": 800 },
      { "title": "Moyens techniques", "wordCount": 600 }
    ],
    "metadata": {
      "totalWords": 3500,
      "estimatedPages": 12,
      "generatedAt": "2026-01-25T10:30:00Z"
    }
  },
  "downloadUrl": "/api/documents/download/uuid"
}
```

**Rate Limit:** 5 requests/minute

---

## Team API

### Get Team Members

```http
GET /api/team
```

**Response (200):**

```json
{
  "team": {
    "id": "uuid",
    "name": "SecurTech SAS",
    "owner_id": "uuid",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "owner@securtech.fr",
      "name": "Jean Dupont",
      "role": "owner",
      "permissions": {
        "can_view_tenders": true,
        "can_edit_tenders": true,
        "can_create_tenders": true,
        "can_delete_tenders": true,
        "can_view_documents": true,
        "can_edit_documents": true,
        "can_export_documents": true,
        "can_view_analytics": true,
        "can_manage_team": true
      },
      "joined_at": "2025-01-01T00:00:00Z"
    }
  ],
  "billing": {
    "max_free_members": 2,
    "current_members": 5,
    "extra_members": 3,
    "extra_member_price": 10,
    "monthly_team_cost": 30
  },
  "invitations": [
    {
      "id": "uuid",
      "email": "new@securtech.fr",
      "role": "member",
      "expires_at": "2026-02-01T00:00:00Z",
      "status": "pending"
    }
  ]
}
```

---

### Invite Team Member

```http
POST /api/team/invite
```

**Body:**

```json
{
  "email": "new@securtech.fr",
  "role": "member",
  "permissions": {
    "can_view_tenders": true,
    "can_edit_tenders": true,
    "can_create_tenders": true,
    "can_view_documents": true
  }
}
```

**Roles:**

| Role | Description |
|------|-------------|
| `owner` | Full access + billing |
| `admin` | Full access (no billing) |
| `member` | Edit access |
| `viewer` | Read-only access |

**Response (201):**

```json
{
  "invitation": {
    "id": "uuid",
    "email": "new@securtech.fr",
    "role": "member",
    "token": "abc123...",
    "expires_at": "2026-02-01T00:00:00Z"
  },
  "billing_impact": {
    "new_member_count": 6,
    "new_extra_cost": 40
  }
}
```

---

### Update Member Role

```http
PATCH /api/team/members/:id
```

**Body:**

```json
{
  "role": "admin",
  "permissions": {
    "can_manage_team": true
  }
}
```

**Response (200):**

```json
{
  "member": {
    "id": "uuid",
    "role": "admin",
    "updated_at": "2026-01-25T10:30:00Z"
  }
}
```

---

### Remove Team Member

```http
DELETE /api/team/members/:id
```

**Response (200):**

```json
{
  "success": true,
  "billing_impact": {
    "new_member_count": 4,
    "new_extra_cost": 20
  }
}
```

---

## Marketplace API

### List Partners

```http
GET /api/marketplace/partners
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sector` | string | Filter by sector |
| `country` | string | Filter by country |
| `certification` | string | Required certification |
| `min_rating` | number | Minimum rating (1-5) |
| `search` | string | Search query |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "company_name": "ElecPro SAS",
      "sectors": ["electrical", "security"],
      "certifications": ["ISO 9001", "Qualifelec"],
      "locations": ["FR-IDF", "FR-ARA"],
      "rating": 4.8,
      "reviews_count": 24,
      "description": "Spécialiste en installations électriques...",
      "contact": {
        "email": "contact@elecpro.fr",
        "phone": "+33 1 23 45 67 89"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "total": 156
  }
}
```

---

### Request Partnership

```http
POST /api/marketplace/requests
```

**Body:**

```json
{
  "partner_id": "uuid",
  "tender_id": "uuid",
  "message": "Nous recherchons un partenaire pour le lot électricité...",
  "proposed_share": 30,
  "type": "subcontracting"
}
```

**Response (201):**

```json
{
  "request": {
    "id": "uuid",
    "status": "pending",
    "created_at": "2026-01-25T10:30:00Z"
  }
}
```

---

## Analytics API

### Get Dashboard Stats

```http
GET /api/analytics/dashboard
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | `week`, `month`, `quarter`, `year` |
| `start_date` | string | Custom start date |
| `end_date` | string | Custom end date |

**Response (200):**

```json
{
  "summary": {
    "total_tenders": 45,
    "active_tenders": 12,
    "won_tenders": 18,
    "lost_tenders": 8,
    "win_rate": 69.2,
    "total_revenue": 1250000,
    "pipeline_value": 850000
  },
  "trends": {
    "tenders": {
      "current": 45,
      "previous": 38,
      "change": 18.4
    },
    "win_rate": {
      "current": 69.2,
      "previous": 62.5,
      "change": 10.7
    }
  },
  "by_status": {
    "DRAFT": 3,
    "IDENTIFIED": 2,
    "ANALYZING": 4,
    "QUALIFIED": 3,
    "PREPARING": 5,
    "SUBMITTED": 10,
    "WON": 18,
    "LOST": 8
  },
  "by_sector": [
    { "sector": "security", "count": 15, "win_rate": 73.3 },
    { "sector": "construction", "count": 12, "win_rate": 66.7 }
  ],
  "timeline": [
    { "date": "2026-01", "submitted": 8, "won": 5, "lost": 2 },
    { "date": "2025-12", "submitted": 6, "won": 4, "lost": 1 }
  ]
}
```

---

### Get ROI Report

```http
GET /api/analytics/roi
```

**Response (200):**

```json
{
  "roi": {
    "total_investment": 2400,
    "total_revenue": 1250000,
    "net_profit": 1247600,
    "roi_percentage": 51983.3,
    "cost_per_tender": 53.3,
    "revenue_per_tender": 27777.8
  },
  "time_savings": {
    "estimated_hours_saved": 480,
    "hourly_rate": 75,
    "value_saved": 36000
  },
  "breakdown": {
    "subscription_cost": 1188,
    "ai_usage_cost": 312,
    "team_cost": 900
  }
}
```

---

## Webhooks

### Stripe Webhook

```http
POST /api/webhooks/stripe
```

**Headers:**

```http
Stripe-Signature: t=1234567890,v1=...
```

**Supported Events:**

| Event | Description |
|-------|-------------|
| `checkout.session.completed` | New subscription |
| `customer.subscription.updated` | Plan change |
| `customer.subscription.deleted` | Cancellation |
| `invoice.paid` | Payment received |
| `invoice.payment_failed` | Payment failed |

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "budget_min",
        "message": "Must be a positive number"
      }
    ]
  },
  "requestId": "req_abc123"
}
```

### Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/ai/generate-image` | 10 | 1 minute |
| `/api/ai/generate-presentation` | 5 | 1 minute |
| `/api/ai/generate-document` | 5 | 1 minute |
| `/api/ai/score` | 20 | 1 minute |
| `/api/documents/upload` | 10 | 1 minute |
| `/api/auth/login` | 5 | 5 minutes |
| Default | 100 | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1706180400
```

### Rate Limited Response (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 45
  }
}
```

---

## SDKs & Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get tenders
const { data: tenders } = await supabase
  .from('tenders')
  .select('*, buyer:buyers(*)')
  .eq('status', 'QUALIFIED')
  .order('deadline', { ascending: true });

// Generate AI score
const response = await fetch('/api/ai/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    tender_id: 'uuid',
    company_id: 'uuid',
  }),
});
```

### cURL

```bash
# Get tenders
curl -X GET "https://api.wewinbid.com/api/tenders?status=QUALIFIED" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate image
curl -X POST "https://api.wewinbid.com/api/ai/generate-image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Professional team", "style": "corporate"}'
```

---

## Changelog

### v2.0 (Janvier 2026)

- Added team management API
- Added drafts/ongoing tenders endpoint
- Added multi-language support
- Improved AI scoring with 5 criteria
- Added DALL-E 3 image generation

### v1.0 (2025)

- Initial release
- Basic tender CRUD
- Document management
- AI scoring (basic)

---

*Documentation générée automatiquement - Janvier 2026*
