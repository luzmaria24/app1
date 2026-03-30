# Price Scanner App

A mobile application that scans product prices using OCR technology, converts between USD and Venezuelan Bolívares, and tracks all scanned items with a running total.

## Features

- **Camera Scanner**: Capture product prices using your phone's camera
- **OCR Technology**: Automatically extract prices from images using optical character recognition
- **Manual Currency Selection**: Choose between USD and Bolívares for each scan
- **Exchange Rate Conversion**: Set custom exchange rates for accurate conversions
- **Price History**: View all scanned items with timestamps
- **Total Calculator**: Automatically sums all prices in Bolívares
- **Database Storage**: All data persists using Supabase

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase (Database)
- Expo Camera
- OCR.space API
- Lucide Icons

## Setup Instructions

### 1. Configure Supabase

Your Supabase database has already been set up with the required schema. You need to add your Supabase credentials to the `.env` file:

1. Log in to your Supabase project
2. Navigate to Project Settings > API
3. Copy your project URL and anon/public key
4. Update the `.env` file with these values

### 2. Get OCR API Key

To enable OCR functionality, you need a free API key from OCR.space:

1. Visit [OCR.space](https://ocr.space/ocrapi)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### 3. Update Environment Variables

Edit the `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_actual_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
EXPO_PUBLIC_OCR_API_KEY=your_actual_ocr_api_key
```

## How to Use

### Scanner Tab

1. Grant camera permissions when prompted
2. Point your camera at a price tag
3. Tap the capture button (blue circle)
4. The app will automatically detect the price
5. Select the currency (USD or Bolívares)
6. Adjust the exchange rate if needed
7. Review the conversion preview
8. Tap "Save" to add the item

### History Tab

- View all scanned items sorted by date
- See the total sum in Bolívares
- Delete individual items by tapping the trash icon
- Clear all items using "Clear All"
- Pull down to refresh the list

## Database Schema

The app uses a single table `scanned_items`:

- `id`: Unique identifier
- `price_original`: Original scanned price
- `currency`: Currency type (USD or VES)
- `price_bolivares`: Converted price in Bolívares
- `exchange_rate`: Exchange rate used
- `image_uri`: Optional image reference
- `scanned_at`: Timestamp

## Development

This is an Expo managed workflow project. Run locally with:

```bash
npm install
npm run dev
```

## Notes

- OCR works best with clear, well-lit images
- The free OCR.space API has usage limits
- Camera features require a physical device (won't work in web preview)
- Exchange rates must be manually updated as they're not fetched automatically

## Future Enhancements

Potential improvements:
- Automatic exchange rate updates from an API
- Export data to CSV
- Receipt image storage
- Multiple currency support
- Shopping list organization
- Price comparison features
