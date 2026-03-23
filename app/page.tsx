'use client';

import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';

// ЗАМЕНИ НА СВОЙ АДРЕС ИЗ BASESCAN ИЛИ REMIX
const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC'; 
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const abi = [{ name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] }];
const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }];

export default function Home() {
  const { isConnected } = useAccount();
  const betAmount = parseUnits('10', 6); // 10 USDC

  const calls = [
    { address: USDC_ADDRESS, abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, betAmount] },
    { address: CONTRACT_ADDRESS, abi: abi, functionName: 'createGame', args: [betAmount] }
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', fontFamily: 'sans-serif' }}>
      
      {/* Шапка с кошельком */}
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

      <h1 style={{ fontSize: '4rem', color: '#3b82f6', marginBottom: '10px', fontWeight: 'bold' }}>TokenFlip</h1>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '40px' }}>1vs1 USDC Duel on Base</p>

      {isConnected ? (
        <div style={{ 
          width: '100%', 
          maxWidth: '400px', 
          padding: '40px', 
          background: 'rgba(15, 23, 42, 0.8)', 
          borderRadius: '32px', 
          border: '1px solid #1e293b',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Create 10 USDC Room</h2>
          
          <Transaction chainId={8453} calls={calls}>
            <TransactionButton text="Start Duel" className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold" />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>

          <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#64748b' }}>
            Winner takes it all (20 USDC)! <br/>
            One-click Approve + Play.
          </p>
        </div>
      ) : (
        <div style={{ padding: '30px', border: '1px dashed #3b82f6', borderRadius: '20px', color: '#60a5fa' }}>
          Please connect your wallet to start playing
        </div>
      )}
    </main>
  );
}
