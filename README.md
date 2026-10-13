# eKYC Verification System

A fully functional browser-based eKYC (electronic Know Your Customer) verification system built with TanStack Start, featuring ID card OCR, face detection, liveness detection, and face matching — all running locally in the browser with zero external API dependencies.

## Features

- **ID Card Upload**: Front and back upload with drag-and-drop, image validation, and preview
- **OCR Processing**: Local Tesseract.js OCR with structured field extraction
- **Card Detection**: OpenCV.js-based document boundary detection and perspective correction
- **Template System**: Extensible ID card template architecture (RUET Student ID included)
- **Portrait Extraction**: Template-aware + face-refinement portrait extraction
- **Camera Access**: Secure camera permission handling with graceful fallbacks
- **Liveness Detection**: Randomized active challenges (turn left, turn right, blink)
- **Face Matching**: Browser-based face embedding comparison using @vladmandic/human
- **PostgreSQL Persistence**: Drizzle ORM with verification sessions and attempts
- **Responsive UI**: Mobile-first dark theme with shadcn/ui components

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | TanStack Start (React 19, TanStack Router) |
| Styling | Tailwind CSS v4, shadcn/ui (radix-nova) |
| Database | PostgreSQL + Drizzle ORM |
| OCR | Tesseract.js v7 (WebAssembly) |
| Computer Vision | @techstark/opencv-js |
| Face/Biometrics | @vladmandic/human v3.3.6 |
| Validation | Zod v4 |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 12+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env

# Set up database (run migrations)
pnpm db:push

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `VITE_FACE_MATCH_THRESHOLD` | Face match distance threshold | `0.45` |
| `VITE_MAX_UPLOAD_SIZE_MB` | Max image upload size | `15` |
| `VITE_VERIFICATION_MAX_ATTEMPTS` | Max verification retries | `3` |
| `VITE_LIVENESS_CHALLENGE_TIMEOUT_MS` | Per-challenge timeout | `30000` |

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── verification/          # Verification flow components
│       ├── verification-wizard.tsx
│       └── ...
├── lib/
│   ├── verification/
│   │   ├── types.ts           # Core types
│   │   ├── schemas.ts         # Zod schemas
│   │   ├── config.ts          # Client-safe config
│   │   ├── failure-reasons.ts # Error catalog
│   │   ├── state-machine.ts   # Verification FSM
│   │   ├── ocr/               # OCR service & parser
│   │   ├── document/          # Image processing (OpenCV)
│   │   ├── face/              # Face engine, liveness, matching
│   │   ├── id-cards/          # Template system
│   │   │   ├── registry.ts
│   │   │   ├── types.ts
│   │   │   └── ruet/          # RUET Student ID template
│   │   └── verification-pipeline.ts
│   └── db/                    # Drizzle schema & repositories
├── server/
│   └── verification-server.ts # Server functions
├── routes/
│   ├── verify.tsx             # Main verification flow
│   ├── home.tsx               # Post-verification page
│   └── __root.tsx             # App shell (dark mode, tooltip provider)
└── styles.css                 # Tailwind + shadcn theme
```

## Verification Flow

```
1. FRONT_UPLOAD     → Upload ID card front (photo + details)
2. BACK_UPLOAD      → Upload ID card back (issue date)
3. PROCESSING_ID    → Card detection + perspective correction
4. OCR_PROCESSING   → Tesseract OCR on both sides
5. PORTRAIT_EXTRACTION → Extract photo from card
6. REVIEW           → User confirms extracted fields
7. CAMERA_PERMISSION → Request camera access
8. CAMERA_READY     → Preview + positioning guide
9. LIVENESS         → Randomized challenges (3x)
10. FACE_MATCHING   → Compare live face vs ID portrait
11. SAVING_RESULT   → Persist to PostgreSQL
12. SUCCESS/FAILED  → Result screen with retry option
```

## Adding New ID Card Templates

1. Create a new template module in `src/lib/verification/id-cards/<name>/`
2. Implement the `IdCardTemplate` interface:
   - `detect()` - Identify card from OCR text
   - `parseFront()` / `parseBack()` - Extract fields
   - `extractPortrait()` - Define portrait region + face refinement
   - `validate()` - Field validation rules
3. Register in `src/lib/verification/id-cards/registry.ts`

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage
```

Tests cover:
- Normalizers (blood group, phone, ID, date)
- State machine transitions
- Liveness challenge generation
- Face matching logic
- RUET template detection

## Production Build

```bash
pnpm build
node .output/server/index.mjs
```

## Security & Privacy

- **No image storage**: ID images and camera frames never leave the browser
- **No embedding storage**: Face descriptors are only held in memory
- **Local processing**: All CV/ML runs in-browser (WebGL/WebAssembly)
- **Server validation**: Server functions validate all submissions
- **CSRF protection**: TanStack Start server function boundaries

## License

MIT