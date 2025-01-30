import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId;

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

        // エラーがなければ通常の10秒間隔で更新
        if (!intervalId) {
          intervalId = setInterval(fetchTokenPrices, 10000);
        }
      } catch (error) {
        console.error("Error fetching token prices:", error);
        setError("データを取得できませんでした。一定時間が経過すると自動的に表示されます。\nしばらくお待ちください。");

        // エラー発生時は 1 分後に再試行（既存の interval は停止）
        clearInterval(intervalId);
        setTimeout(fetchTokenPrices, 60000);
      }
    };

    fetchTokenPrices(); // 初回データ取得

    return () => clearInterval(intervalId); // コンポーネントのアンマウント時にクリーンアップ
  }, []);

  return (
    <div className="App">
      <h1>仮想通貨リアルタイム価格比較</h1>

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
