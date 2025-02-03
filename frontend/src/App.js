import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './App.css';

Chart.register(...registerables);

function App() {
  const [tokens, setTokens] = useState([]);
  const [historicalData, setHistoricalData] = useState({});
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 3;

  // fetchTokenPrices を useCallback でメモ化
  const fetchTokenPrices = useCallback(async () => {
    try {
      const response = await axios.get('/api/crypto');
      const tokenData = response.data;
      setTokens(tokenData);
      setError(null);
      setLastUpdated(new Date().toLocaleString());

      // 各トークンの過去7日間のデータを取得
      tokenData.forEach(token => {
        fetchHistoricalPrice(token.symbol);
      });
    } catch (error) {
      console.error("Error fetching token prices:", error);
      setError("API呼出制限に達したためデータを取得できませんでした。再取得中。しばらくお待ちください。");
      setLastUpdated(new Date().toLocaleString());
    }
  }, []); // 空の依存配列で、コンポーネントが初めてレンダリングされる時に1回だけ実行

  const fetchHistoricalPrice = async (tokenId) => {
    try {
      const historyResponse = await axios.get(`/api/cryptoHistorical`, {
        params: { tokenId }
      });

      const priceData = historyResponse.data.map(price => ({
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
        display: true,
      },
      y: {
        display: true,
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

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchTokenPrices();
  }, [fetchTokenPrices]);

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
                <th>過去7日間の価格チャート</th>
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
                  <td className="chart-cell">
                    <Line data={chartData(token.symbol)} options={chartOptions} width={80} height={60} />
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
