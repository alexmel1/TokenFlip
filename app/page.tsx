'use client';

// 1. Импорты для кошелька
import { 
  Wallet, 
  ConnectWallet, 
  WalletDropdown, 
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet';

// 2. Импорты для профиля (Identity) - ВОТ ЗДЕСЬ БЫЛА ОШИБКА
import { 
  Identity, 
  Avatar, 
  Name, 
  Address 
} from '@coinbase/onchainkit/identity';

// 3. Импорты для транзакций
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

  const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC';
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  const abi = [{ name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] }] as const;
  const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;

  const betAmount = parseUnits('10', 6);

  const calls = [
    {
      to: USDC_ADDRESS as `0x${string}`,
      abi: usdcAbi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS as `0x${string}`, betAmount],
    },
    {
      to: CONTRACT_ADDRESS as `0x${string}`,
      abi: abi,
      functionName: 'createGame',
      args: [betAmount],
    },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', fontFamily: 'sans-serif' }}>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
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

      <h1 style={{ fontSize: '3.5rem', color: '#3b82f6', fontWeight: 'bold' }}>TokenFlip</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>1vs1 USDC Duel on Base</p>

      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '32px', border: '1px solid #1e293b', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Duel for 10 USDC</h2>
          
          <Transaction 
            chainId={8453} 
            calls={calls as any}
          >
            <TransactionButton text="Start Duel" className="w-full bg-blue-600" />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>

          <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#64748b' }}>
            One-click Duel: Approve + Play
          </p>
        </div>
      ) : (
        <p style={{ color: '#60a5fa', fontSize: '1.2rem' }}>Connect your wallet to play</p>
      )}
    </main>
  );
}
