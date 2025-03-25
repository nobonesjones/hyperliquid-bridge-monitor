import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import axios from 'axios';

// Configuration
export const CONFIG = {
  // Network configurations
  ARBITRUM: {
    RPC: 'https://arb1.arbitrum.io/rpc',
    USDC_CONTRACT: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    DEPOSIT_ADDRESS: '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7',
    WITHDRAWAL_ADDRESS: '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7', // Same as deposit for now
    EXPLORER_API: 'https://api.arbiscan.io/api',
    EXPLORER_KEY: process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || '',
    EXPLORER_URL: 'https://arbiscan.io',
    LOOKBACK_HOURS: 1
  },
  ETHEREUM: {
    RPC: 'https://eth.llamarpc.com',
    USDC_CONTRACT: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    DEPOSIT_ADDRESS: '0x86f6c353A0965eB069cD7f4f91C1aFEf8C725551', // Hyperliquid Ethereum deposit address
    WITHDRAWAL_ADDRESS: '0x86f6c353A0965eB069cD7f4f91C1aFEf8C725551', // Same as deposit for now
    EXPLORER_API: 'https://api.etherscan.io/api',
    EXPLORER_KEY: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '',
    EXPLORER_URL: 'https://etherscan.io',
    LOOKBACK_HOURS: 24 // Look back 24 hours for Ethereum
  },
  
  // Time intervals
  POLLING_INTERVAL: 30000, // 30 seconds
  LARGE_AMOUNT_THRESHOLD: 50000, // $50K USD
  
  // Token decimals
  TOKEN_DECIMALS: {
    USDC: 6,
  }
};

interface TransferEvent {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
}

interface Transfer {
  network: string;
  type: 'deposit' | 'withdrawal';
  token: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
}

class BlockchainMonitor {
  private lastTimestamp: { [key: string]: number };
  private transfers: Transfer[];

  constructor() {
    this.lastTimestamp = {};
    this.transfers = [];
  }

  // Initialize monitoring
  async initialize() {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      // Start from current time minus configured hours
      this.lastTimestamp = {
        ARBITRUM: currentTime - (CONFIG.ARBITRUM.LOOKBACK_HOURS * 3600),
        ETHEREUM: currentTime - (CONFIG.ETHEREUM.LOOKBACK_HOURS * 3600)
      };

      console.log('BlockchainMonitor initialized:', this.lastTimestamp);
      return true;
    } catch (error) {
      console.error('Failed to initialize BlockchainMonitor:', error);
      return false;
    }
  }

  // Main monitoring function
  async checkForTransfers() {
    try {
      const [arbitrumTransfers, ethereumTransfers] = await Promise.all([
        this.checkNetworkTransfers('ARBITRUM'),
        this.checkNetworkTransfers('ETHEREUM')
      ]);

      if (arbitrumTransfers.length > 0) {
        // Add new transfers and keep last 100
        this.transfers = [...arbitrumTransfers, ...this.transfers].slice(0, 100);
      }
      if (ethereumTransfers.length > 0) {
        // Add new transfers and keep last 100
        this.transfers = [...ethereumTransfers, ...this.transfers].slice(0, 100);
      }

      return this.transfers;
    } catch (error) {
      console.error('Error checking transfers:', error);
      return this.transfers;
    }
  }

  // Check transfers for a specific network
  private async checkNetworkTransfers(network: 'ARBITRUM' | 'ETHEREUM') {
    const newTransfers: Transfer[] = [];
    const config = CONFIG[network];

    try {
      // Get token transfers to and from the addresses
      const response = await axios.get(config.EXPLORER_API, {
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: config.USDC_CONTRACT,
          address: config.DEPOSIT_ADDRESS, // This will catch both incoming and outgoing
          starttime: this.lastTimestamp[network],
          endtime: Math.floor(Date.now() / 1000),
          sort: 'desc',
          apikey: config.EXPLORER_KEY
        }
      });

      if (response.data.status === '1' && Array.isArray(response.data.result)) {
        const transfers = response.data.result as TransferEvent[];
        
        // Process transfers
        for (const transfer of transfers) {
          const amount = Number(transfer.value) / Math.pow(10, CONFIG.TOKEN_DECIMALS.USDC);
          
          // Only process transfers ≥ threshold
          if (amount >= CONFIG.LARGE_AMOUNT_THRESHOLD) {
            const isDeposit = transfer.to.toLowerCase() === config.DEPOSIT_ADDRESS.toLowerCase();
            
            newTransfers.push({
              network,
              type: isDeposit ? 'deposit' : 'withdrawal',
              token: 'USDC',
              from: transfer.from,
              to: transfer.to,
              amount,
              timestamp: Number(transfer.timeStamp) * 1000,
              txHash: transfer.hash,
              blockNumber: Number(transfer.blockNumber),
              explorerUrl: config.EXPLORER_URL
            });
          }
        }

        // Update last checked timestamp
        if (transfers.length > 0) {
          this.lastTimestamp[network] = Number(transfers[0].timeStamp);
        }
      }

      return newTransfers;
    } catch (error) {
      console.error(`Error checking ${network} transfers:`, error);
      return [];
    }
  }

  // Get all transfers
  getTransfers() {
    return this.transfers;
  }
}

// Export singleton instance
export const blockchainMonitor = new BlockchainMonitor();
