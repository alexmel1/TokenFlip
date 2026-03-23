'use client';

import { useState, useMemo } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction'; 
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';

const CONTRACT_ADDRESS = '0xf7d84A56d6fAf43521C017066BD1F1703a43fC2C' as `0x${string}`;
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

  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance } = useBalance({ address, token: USDC_ADDRESS });

  const { data: lobbyData, refetch: refreshLobby } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'getOpenGames',
  });

  const lobby = lobbyData as unknown as [bigint[], `0x${string}`[], bigint[]] | undefined;
  const activeIds = lobby?.[0] || [];
  const activePlayers = lobby?.[1] || [];
  const activeAmounts = lobby?.[2] || [];

  const createCalls = useMemo(() => {
    const bet = parseUnits(amount.replace(',', '.'), 6);
    return [
      { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, bet] }) },
      { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi, functionName: 'createGame', args: [bet] }) }
    ];
  }, [amount]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', fontFamily: 'sans-serif' }}>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', marginRight: '10px' }}>
          <div>ETH: {ethBalance?.formatted.slice(0, 6)}</div>
          <div style={{ color: '#3b82f6' }}>USDC: {usdcBalance?.formatted.slice(0, 4)}</div>
        </div>
        <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
      </div>

      <h1 style={{ fontSize: '3rem', color: '#3b82f6', fontWeight: 'bold', marginTop: '30px' }}>TokenFlip</h1>

      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '500px', marginTop: '30px' }}>
          
          <div style={{ padding: '25px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '30px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>Create Duel</h2>
            <input 
                type="text" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                style={{ width: '80%', padding: '10px', borderRadius: '10px', background: '#020617', border: '1px solid #3b82f6', color: 'white', marginBottom: '15px', textAlign: 'center' }} 
            />
            <Transaction chainId={8453} calls={createCalls as any} onSuccess={() => refreshLobby()}>
              <TransactionButton text={`Flip for ${amount} USDC`} className="bg-blue-600 w-full rounded-xl font-bold" />
              <TransactionStatus><TransactionStatusLabel /><TransactionStatusAction /></TransactionStatus>
            </Transaction>
          </div>

          <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '24px', border: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Active Duels</h2>
            
            {activeIds.length > 0 ? (
              [...activeIds].reverse().map((id, index) => {
                const originalIndex = activeIds.length - 1 - index;
                return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#0f172a', borderRadius: '16px', marginBottom: '10px', border: '1px solid #1e293b' }}>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>{formatUnits(activeAmounts[originalIndex], 6)} USDC</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>by {activePlayers[originalIndex].slice(0, 6)}...</div>
                        </div>
                        
                        {/* Ограничиваем ширину контейнера транзакции, чтобы кнопка была маленькой */}
                        <div style={{ width: '100px' }}>
                          <Transaction 
                              chainId={8453} 
                              calls={[
                                  { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, activeAmounts[originalIndex]] }) },
                                  { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }
                              ] as any}
                              onSuccess={() => refreshLobby()}
                          >
                              <TransactionButton text="Join" className="bg-green-600 !py-2 !px-4 !text-sm !min-w-0" />
                          </Transaction>
                        </div>
                    </div>
                );
              })
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.9rem' }}>No active duels found. Create one above!</p>
            )}
          </div>

        </div>
      ) : (
        <p style={{ marginTop: '100px', color: '#60a5fa' }}>Connect Wallet to Play</p>
      )}
    </main>
  );
}
