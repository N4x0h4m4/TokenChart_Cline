import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tokens, setTokens] = useState([]);

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
      } catch (error) {
        console.error("Error fetching token prices:", error);
      }
    };

    fetchTokenPrices();
    const intervalId = setInterval(fetchTokenPrices, 60000); // Update every minute

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="App">
      <h1>仮想通貨リアルタイム価格比較</h1>
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
    </div>
  );
}

export default App;
