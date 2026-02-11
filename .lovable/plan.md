

# Create a Logo for The Vault

## Approach

Use the Lovable AI image generation model (`google/gemini-2.5-flash-image`) via a backend function to generate a professional logo for "The Vault," then save it to the project assets and update all references.

## Steps

### 1. Create a backend function (`generate-logo`)
A one-time-use edge function that calls the AI image generation model with a detailed prompt describing the desired logo:
- "The Vault" text-based logo
- Industrial-elite aesthetic: clean, bold, modern
- Monochrome/white design (since the app uses `invert` on a dark background with cyan accents)
- Vault/shield/lock motif to represent security and performance architecture
- Minimal, scalable design suitable for navbar, hero, and favicon usage

### 2. Save the generated image
- Download the generated base64 image and save it as `src/assets/vault-logo.png`
- Optionally generate a favicon version

### 3. Update all logo references
Replace `logo.png` imports across these files:
- `src/components/landing/HeroSection.tsx`
- `src/components/layout/Navbar.tsx`
- `src/pages/Vault.tsx`

The alt text will also be updated from "Andy Andrews" to "The Vault".

### 4. Clean up
- Remove the edge function after use (it's a one-time generation tool)
- Keep the old `logo.png` as a backup

## Technical Notes

- The image generation uses `google/gemini-2.5-flash-image` through the Lovable AI gateway -- no API key needed
- If the first generation isn't perfect, the prompt can be refined and re-run
- The logo will be a PNG; an SVG version could be hand-crafted later if needed for perfect scalability

