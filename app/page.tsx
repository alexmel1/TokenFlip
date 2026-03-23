'use client';

import { useState, useMemo } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction'; 
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';

const CONTRACT_ADDRESS = '0x97120190283736475f10105364b03996C2795EFC' as `0x${string}`;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;

const abi = [{ name: 'createGame', type: 'function', stateMutability: 'external', inputs: [{ name: '_amount', type: 'uint256' }], outputs: [] }, { name: 'nextGameId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const;
const usdcAbi = [{ name: 'approve', type: 'function', stateMutability: 'external', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;

export default function Home() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('0.1');

  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance } = useBalance({ address, token: USDC_ADDRESS });
  const { data: totalGames } = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName: 'nextGameId' });

  // Формируем вызовы через useMemo для стабильности
  const calls = useMemo(() => {
    if (!amount || isNaN(Number(amount.replace(',', '.')))) return [];

    const betAmountFormatted = parseUnits(amount.replace(',', '.'), 6);

    return [
      {
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: usdcAbi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, betAmountFormatted],
        }),
      },
      {
        to: CONTRACT_ADDRESS,
        data: encodeFunctionData({
          abi: abi,
          functionName: 'createGame',
          args: [betAmountFormatted],
        }),
      },
    ];
  }, [amount]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', fontFamily: 'sans-serif' }}>
      
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" /><Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick><Avatar /><Name /><Address /></Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>

        {isConnected && (
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px' }}>
            <div>ETH: {ethBalance?.formatted.slice(0, 6) || '0.000'}</div>
            <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>USDC: {usdcBalance?.formatted.slice(0, 4) || '0.00'}</div>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '3.5rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '20px' }}>TokenFlip</h1>
      
      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '450px' }}>
          <div style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '32px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Create a Duel</h2>
            
            <div style={{ marginBottom: '25px' }}>
              <input 
                type="text" // Используем text чтобы запятая не ломала ввод
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
                style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#020617', border: '2px solid #3b82f6', color: 'white', fontSize: '1.5rem', textAlign: 'center' }}
              />
            </div>

            {calls.length > 0 && (
              <Transaction chainId={8453} calls={calls}>
                <TransactionButton text={`Duel for ${amount} USDC`} className="bg-blue-600 w-full" />
                <TransactionStatus><TransactionStatusLabel /><TransactionStatusAction /></TransactionStatus>
              </Transaction>
            )}
          </div>

          <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#60a5fa' }}>
              {totalGames != null ? `Games Created: ${totalGames.toString()}` : 'Loading...'}
            </p>
          </div>
        </div>
      ) : (
        <p style={{ marginTop: '100px', color: '#60a5fa' }}>Connect Wallet to Play</p>
      )}
    </main>
  );
}
