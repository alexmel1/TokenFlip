'use client';

import { 
  Wallet, 
  ConnectWallet, 
  WalletDropdown, 
  WalletDropdownDisconnect,
  Identity,
  Avatar,
  Name,
  Address 
} from '@coinbase/onchainkit/wallet';
import { 
  Transaction, 
  TransactionButton, 
  TransactionStatus, 
  TransactionStatusAction, 
  TransactionStatusLabel 
} from '@coinbase/onchainkit/transaction'; 
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';

export default function Home() {
  const { isConnected } = useAccount();

  // Адреса контрактов
  const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC';
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  // Описание функций (ABI)
  const abi = [{ name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] }] as const;
  const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;
