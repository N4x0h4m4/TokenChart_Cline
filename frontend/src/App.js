import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './App.css';

Chart.register(...registerables);

function App() {
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 3;

  useEffect(() => {
    // 初回レンダリング時にキャッシュされたデータを表示
    if (tokens.length > 0) {
      tokens.forEach(token => {
        if (token.symbol === "BTC") {  // BTCのみ過去データを取得
          fetchHistoricalPrice(token.symbol);
        }
      });
    }
  }, [tokens, currentPage]);

  const fetchTokenPrices = async () => {
    try {
      // サーバーレス関数を呼び出してCoinMarketCapからデータを取得
      const response = await axios.get('/api/crypto');
      const tokenData = response.data;

      setTokens(tokenData);  // 新しいデータをセット
      setError(null);
      setLastUpdated(new Date().toLocaleString());

      // BTCの過去7日間のデータを取得
      tokenData.forEach(token => {
        if (token.symbol === "BTC") {
          fetchHistoricalPrice(token.symbol);
        }
      });
    } catch (error) {
      console.error("Error fetching token prices:", error);
      setError("API呼出制限に達したためデータを取得できませんでした。再取得中。しばらくお待ちください。");
      setLastUpdated(new Date().toLocaleString());
    }
  };

  const fetchHistoricalPrice = async (tokenId) => {
    try {
      // サーバーレス関数を呼び出して過去7日間のデータを取得
      const response = await axios.get(`/api/cryptoHistorical?tokenId=${tokenId}`);
      const priceData = response.data.data.map(item => ({
        time: new Date(item.timestamp * 1000), // UNIX timestampを日付に変換
        price: item.close,  // 終値を使用
      }));

      setHistoricalData(prevData => ({
        ...prevData,
        [tokenId]: priceData,
      }));
    } catch (error) {
      console.error(`Failed to fetch historical data for ${tokenId}`, error);
    }
  };

  const chartData = (tokenId) => {
    const history = historicalData[tokenId] || [];
    return {
      labels: history.map(data => data.time.toLocaleDateString()),
      datasets: [
        {
          label: '過去7日間の価格',
          data: history.map(data => data.price),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const displayedTokens = tokens.slice((currentPage - 1) * tokensPerPage, currentPage * tokensPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);  // ページ遷移時もキャッシュデータ使用
  };

  return (
    <div className="App">
      <h1>トークン価格チャート</h1>

      {/* 手動で最新の価格を取得するボタン */}
      <div className="refresh-button">
        <button onClick={fetchTokenPrices}>最新の価格を取得</button>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          最終更新: {lastUpdated}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!error && (
        <>
          <table>
            <thead>
              <tr>
                <th>トークン</th>
                <th>価格 (USD)</th>
                <th>24h 上昇率</th>
              </tr>
            </thead>
            <tbody>
              {displayedTokens.map(token => (
                <tr key={token.id}>
                  <td>{token.name} ({token.symbol.toUpperCase()})</td>
                  <td>{token.quote.USD.price.toFixed(2)} USD</td>
                  <td className={token.quote.USD.percent_change_24h > 0 ? 'positive' : 'negative'}>
                    {token.quote.USD.percent_change_24h ? `${token.quote.USD.percent_change_24h.toFixed(2)}%` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* BTCの過去7日間の価格チャート */}
          {historicalData["BTC"] && (
            <div className="chart-container">
              <h2>BTC 過去7日間の価格チャート</h2>
              <Line data={chartData("BTC")} options={chartOptions} width={80} height={60} />
            </div>
          )}

          <div className="pagination">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>前のページ</button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage * tokensPerPage >= tokens.length}>次のページ</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
