# Location sheet and category images

## Intent

Make place details easier to scan using the supplied sheet screenshot, and give places without photos a relevant category image.

## Approaches

- **Selected for the sheet:** adapt the screenshot's hierarchy and card layout using data and actions already in MoonLight. Keep the current check-in behavior and review/report flows. Omit points and deals because neither is modeled in the app.
- **Alternative:** reproduce every screenshot element. This needs new points and deals data, rules, and APIs.
- **Selected for images:** use one openly licensed stock image for each of the six `main_category` values and write its URL to `places.image_url` only where that field is empty. Preserve existing place photos. Use the same mapping for newly submitted places without a photo.
- **Alternative:** use an image for every detailed `category`. The live data has 604 distinct, free-form labels, many appearing only once, so this is hard to curate and maintain.

## UI scope

- Show the place name and close/back action first, then compact payment and verification badges when supported by real fields.
- Show a compact check-in card near the top with its current loading, disabled, success, error, and review-follow-up states. Do not display a points reward.
- Group description, address, phone, hours, payments, website, photos, and reviews into cards with the screenshot's spacing and typography. Keep map, add-review, report, and see-all actions.
- Apply to both the map sheet and Explore page variant, on narrow and wide screens.
- Use descriptive image alt text for category stock photos. The visible category-image tag was removed at the user's request.

## Image seeding

- Source six non-Unsplash+ images under an open license, record their source URLs and license in a manifest, and host optimized copies in the project's Supabase Storage.
- Inventory before mutation: 27,297 places; 20,108 missing `image_url`; broad categories are accommodation (859), bitcoin (2,178), food/drink (6,444), other (15,567), retail (1,367), services (882). Bitcoin currently has no missing images.
- Set only empty `image_url` values, in controlled batches by broad category. Record changed row counts and verify a sample from every category. Do not change existing images or add category defaults to user photo records.
- Legacy rows stored as `other` can display a more specific category through the frontend's normalization rules. Correct only newly seeded default URLs on these rows so the image matches the displayed category.
- Newly submitted places without an image receive the same category default in the API. Existing images remain untouched.

## Constraints and checks

- Use current React/CSS, API, and Supabase conventions. Do not add a new dependency.
- Check the frontend build and existing action states, then verify before/after image coverage from the live database.
- The stock images illustrate categories, not a specific merchant. The image alt text makes that distinction for screen readers.
