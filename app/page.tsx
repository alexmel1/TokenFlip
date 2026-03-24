'use client';

import { useState, useMemo, useEffect } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusLabel } from '@coinbase/onchainkit/transaction'; 
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';

const CONTRACT_ADDRESS = '0xAF689F60447FD0f55eF7E74Fc7e08Db98ca5Fb33' as `0x${string}`;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;

const abi = [
  { name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'joinGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_gameId', type: 'uint256' }], outputs: [] },
  { name: 'getOpenGames', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'ids', type: 'uint256[]' }, { name: 'players', type: 'address[]' }, { name: 'amounts', type: 'uint256[]' }] }
] as const;

const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;

export default function Home() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('0.01');
  const [createTxKey, setCreateTxKey] = useState(0);

  const { data: usdcBalance } = useBalance({ address, token: USDC_ADDRESS });
  const { data: lobbyData, refetch: refreshLobby } = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName: 'getOpenGames' });

  const lobby = lobbyData as unknown as [bigint[], `0x${string}`[], bigint[]] | undefined;
  const activeIds = lobby?.[0] || [];
  const activePlayers = lobby?.[1] || [];
  const activeAmounts = lobby?.[2] || [];

  // АВТО-ОБНОВЛЕНИЕ ЛОББИ КАЖДЫЕ 5 СЕКУНД
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLobby();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshLobby]);

  const createCalls = useMemo(() => {
    const bet = parseUnits(amount.replace(',', '.'), 6);
    return [
      { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, bet] }) },
      { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi, functionName: 'createGame', args: [bet] }) }
    ];
  }, [amount, createTxKey]);

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; }
        .balance-hero { font-size: 16px; font-weight: 900; color: #3b82f6; margin-top: 2px; }
        .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 25px; margin-bottom: 20px; }
        .duel-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #1e293b; border-radius: 16px; margin-bottom: 8px; border: 1px solid rgba(59, 130, 246, 0.1); }
      `}} />

      {/* ШАПКА */}
      <nav className="header">
        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#3b82f6' }}>TokenFlip</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
          {isConnected && <div className="balance-hero">{usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'} USDC</div>}
        </div>
      </nav>

      <div style={{ maxWidth: '420px', margin: '20px auto', padding: '0 20px' }}>
        
        {isConnected ? (
          <>
            {/* БЛОК СОЗДАНИЯ */}
            <div className="card" style={{ textAlign: 'center' }}>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '3rem', textAlign: 'center', fontWeight: '900', outline: 'none' }} />
              <div style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 'bold' }}>USDC BET</div>
              
              <Transaction 
                key={createTxKey} 
                chainId={8453} 
                calls={createCalls as any} 
                onSuccess={() => {
                  setTimeout(() => { refreshLobby(); setCreateTxKey(p => p + 1); }, 3000);
                }}
              >
                <TransactionButton text="CREATE ROOM" className="bg-blue-600 w-full rounded-xl py-4 font-black" />
                <div style={{ fontSize: '10px', marginTop: '10px' }}><TransactionStatus><Transacti
