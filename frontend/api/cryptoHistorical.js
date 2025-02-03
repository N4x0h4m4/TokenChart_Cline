// pages/api/cryptoHistorical.js
const API_KEY = '716180a2-242e-421e-b83d-26e6ea2ca2d8'; // CoinMarketCapのAPIキー
const API_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

export default async function handler(req, res) {
  const { tokenId } = req.query;  // トークンIDをURLクエリから取得

  try {
    const endTime = Math.floor(Date.now() / 1000);  // 現在時刻
    const startTime = endTime - 7 * 24 * 60 * 60; // 7日前の時刻

    // CoinMarketCap APIから過去7日間の暗号通貨データを取得
    const response = await fetch(`${API_BASE_URL}/cryptocurrency/ohlcv/historical`, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
      },
      params: {
        symbol: tokenId,
        time_start: startTime,
        time_end: endTime,
        convert: 'USD',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch historical data from CoinMarketCap' });
    }

    const data = await response.json();
    res.status(200).json(data.data);
  } catch (error) {
    console.error('Error fetching historical data from CoinMarketCap:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
