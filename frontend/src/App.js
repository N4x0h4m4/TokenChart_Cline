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
  const [apiUsed, setApiUsed] = useState('CoinGecko'); // 現在使用中のAPIを表示
  const [errorCount, setErrorCount] = useState(0); // エラー回数をカウント

  useEffect(() => {
    let intervalId;

    const fetchTokenPrices = async () => {
      try {
        let response;

        // CoinGecko APIの使用
        if (apiUsed === 'CoinGecko') {
          response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: 10,
              page: currentPage, 
              sparkline: false,
              price_change_percentage: '24h'
            }
          });
        } else { // CoinMarketCap APIの使用
          response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
              'X-CMC_PRO_API_KEY': '716180a2-242e-421e-b83d-26e6ea2ca2d8'
            },
            params: {
              start: (currentPage - 1) * tokensPerPage + 1,
              limit: tokensPerPage,
              convert: 'USD',
              sort: 'market_cap'
            }
          });
        }

        const tokenData = response.data;
        setTokens(tokenData);
        setError(null);
        setErrorCount(0); // エラーがなければカウントをリセット
        setLastUpdated(new Date().toLocaleString());

        tokenData.forEach(token => {
          fetchHistoricalPrice(token.id);
        });

        if (!intervalId) {
          intervalId = setInterval(fetchTokenPrices, 10000);
        }
      } catch (error) {
        console.error("Error fetching token prices:", error);
        setError("データを取得できませんでした。一定時間が経過すると自動的に表示されます。\nしばらくお待ちください。");

        setErrorCount(prevCount => prevCount + 1); // エラー回数を増加させる

        // エラー回数が3回を超えた場合、APIを切り替える
        if (errorCount >= 3) {
          const newApiUsed = apiUsed === 'CoinGecko' ? 'CoinMarketCap' : 'CoinGecko';
          setApiUsed(newApiUsed);
          setErrorCount(0); // エラー回数リセット
          console.log(`API切り替え: ${newApiUsed}`);
        }

        clearInterval(intervalId);
        setTimeout(fetchTokenPrices, 60000); // 1分後に再度APIを呼び出す
      }
    };

    const fetchHistoricalPrice = async (tokenId) => {
      try {
        let historyResponse;

        if (apiUsed === 'CoinGecko') {
          historyResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
            params: {
              vs_currency: 'usd',
              days: '3',
              interval: 'daily'
            }
          });
        } else {
          historyResponse = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical`, {
            headers: {
              'X-CMC_PRO_API_KEY': '716180a2-242e-421e-b83d-26e6ea2ca2d8'
            },
            params: {
              symbol: tokenId,
              time_start: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
              time_end: Math.floor(Date.now() / 1000),
              convert: 'USD'
            }
          });
        }

        const priceData = historyResponse.data.prices ? historyResponse.data.prices.map(price => ({
          time: new Date(price[0]),
          price: price[1]
        })) : historyResponse.data.data.map(price => ({
          time: new Date(price.timestamp * 1000),
          price: price.close
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
  }, [currentPage, apiUsed, errorCount]);

  const chartData = (tokenId) => {
    const history = historicalData[tokenId] || [];
    console.log("Token History Data:", history); // データの確認

    return {
      labels: history.map(data => {
        // timeがundefinedでないことを確認
        const date = data.time ? new Date(data.time) : null;
        return date ? date.toLocaleDateString() : 'Invalid Date';
      }),
      datasets: [
        {
          label: '過去3日間の価格',
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
        display: false
      },
      y: {
        display: false
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const displayedTokens = tokens.slice((currentPage - 1) * tokensPerPage, currentPage * tokensPerPage);

  return (
    <div className="App">
      <h1>トークン価格チャート</h1>

      <div className="api-status">
        現在使用中のAPI: {apiUsed}
      </div>

      {lastUpdated && (
        <div className="last-updated">
          最終更新: {lastUpdated}
        </div>
      )}

      <p className="warning">
        CoinGecko API または CoinMarketCap APIを使用しています（無料プラン）。
      </p>

      {error && (
        <div className="error-message">
          {error.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
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
                  <td>{token.current_price ? token.current_price : token.quote.USD.price} USD</td>
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
            <button onClick={() => setCurrentPage(prevPage => Math.max(prevPage - 1, 1))} disabled={currentPage === 1}>前のページ</button>
            <button onClick={() => setCurrentPage(prevPage => prevPage + 1)} disabled={currentPage * tokensPerPage >= tokens.length}>次のページ</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
