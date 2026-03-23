'use client';

import { useState } from 'react';
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
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';

const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC' as `0x${string}`;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;

const abi = [
  { name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'joinGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_gameId', type: 'uint256' }], outputs: [] },
  { name: 'nextGameId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }
] as const;

const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;

export default function Home() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('10'); // Сумма по умолчанию

  // Читаем ID следующей игры, чтобы понимать, сколько всего игр создано
  const { data: totalGames } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'nextGameId',
  });

  // Сумма с учетом 6 знаков USDC
  const betAmountFormatted = parseUnits(amount || '0', 6);

  const createCalls = [
    {
      to: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, betAmountFormatted],
    },
    {
      to: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'createGame',
      args: [betAmountFormatted],
    },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', fontFamily: 'sans-serif' }}>
      
      {/* Wallet Section */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" /><Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick><Avatar /><Name /><Address /></Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <h1 style={{ fontSize: '3rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px' }}>TokenFlip</h1>
      
      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '500px' }}>
          
          {/* Создание игры */}
          <div style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px' }}>Create a Duel</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '10px' }}>Bet Amount (USDC)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#020617', border: '1px solid #3b82f6', color: 'white', fontSize: '1.2rem', textAlign: 'center' }}
              />
            </div>

            <Transaction chainId={8453} calls={createCalls as any}>
              <TransactionButton text={`Duel for ${amount} USDC`} className="bg-blue-600 w-full" />
              <TransactionStatus><TransactionStatusLabel /><TransactionStatusAction /></TransactionStatus>
            </Transaction>
          </div>

          {/* Лобби (Список игр) */}
          <div style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '24px', border: '1px solid #1e293b' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Active Duels</h2>
            {totalGames ? (
              <p style={{ color: '#94a3b8' }}>Total games created: {totalGames.toString()}</p>
            ) : (
              <p style={{ color: '#64748b' }}>No active duels found...</p>
            )}
            
            {/* Тут будет список игр (Mapping) */}
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#60a5fa', textAlign: 'center', border: '1px dashed #1e293b', padding: '20px', borderRadius: '15px' }}>
              Lobby updates coming soon... <br/>
              Check your game on Basescan!
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <p style={{ fontSize: '1.2rem', color: '#60a5fa' }}>Connect your Smart Wallet to Flip tokens</p>
        </div>
      )}
    </main>
  );
}
