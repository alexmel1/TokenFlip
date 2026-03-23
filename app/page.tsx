'use client';

import { useState } from 'react';
import { 
  Wallet, 
  ConnectWallet, 
  WalletDropdown, 
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet';
import { 
  Identity, 
  Avatar, 
  Name, 
  Address 
} from '@coinbase/onchainkit/identity';
import { 
  Transaction, 
  TransactionButton, 
  TransactionStatus, 
  TransactionStatusAction, 
  TransactionStatusLabel 
} from '@coinbase/onchainkit/transaction'; 
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';

// ТВОИ ДАННЫЕ
const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC' as `0x${string}`;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;

const abi = [
  { name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] },
  { name: 'nextGameId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }
] as const;

const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;

export default function Home() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('0.1');

  // Читаем сколько игр создано
  const { data: totalGames } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'nextGameId',
  });

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
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar /><Name /><Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <h1 style={{ fontSize: '3rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px' }}>TokenFlip</h1>
      <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Duel for USDC on Base</p>
      
      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '450px' }}>
          
          <div style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Create a Duel</h2>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '10px', fontSize: '0.9rem' }}>Bet Amount (USDC)</label>
              <input 
                type="number" 
                step="0.1"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#020617', border: '2px solid #3b82f6', color: 'white', fontSize: '1.5rem', textAlign: 'center' }}
              />
            </div>

            <Transaction chainId={8453} calls={createCalls as any}>
              <TransactionButton text={`Duel for ${amount} USDC`} className="bg-blue-600 w-full" />
              <TransactionStatus><TransactionStatusLabel /><TransactionStatusAction /></TransactionStatus>
            </Transaction>
          </div>

          <div style={{ padding: '25px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: '#60a5fa', marginBottom: '10px' }}>Global Stats</h3>
            <p style={{ fontSize: '1.2rem' }}>
              {/* ИСПОЛЬЗУЕМ != null ЧТОБЫ ПРОВЕРИТЬ И НА undefined И НА null */}
              {totalGames != null ? `Total Games: ${totalGames.toString()}` : 'Loading...'}
            </p>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <p style={{ fontSize: '1.2rem', color: '#60a5fa' }}>Connect your Wallet to play</p>
        </div>
      )}
    </main>
  );
}
