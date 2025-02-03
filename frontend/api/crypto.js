// pages/api/crypto.js
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

export default async function handler(req, res) {
  try {
    // CoinGecko APIから最新の暗号通貨データを取得
    const response = await fetch(`${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data from CoinGecko' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}