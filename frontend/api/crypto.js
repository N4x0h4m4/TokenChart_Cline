// frontend/api/cryptocompare.js

const API_BASE_URL = 'https://min-api.cryptocompare.com/data';

export const handler = async (req, res) => {
  const API_KEY = 'a3e3c25cdc95609196071a4c8866a43560523dd1f36269665b6b506cdc46b118';

  try {
    // トークン価格を取得するためのリクエスト
    const response = await fetch(`${API_BASE_URL}/top/mktcapfull`, {
      method: 'GET',
      headers: {
        'Authorization': `Apikey ${API_KEY}`,
      },
      params: {
        limit: '10', // 上位10のトークン
        tsym: 'USD', // 米ドルで価格を表示
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from CryptoCompare');
    }

    const data = await response.json();
    res.status(200).json(data.Data);  // CryptoCompareのレスポンスデータを返す
  } catch (error) {
    console.error('Error fetching data from CryptoCompare:', error);
    res.status(500).json({ error: 'Failed to fetch data from CryptoCompare' });
  }
};
