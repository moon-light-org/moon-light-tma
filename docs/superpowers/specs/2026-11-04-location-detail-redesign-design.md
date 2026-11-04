# Location detail redesign

## Intent

Make a place's detail screen easier to scan on a phone while preserving the current Explore/Home visual language and working check-in flow.

## Scope

- Shorten the empty hero; keep real place photos visible when present.
- Group the place name, category, verification state, coordinates, and map action into a compact header.
- Keep check-in near the top as a small card with its existing loading, success, and error states.
- Present description, address, phone, hours, payment details, photos, and reviews in readable sections with tighter spacing.
- Preserve existing review, report, website, and map actions. Add no points, rewards, deals, or new data requirements.
- Apply the layout to both the Map sheet and Explore full-page variants.

## Approaches considered

1. **Compact detail page (selected):** keeps the current components and color language while reducing empty space and improving hierarchy. Smallest change that addresses the screenshot.
2. Keep the large hero and refine type/spacing: less disruption, but leaves the most visible empty area.
3. Follow the Figma merchant wireframe closely: clear structure, but introduces visual patterns and reward/deal content outside this gradual pass.

## Constraints and verification

Use existing React components, Lucide icons, and CSS. No new dependency or backend field. Check phone and desktop widths, missing-photo and photo-present states, and existing actions. The Figma merchant detail is layout guidance; the current Explore/Home UI remains the visual baseline.
