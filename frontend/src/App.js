// frontend/src/App.js
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
    if (tokens.length > 0) {
      tokens.forEach(token => {
        fetchHistoricalPrice(token.symbol);
      });
    }
  }, [tokens, currentPage]);

  const fetchTokenPrices = async () => {
    try {
      // サーバーレス関数でAPIを呼び出す
      const response = await axios.get('/api/crypto');
      const tokenData = response.data;
      setTokens(tokenData);  // 新しいデータをセット
      setError(null);
      setLastUpdated(new Date().toLocaleString());

      // 各トークンの過去3日間のデータを取得
      tokenData.forEach(token => {
        fetchHistoricalPrice(token.id);
      });
    } catch (error) {
      console.error("Error fetching token prices:", error);
      setError("API呼出制限に達したためデータを取得できませんでした。再取得中。しばらくお待ちください。");
      setLastUpdated(new Date().toLocaleString());
    }
  };

  const fetchHistoricalPrice = async (tokenId) => {
    try {
      const historyResponse = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical`, {
        headers: {
          'X-CMC_PRO_API_KEY': '716180a2-242e-421e-b83d-26e6ea2ca2d8'
        },
        params: {
          symbol: tokenId,
          time_start: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
          time_end: Math.floor(Date.now() / 1000),
          convert: 'USD',
        }
      });

      const priceData = historyResponse.data.data.map(price => ({
        time: new Date(price.timestamp * 1000),
        price: price.close,
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
          label: '過去3日間の価格',
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
    setCurrentPage(page);
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
                <th>過去3日間の価格チャート</th>
              </tr>
            </thead>
            <tbody>
              {displayedTokens.map(token => (
                <tr key={token.id}>
                  <td>{token.name} ({token.symbol.toUpperCase()})</td>
                  <td>{token.current_price} USD</td>
                  <td className={token.price_change_percentage_24h > 0 ? 'positive' : 'negative'}>
                    {token.price_change_percentage_24h ? `${token.price_change_percentage_24h.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="chart-cell">
                    <Line data={chartData(token.id)} options={chartOptions} width={80} height={60} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
