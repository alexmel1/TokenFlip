'use client';

import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';

// 1. АДРЕС ТВОЕГО КОНТРАКТА (вставь сюда то, что получил в Remix)
const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC';
// Адрес USDC на Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// 2. ABI (мини-версия для функций которые нам нужны)
const abi = [
  {
    name: 'createGame',
    type: 'function',
    stateMutability: 'external',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
];

const usdcAbi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'external',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

export default function Home() {
  const { isConnected, address } = useAccount();

  // Сумма ставки (10 USDC с учетом 6 знаков после запятой)
  const betAmount = parseUnits('10', 6);

  // Список действий для транзакции: сначала Approve, потом CreateGame
  const calls = [
    {
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, betAmount],
    },
    {
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'createGame',
      args: [betAmount],
    },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: '#020617' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Wallet>
          <ConnectWallet />
        </Wallet>
      </div>

      <h1 style={{ fontSize: '3rem', color: '#3b82f6', marginTop: '50px' }}>TokenFlip</h1>
      
      {isConnected ? (
        <div style={{ marginTop: '40px', padding: '30px', background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '20px' }}>Create 10 USDC Room</h2>
          
          <Transaction 
            chainId={8453} // ID сети Base
            calls={calls}
            onSuccess={(response) => console.log('Success!', response)}
          >
            <TransactionButton text="Start Duel" className="w-full bg-blue-600 hover:bg-blue-700" />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '15px' }}>
            This will approve 10 USDC and create a room in one click.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '50px', textAlign: 'center' }}>
          <p>Please connect your wallet to start flipping</p>
        </div>
      )}
    </main>
  );
}
