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

  const [lastApi, setLastApi] = useState(null); // 初期値はnullに設定
  const [nextApi, setNextApi] = useState(null);  // 初期値はnullに設定

  useEffect(() => {
    // 初回レンダリング時にAPIの交互をランダムで設定
    if (lastApi === null && nextApi === null) {
      // ランダムでAPIを設定
      const randomApi = Math.random() > 0.5 ? 'CoinGecko' : 'CoinMarketCap';
      setLastApi(randomApi);
      setNextApi(randomApi === 'CoinGecko' ? 'CoinMarketCap' : 'CoinGecko');
    }

    fetchTokenPrices();

  }, [currentPage]); // currentPageに依存

  const fetchTokenPrices = async () => {
    try {
      let response;

      // 現在使用中のAPIを使用
      if (lastApi === 'CoinGecko') {
        response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: currentPage,
            sparkline: false,
            price_change_percentage: '24h',
          }
        });
      } else { // 次のAPIを使用
        response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
          headers: {
            'X-CMC_PRO_API_KEY': '716180a2-242e-421e-b83d-26e6ea2ca2d8'
          },
          params: {
            start: (currentPage - 1) * tokensPerPage + 1,
            limit: tokensPerPage,
            convert: 'USD',
            sort: 'market_cap',
          }
        });
      }

      const tokenData = response.data;
      setTokens(tokenData);
      setError(null);
      setLastUpdated(new Date().toLocaleString());

      tokenData.forEach(token => {
        fetchHistoricalPrice(token.id);
      });

      // API呼び出し後にAPIの切り替え
      setLastApi(nextApi);
      setNextApi(lastApi);

    } catch (error) {
      console.error("Error fetching token prices:", error);
      setError("API呼出制限に達したためデータを取得できませんでした。再取得中。しばらくお待ちください。");

      setLastUpdated(new Date().toLocaleString());  // エラーでも最終更新時刻は更新
    }
  };

  const fetchHistoricalPrice = async (tokenId) => {
    try {
      let historyResponse;

      if (lastApi === 'CoinGecko') {
        historyResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: '3',
            interval: 'daily',
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
            convert: 'USD',
          }
        });
      }

      const priceData = historyResponse.data.prices ? historyResponse.data.prices.map(price => ({
        time: new Date(price[0]),
        price: price[1],
      })) : historyResponse.data.data.map(price => ({
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

  const handleApiSwitch = async () => {
    // APIの切り替え
    setLastApi(nextApi);
    setNextApi(lastApi);

    // API呼び出し
    await fetchTokenPrices(); // async関数を非同期に呼び出す
  };

  return (
    <div className="App">
      <h1>トークン価格チャート</h1>

      {/* 右上にAPI切り替えボタン */}
      <div className="api-switch-button">
        <button onClick={handleApiSwitch}>API 切り替え</button>
      </div>

      {/* 左上に表示するAPI情報 */}
      <div className="api-status">
        直前に呼び出したAPI: {lastApi} <br />
        次に呼び出すAPI: {nextApi}
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
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>前のページ</button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage * tokensPerPage >= tokens.length}>次のページ</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
