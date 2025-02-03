// frontend/src/App.js

import React, { useState, useEffect } from 'react';  // Reactを二重にインポートしていないか確認

// ここにReact以外のインポートが続きます
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
        fetchHistoricalPrice(token.CoinInfo.Name); // 過去データもキャッシュから
      });
    }
  }, [tokens, currentPage]);

  const fetchTokenPrices = async () => {
    try {
      const response = await axios.get('/api/cryptocompare');
      const tokenData = response.data;
      setTokens(tokenData); 
      setError(null);
      setLastUpdated(new Date().toLocaleString());

      tokenData.forEach(token => {
        fetchHistoricalPrice(token.CoinInfo.Name);
      });
    } catch (error) {
      console.error("Error fetching token prices:", error);
      setError("API呼出制限に達したためデータを取得できませんでした。再取得中。しばらくお待ちください。");
      setLastUpdated(new Date().toLocaleString());
    }
  };

  const fetchHistoricalPrice = async (tokenId) => {
    try {
      const historyResponse = await axios.get(`https://min-api.cryptocompare.com/data/v2/histoday`, {
        params: {
          fsym: tokenId,
          tsym: 'USD',
          limit: 7,  
          toTs: Math.floor(Date.now() / 1000),  
        },
        headers: {
          'Authorization': `Apikey a3e3c25cdc95609196071a4c8866a43560523dd1f36269665b6b506cdc46b118`
        }
      });

      const priceData = historyResponse.data.Data.Data.map(price => ({
        time: new Date(price.time * 1000),
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
                <tr key={token.CoinInfo.Id}>
                  <td>{token.CoinInfo.FullName} ({token.CoinInfo.Name.toUpperCase()})</td>
                  <td>{token.RAW.USD.PRICE} USD</td>
                  <td className={token.RAW.USD.CHANGE24H > 0 ? 'positive' : 'negative'}>
                    {token.RAW.USD.CHANGE24H ? `${token.RAW.USD.CHANGE24H.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="chart-cell">
                    <Line data={chartData(token.CoinInfo.Name)} options={chartOptions} width={80} height={60} />
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
