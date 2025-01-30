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
  const [historicalData, setHistoricalData] = useState({}); // 過去の価格データ

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
        const tokenData = response.data;
        setTokens(tokenData);
        setError(null);
        setLastUpdated(new Date().toLocaleString());

        // 過去の価格データを取得
        tokenData.forEach(token => {
          fetchHistoricalPrice(token.id);
        });

        if (!intervalId) {
          intervalId = setInterval(fetchTokenPrices, 10000);
        }
      } catch (error) {
        console.error("Error fetching token prices:", error);
        setError("データを取得できませんでした。一定時間が経過すると自動的に表示されます。\nしばらくお待ちください。");
        clearInterval(intervalId);
        setTimeout(fetchTokenPrices, 60000);
      }
    };

    const fetchHistoricalPrice = async (tokenId) => {
      try {
        const historyResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
          params: {
            vs_currency: 'jpy',
            days: '7', // 7日間のデータ
            interval: 'daily'
          }
        });
        const priceData = historyResponse.data.prices.map(price => ({
          time: new Date(price[0]),
          price: price[1]
        }));
        setHistoricalData(prevData => ({
          ...prevData,
          [tokenId]: priceData
        }));
      } catch (error) {
        console.error(`Failed to fetch historical data for ${tokenId}`, error);
      }
    };

    fetchTokenPrices();

    return () => clearInterval(intervalId);
  }, []);

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
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        display: false // X軸を非表示
      },
      y: {
        display: false // Y軸を非表示
      }
    },
    plugins: {
      legend: {
        display: false // 凡例を非表示
      }
    }
  };


  return (
    <div className="App">
      <h1>トークン価格チャート</h1>

      {lastUpdated && (
        <div className="last-updated">
          最終更新: {lastUpdated}
        </div>
      )}

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
              <th>過去7日間の価格チャート</th>
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
                <td className="chart-cell">
                  <Line data={chartData(token.id)} options={chartOptions} width={80} height={60} />
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
