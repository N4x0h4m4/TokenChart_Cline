import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'jpy',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h'
          }
        });
        setTokens(response.data);
        setError(null); // 成功したらエラーをクリア
      } catch (error) {
        console.error("Error fetching token prices:", error);
        setError("データを取得できませんでした。一定時間が経過すると自動的に表示されます。\nしばらくお待ちください。");
      }
    };

    fetchTokenPrices();
    const intervalId = setInterval(fetchTokenPrices, 60000); // 1分ごとに更新

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App">
      <h1>トークン価格チャート</h1>

      {/* 注意書きの追加 */}
      <p className="warning">
        CoinGeckoのAPI（無料プラン）のため、1分間に10回までのリクエスト制限があります（2025年現在）。
      </p>

      {error && (
        <div className="error-message">
          {error.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      )}

      {!error && (
        <table>
          <thead>
            <tr>
              <th>トークン</th>
              <th>価格 (JPY)</th>
              <th>24h 上昇率</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(token => (
              <tr key={token.id}>
                <td>{token.name} ({token.symbol.toUpperCase()})</td>
                <td>{token.current_price}</td>
                <td className={token.price_change_percentage_24h > 0 ? 'positive' : 'negative'}>
                  {token.price_change_percentage_24h ? `${token.price_change_percentage_24h.toFixed(2)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
