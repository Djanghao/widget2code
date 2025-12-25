# Image URLs Directory

This directory contains text files with image URLs to be used in batch widget generation.

## File Format

Each file contains one URL per line. Lines starting with `#` are treated as comments.

```
# Health/Fitness Images
https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b
https://images.unsplash.com/photo-1517836357463-d25dfeac3438
https://images.unsplash.com/photo-1518611012118-696072aa579a

# Yoga and Meditation
https://images.unsplash.com/photo-1544367567-0f2fcb009e0b
https://images.unsplash.com/photo-1506126613408-eca07ce68773
```

## File Structure

### `image-urls-all.txt`
Default/fallback file containing general-purpose images across all domains.

### Domain-Specific Files (Optional)
- `image-urls-health.txt` - Workout, fitness, yoga, meditation photos
- `image-urls-food.txt` - Meals, recipes, ingredients, dining photos
- `image-urls-travel.txt` - Destinations, landmarks, hotels, scenery
- `image-urls-media.txt` - Album art, podcast covers, video thumbnails
- `image-urls-social.txt` - People, social gatherings, communication
- `image-urls-shopping.txt` - Products, fashion, retail items

## Usage

### With All Descriptions
```bash
# Uses image-urls-all.txt for all domains
node batch-generate-widgets.js --with-images --image-urls-dir=./descriptions/image-urls
```

### Domain-Specific URLs
```bash
# Will use domain-specific files when available, falling back to image-urls-all.txt
node batch-generate-widgets.js --with-images --image-urls-dir=./descriptions/image-urls --limit=10
```

## Image URL Sources

### Unsplash
Best source for high-quality, royalty-free images. Format:
```
https://images.unsplash.com/photo-[ID]?w=400
```

To find images:
1. Browse https://unsplash.com
2. Copy image URL from photo page
3. Use the direct image URL (starts with `images.unsplash.com`)

### Other Sources
Any publicly accessible image URL will work. Ensure:
- ✅ Public access (no authentication required)
- ✅ Direct image URL (ends in `.jpg`, `.png`, `.webp`)
- ✅ HTTPS protocol
- ✅ Appropriate license/permissions

## Tips

### Image Selection
- **Health**: Action shots, gym scenes, outdoor activities
- **Food**: Close-ups of meals, ingredients, dining experiences
- **Travel**: Landmarks, landscapes, cultural sites
- **Media**: Abstract art, music-related imagery
- **Social**: People interacting, community scenes

### URL Management
- Keep URLs organized by domain for better relevance
- Test URLs before adding (ensure they load)
- Use descriptive comments to categorize images
- Remove broken/expired URLs regularly

### Performance
- Limit to 50-100 URLs per domain for variety without bloat
- Reuse URLs across batches is OK (randomized selection)
- Use domain-specific files for best matching

## Example Files

### image-urls-health.txt
```
# Running and Cardio
https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b
https://images.unsplash.com/photo-1552674605-db6ffd4facb5

# Gym and Strength Training  
https://images.unsplash.com/photo-1517836357463-d25dfeac3438
https://images.unsplash.com/photo-1534438327276-14e5300c3a48

# Yoga and Meditation
https://images.unsplash.com/photo-1544367567-0f2fcb009e0b
https://images.unsplash.com/photo-1506126613408-eca07ce68773
```

### image-urls-food.txt
```
# Restaurant Dishes
https://images.unsplash.com/photo-1540189549336-e6e99c3679fe
https://images.unsplash.com/photo-1565299624946-b28f40a0ae38

# Healthy Meals
https://images.unsplash.com/photo-1546069901-ba9599a7e63c
https://images.unsplash.com/photo-1512621776951-a57141f2eefd

# Coffee and Beverages
https://images.unsplash.com/photo-1509042239860-f550ce710b93
https://images.unsplash.com/photo-1511920170033-f8396924c348
```
