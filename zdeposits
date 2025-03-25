To instruct your AI to implement the Hyperliquid deposit monitoring dashboard, follow these steps in order:

1. **Install Dependencies First**:
   - Have your AI install the necessary packages:
   ```
   npm install web3 axios recharts lucide-react
   ```

2. **Create the Data Service**:
   - Have your AI implement the `hyperliquidService.js` file first
   - The most important part is correctly configuring the blockchain endpoints and deposit addresses
   - Tell your AI to replace placeholder addresses with actual Hyperliquid deposit addresses

3. **API Key Setup**:
   - Instruct your AI to help you get API keys from:
     - Infura or Alchemy for Ethereum node access
     - Etherscan, Arbiscan, etc. for transaction history

4. **Implement the Dashboard Component**:
   - After the data service is working, have your AI implement the React dashboard component
   - Make sure it correctly imports and uses the hyperliquidService

5. **Testing**:
   - Have your AI create a simple test to verify data is being fetched correctly
   - Start with just monitoring one chain (like Arbitrum) before expanding

6. **Deployment**:
   - Ask your AI to help set up proper environment variables for API keys
   - Get instructions for deploying to Vercel, Netlify, or your preferred hosting platform

The most critical part is correctly identifying the actual Hyperliquid deposit addresses for each network. You'll want to instruct your AI to research the current official Hyperliquid bridge/deposit contracts rather than using placeholders.

Would you like me to provide specific instructions for your AI for any of these steps in particular?



HYPERLIQUID DEPOSIT MONITORING SERVICE; 

// src/services/hyperliquidService.js

import Web3 from 'web3';
import axios from 'axios';

// Configuration - replace with your actual values
const CONFIG = {
  // Ethereum node endpoints
  ETHEREUM_RPC: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  ARBITRUM_RPC: 'https://arb1.arbitrum.io/rpc',
  OPTIMISM_RPC: 'https://mainnet.optimism.io',
  
  // Etherscan API keys
  ETHERSCAN_API_KEY: 'YOUR_ETHERSCAN_API_KEY',
  ARBISCAN_API_KEY: 'YOUR_ARBISCAN_API_KEY',
  
  // Hyperliquid deposit addresses/contracts - these are examples, replace with actual addresses
  HYPERLIQUID_DEPOSIT_ADDRESSES: {
    ETHEREUM: '0x1111111111111111111111111111111111111111',
    ARBITRUM: '0x2222222222222222222222222222222222222222',
    OPTIMISM: '0x3333333333333333333333333333333333333333'
  },
  
  // USDC/USDT token addresses
  TOKEN_ADDRESSES: {
    ETHEREUM: {
      USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    },
    ARBITRUM: {
      USDC: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
      USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
    },
    OPTIMISM: {
      USDC: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      USDT: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58'
    }
  },
  
  // Time intervals in milliseconds
  POLLING_INTERVAL: 30000, // 30 seconds
  LARGE_DEPOSIT_THRESHOLD: 1000000, // $1M in USD
  
  // Decimal places for different tokens
  TOKEN_DECIMALS: {
    USDC: 6,
    USDT: 6
  }
};

// Initialize Web3 instances for different networks
const initializeWeb3Providers = () => {
  return {
    ETHEREUM: new Web3(CONFIG.ETHEREUM_RPC),
    ARBITRUM: new Web3(CONFIG.ARBITRUM_RPC),
    OPTIMISM: new Web3(CONFIG.OPTIMISM_RPC)
  };
};

// ERC20 ABI (minimal for transfer events)
const ERC20_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  }
];

// Service class to handle blockchain data fetching
class HyperliquidDataService {
  constructor() {
    this.web3Providers = initializeWeb3Providers();
    this.cachedDeposits = []; // Store fetched deposits
    this.lastFetchTimestamp = {}; // Track last fetch time per network
    this.depositListeners = []; // For real-time updates
  }
  
  // Main method to fetch large deposits across all networks
  async fetchLargeDeposits(threshold = CONFIG.LARGE_DEPOSIT_THRESHOLD) {
    const allDeposits = [];
    
    // Fetch from all networks in parallel
    const networks = Object.keys(CONFIG.HYPERLIQUID_DEPOSIT_ADDRESSES);
    const fetchPromises = networks.map(network => 
      this.fetchDepositsFromNetwork(network, threshold)
    );
    
    const results = await Promise.all(fetchPromises);
    
    // Combine results
    results.forEach(deposits => {
      allDeposits.push(...deposits);
    });
    
    // Sort by timestamp (newest first) and update cache
    allDeposits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    this.cachedDeposits = allDeposits;
    
    // Notify listeners
    this._notifyListeners(allDeposits);
    
    return allDeposits;
  }
  
  // Fetch deposits from a specific network
  async fetchDepositsFromNetwork(network, threshold) {
    const deposits = [];
    const depositAddress = CONFIG.HYPERLIQUID_DEPOSIT_ADDRESSES[network];
    
    try {
      // Get transactions sent to the deposit address
      const transactions = await this._fetchAddressTransactions(network, depositAddress);
      
      // Process transaction data
      for (const tx of transactions) {
        // Check if this is a token transfer to the deposit address
        if (this._isTokenTransfer(tx, depositAddress)) {
          const tokenInfo = await this._getTokenInfo(network, tx);
          
          if (tokenInfo) {
            const { symbol, amount, amountUsd } = tokenInfo;
            
            // Filter by threshold
            if (amountUsd >= threshold) {
              deposits.push({
                id: tx.hash,
                address: tx.from,
                amount: amountUsd,
                token: symbol,
                timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
                source: network,
                rawTransaction: tx
              });
            }
          }
        }
      }
      
      // Update last fetch timestamp
      this.lastFetchTimestamp[network] = Date.now();
      
      return deposits;
    } catch (error) {
      console.error(`Error fetching deposits from ${network}:`, error);
      return [];
    }
  }
  
  // Subscribe to real-time deposit updates
  subscribeToDeposits(callback) {
    this.depositListeners.push(callback);
    return () => {
      this.depositListeners = this.depositListeners.filter(cb => cb !== callback);
    };
  }
  
  // Start polling for new deposits
  startPolling(interval = CONFIG.POLLING_INTERVAL, threshold = CONFIG.LARGE_DEPOSIT_THRESHOLD) {
    // Clear any existing interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Initial fetch
    this.fetchLargeDeposits(threshold);
    
    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.fetchLargeDeposits(threshold);
    }, interval);
    
    return () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    };
  }
  
  // Get historical deposit volume for chart
  async getHistoricalVolume(days = 14) {
    // If we have enough cached data, use it
    if (this.cachedDeposits.length > 0) {
      return this._calculateHistoricalVolume(this.cachedDeposits, days);
    }
    
    // Otherwise, fetch historical data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      // Fetch historical deposits across all networks
      const allDeposits = await this.fetchLargeDeposits(0); // Fetch all deposits, no threshold
      return this._calculateHistoricalVolume(allDeposits, days);
    } catch (error) {
      console.error("Error fetching historical volume:", error);
      return [];
    }
  }
  
  // Calculate 24h deposit volume
  get24hVolume() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return this.cachedDeposits
      .filter(deposit => new Date(deposit.timestamp) >= oneDayAgo)
      .reduce((sum, deposit) => sum + deposit.amount, 0);
  }
  
  // Get large deposit count
  getLargeDepositsCount(threshold = CONFIG.LARGE_DEPOSIT_THRESHOLD) {
    return this.cachedDeposits
      .filter(deposit => deposit.amount >= threshold)
      .length;
  }
  
  // Get deposit source breakdown (percentages)
  getDepositSourceBreakdown() {
    if (this.cachedDeposits.length === 0) return [];
    
    // Count deposits by source
    const sourceCount = {};
    let total = 0;
    
    this.cachedDeposits.forEach(deposit => {
      sourceCount[deposit.source] = (sourceCount[deposit.source] || 0) + deposit.amount;
      total += deposit.amount;
    });
    
    // Convert to percentages
    const result = Object.entries(sourceCount).map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100)
    }));
    
    // Sort by percentage (descending)
    result.sort((a, b) => b.value - a.value);
    
    // Add "Other" category if needed
    const threshold = 2; // Minimum percentage to not be in "Other"
    const mainSources = result.filter(item => item.value >= threshold);
    const otherSources = result.filter(item => item.value < threshold);
    
    if (otherSources.length > 0) {
      const otherValue = otherSources.reduce((sum, item) => sum + item.value, 0);
      return [...mainSources, { name: 'Other', value: otherValue }];
    }
    
    return mainSources;
  }
  
  // Private methods
  
  // Fetch transactions for an address using Etherscan-like APIs
  async _fetchAddressTransactions(network, address) {
    let apiUrl, apiKey;
    
    switch (network) {
      case 'ETHEREUM':
        apiUrl = 'https://api.etherscan.io/api';
        apiKey = CONFIG.ETHERSCAN_API_KEY;
        break;
      case 'ARBITRUM':
        apiUrl = 'https://api.arbiscan.io/api';
        apiKey = CONFIG.ARBISCAN_API_KEY;
        break;
      case 'OPTIMISM':
        apiUrl = 'https://api-optimistic.etherscan.io/api';
        apiKey = CONFIG.ETHERSCAN_API_KEY; // May need separate key
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
    
    // Get the last fetch timestamp for this network, or use a default (24h ago)
    const lastTimestamp = this.lastFetchTimestamp[network] || (Date.now() - 86400000);
    const startTime = Math.floor(lastTimestamp / 1000);
    
    try {
      // Fetch ERC20 token transfer events
      const response = await axios.get(apiUrl, {
        params: {
          module: 'account',
          action: 'tokentx',
          address: address,
          startblock: 0,
          endblock: 999999999,
          sort: 'desc',
          apikey: apiKey
        }
      });
      
      if (response.data.status === '1') {
        return response.data.result;
      } else {
        console.error(`API error for ${network}:`, response.data.message);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching transactions for ${network}:`, error);
      return [];
    }
  }
  
  // Check if transaction is a token transfer to our target address
  _isTokenTransfer(tx, depositAddress) {
    return tx.to.toLowerCase() === depositAddress.toLowerCase();
  }
  
  // Get token info (symbol, amount, USD value)
  async _getTokenInfo(network, tx) {
    const tokenAddress = tx.contractAddress.toLowerCase();
    const networkTokens = CONFIG.TOKEN_ADDRESSES[network];
    
    // Check if this is a supported token (USDC/USDT)
    let symbol = null;
    for (const [tokenSymbol, address] of Object.entries(networkTokens)) {
      if (tokenAddress.toLowerCase() === address.toLowerCase()) {
        symbol = tokenSymbol;
        break;
      }
    }
    
    if (!symbol) return null; // Unsupported token
    
    // Calculate actual token amount based on decimals
    const decimals = CONFIG.TOKEN_DECIMALS[symbol] || 18;
    const amount = parseInt(tx.value) / Math.pow(10, decimals);
    
    // For stablecoins like USDC/USDT, amount = USD value
    const amountUsd = amount;
    
    return { symbol, amount, amountUsd };
  }
  
  // Calculate historical volume from deposits
  _calculateHistoricalVolume(deposits, days) {
    const result = [];
    const now = new Date();
    
    // Initialize data for each day
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      result.push({
        date: date.toISOString().split('T')[0],
        volume: 0
      });
    }
    
    // Add deposit volumes to appropriate day
    deposits.forEach(deposit => {
      const depositDate = new Date(deposit.timestamp);
      depositDate.setHours(0, 0, 0, 0);
      
      const dateString = depositDate.toISOString().split('T')[0];
      const dayData = result.find(day => day.date === dateString);
      
      if (dayData) {
        dayData.volume += deposit.amount;
      }
    });
    
    return result;
  }
  
  // Notify listeners of new data
  _notifyListeners(deposits) {
    this.depositListeners.forEach(callback => {
      try {
        callback(deposits);
      } catch (error) {
        console.error("Error in deposit listener:", error);
      }
    });
  }
}

// Export singleton instance
const hyperliquidService = new HyperliquidDataService();
export default hyperliquidService;




CONNECTING DASHBOARD TO REAL DATA

// src/components/HyperliquidMonitor.jsx

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Clock, AlertTriangle, TrendingUp, Repeat, DollarSign, Users } from 'lucide-react';
import hyperliquidService from '../services/hyperliquidService';

// Dashboard component
const HyperliquidMonitor = () => {
  const [deposits, setDeposits] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [threshold, setThreshold] = useState(1000000);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVolume24h, setTotalVolume24h] = useState(0);
  const [largeDepositsCount, setLargeDepositsCount] = useState(0);
  
  // Initialize and start data service
  useEffect(() => {
    setIsLoading(true);
    
    // Set up data subscription
    const unsubscribe = hyperliquidService.subscribeToDeposits(newDeposits => {
      setDeposits(newDeposits);
      setTotalVolume24h(hyperliquidService.get24hVolume());
      setLargeDepositsCount(hyperliquidService.getLargeDepositsCount(threshold));
      setIsLoading(false);
      
      // Show notification for new large deposits if alerts are enabled
      if (alertsEnabled) {
        const newLargeDeposits = newDeposits
          .filter(deposit => deposit.amount >= threshold)
          .filter(deposit => {
            // Check if this is a new deposit within the last minute
            const depositTime = new Date(deposit.timestamp);
            const oneMinuteAgo = new Date(Date.now() - 60000);
            return depositTime >= oneMinuteAgo;
          });
          
        newLargeDeposits.forEach(deposit => {
          showNotification(deposit);
        });
      }
    });
    
    // Start polling for data
    const stopPolling = hyperliquidService.startPolling(30000, threshold);
    
    // Load historical data
    loadHistoricalData();
    
    // Cleanup when component unmounts
    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [threshold, alertsEnabled]);
  
  // Load historical volume data
  const loadHistoricalData = async () => {
    try {
      const data = await hyperliquidService.getHistoricalVolume(14);
      setHistoricalData(data);
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  };
  
  // Show browser notification for new deposits
  const showNotification = (deposit) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification("Hyperliquid Large Deposit", {
        body: `${formatNumber(deposit.amount)} ${deposit.token} from ${truncateAddress(deposit.address)}`,
        icon: "/favicon.ico"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };
  
  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    
    return Math.floor(seconds) + "s ago";
  };
  
  // Format large numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  // Get truncated address
  const truncateAddress = (address) => {
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };
  
  // Handle threshold change
  const handleThresholdChange = (e) => {
    const newThreshold = Number(e.target.value);
    setThreshold(newThreshold);
    
    // Update counts with new threshold
    setLargeDepositsCount(hyperliquidService.getLargeDepositsCount(newThreshold));
  };
  
  // Toggle alerts
  const toggleAlerts = () => {
    // Request notification permission if enabling alerts
    if (!alertsEnabled && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    
    setAlertsEnabled(!alertsEnabled);
  };

  // Get deposit sources data
  const getDepositSources = () => {
    const sources = hyperliquidService.getDepositSourceBreakdown();
    return sources.length > 0 ? sources : [
      { name: 'Arbitrum', value: 0 },
      { name: 'Ethereum', value: 0 },
      { name: 'Optimism', value: 0 }
    ];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Hyperliquid Large Deposit Monitor</h1>
          <div className="flex items-center space-x-4">
            <button 
              className={`px-4 py-2 rounded-md flex items-center ${alertsEnabled ? 'bg-red-500' : 'bg-gray-600'}`}
              onClick={toggleAlerts}
            >
              <AlertTriangle size={16} className="mr-2" />
              {alertsEnabled ? 'Alerts On' : 'Alerts Off'}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Threshold:</span>
              <select 
                value={threshold} 
                onChange={handleThresholdChange}
                className="bg-gray-700 text-white px-2 py-1 rounded"
              >
                <option value={100000}>$100K</option>
                <option value={500000}>$500K</option>
                <option value={1000000}>$1M</option>
                <option value={5000000}>$5M</option>
                <option value={10000000}>$10M</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4 overflow-auto">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <Repeat size={24} className="text-blue-500 animate-spin" />
              <span className="text-lg font-medium">Loading data...</span>
            </div>
          </div>
        )}
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign size={24} className="text-blue-500 mr-2" />
              <div>
                <h3 className="text-gray-500 text-sm">24h Volume</h3>
                <p className="text-2xl font-bold">${formatNumber(totalVolume24h)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp size={24} className="text-green-500 mr-2" />
              <div>
                <h3 className="text-gray-500 text-sm">Large Deposits</h3>
                <p className="text-2xl font-bold">{largeDepositsCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock size={24} className="text-purple-500 mr-2" />
              <div>
                <h3 className="text-gray-500 text-sm">Last Updated</h3>
                <p className="text-lg font-bold">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Historical Deposit Volume</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${formatNumber(value)}`, 'Volume']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                  name="Deposit Volume" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Deposit Sources</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={getDepositSources()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Percentage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Deposits Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Large Deposits</h2>
            <p className="text-sm text-gray-500">Showing deposits above ${formatNumber(threshold)}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits
                  .filter(deposit => deposit.amount >= threshold)
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map(deposit => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 font-medium">
                        <a 
                          href={`https://${deposit.source.toLowerCase() === 'ethereum' ? '' : deposit.source.toLowerCase() + '.'}etherscan.io/tx/${deposit.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {deposit.id.substring(0, 10)}...
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a 
                          href={`https://${deposit.source.toLowerCase() === 'ethereum' ? '' : deposit.source.toLowerCase() + '.'}etherscan.io/address/${deposit.address}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {truncateAddress(deposit.address)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {deposit.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${formatNumber(deposit.amount)} {deposit.token}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAgo(deposit.timestamp)}
                      </td>
                    </tr>
                  ))}
                
                {deposits.filter(deposit => deposit.amount >= threshold).length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No deposits found above the current threshold
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-3 text-center text-sm">
        <p>Real-time Hyperliquid deposit monitoring dashboard • Data refreshes every 30 seconds</p>
      </footer>
    </div>
  );
};

export default HyperliquidMonitor;

