export interface ExchangeRateData {
  rate: number;
  lastUpdated: string;
  source: string;
}

export const fetchExchangeRate = async (): Promise<ExchangeRateData> => {
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD'
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    const vesRate = data.rates.VES;

    if (!vesRate) {
      throw new Error('VES rate not found in API response');
    }

    return {
      rate: vesRate,
      lastUpdated: new Date().toISOString(),
      source: 'exchangerate-api.com',
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
};

export const fetchExchangeRateBackup = async (): Promise<ExchangeRateData> => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');

    if (!response.ok) {
      throw new Error(`Exchange rate backup API error: ${response.status}`);
    }

    const data = await response.json();
    const vesRate = data.rates.VES;

    if (!vesRate) {
      throw new Error('VES rate not found in backup API response');
    }

    return {
      rate: vesRate,
      lastUpdated: new Date().toISOString(),
      source: 'open.er-api.com',
    };
  } catch (error) {
    console.error('Error fetching exchange rate from backup:', error);
    throw error;
  }
};

export const getExchangeRate = async (): Promise<ExchangeRateData> => {
  try {
    return await fetchExchangeRate();
  } catch (primaryError) {
    console.warn('Primary exchange rate API failed, trying backup...');
    try {
      return await fetchExchangeRateBackup();
    } catch (backupError) {
      console.error('Both exchange rate APIs failed:', backupError);
      throw new Error(
        'Unable to fetch exchange rate. Please check your internet connection.'
      );
    }
  }
};
