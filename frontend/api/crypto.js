// pages/api/crypto.js
const API_KEY = '716180a2-242e-421e-b83d-26e6ea2ca2d8'; // CoinMarketCapのAPIキー
const API_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

export default async function handler(req, res) {
  try {
    // CoinMarketCap APIから最新の暗号通貨データを取得
    const response = await fetch(`${API_BASE_URL}/cryptocurrency/listings/latest`, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
      },
      params: {
        start: 1,
        limit: 10,
        convert: 'USD',
        sort: 'market_cap',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data from CoinMarketCap' });
    }

    const data = await response.json();
    res.status(200).json(data.data);
  } catch (error) {
    console.error('Error fetching data from CoinMarketCap:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
