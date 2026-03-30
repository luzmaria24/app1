export const performOCR = async (imageUri: string): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_OCR_API_KEY;

  if (!apiKey) {
    throw new Error('OCR API key not configured');
  }

  try {
    const formData = new FormData();
    formData.append('base64Image', imageUri);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: apiKey,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || 'OCR processing failed');
    }

    return result.ParsedResults?.[0]?.ParsedText || '';
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
};

export const extractPriceFromText = (text: string): number | null => {
  const pricePatterns = [
    /\$?\s*(\d+[.,]\d{2})/,
    /\$?\s*(\d+)/,
    /(\d+[.,]\d{2})\s*Bs/i,
    /(\d+)\s*Bs/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }

  return null;
};
