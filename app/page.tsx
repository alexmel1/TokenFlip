'use client';

import { useState, useMemo } from 'react';
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
  const [isFlipping, setIsFlipping] = useState(false);
  // Ключ для мгновенного сброса кнопки создания
  const [createTxKey, setCreateTxKey] = useState(0);

  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance } = useBalance({ address, token: USDC_ADDRESS });
  const { data: lobbyData, refetch: refreshLobby } = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName: 'getOpenGames' });

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
  }, [amount, createTxKey]); // Зависимость от ключа

  const handleJoinSuccess = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      refreshLobby();
    }, 6000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coinRotate { 0% { transform: rotateY(0); } 100% { transform: rotateY(1800deg); } }
        .flip-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.95); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
        .coin-spin { width: 150px; height: 150px; border-radius: 50%; animation: coinRotate 5s cubic-bezier(0.4, 0, 0.2, 1) forwards; box-shadow: 0 0 40px rgba(59, 130, 246, 0.4); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; }
        .balance-under { font-size: 11px; color: #3b82f6; font-weight: bold; margin-top: 4px; padding-right: 5px; }
      `}} />

      {isFlipping && (
        <div className="flip-overlay">
          <img src="/coin.png" className="coin-spin" onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }} />
          <h2 style={{ marginTop: '30px' }}>FLIPPING...</h2>
        </div>
      )}

      {/* ШАПКА: Баланс теперь ПОД ENS */}
      <nav className="header">
        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#3b82f6', marginTop: '5px' }}>TokenFlip</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Wallet>
            <ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet>
            <WalletDropdown><WalletDropdownDisconnect /></WalletDropdown>
          </Wallet>
          {isConnected && (
            <div className="balance-under">
              {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'} USDC
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '400px', margin: '20px auto', padding: '0 20px' }}>
        
        {isConnected ? (
          <>
            {/* СОЗДАНИЕ: Кнопка сбрасывается через key */}
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '20px' }}>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', outline: 'none' }} />
              <div style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '20px' }}>USDC BET</div>
              
              <Transaction 
                key={createTxKey}
                chainId={8453} 
                calls={createCalls as any} 
                onSuccess={() => {
                   refreshLobby();
                   // Магия: меняем ключ, и кнопка "View transaction" исчезает, возвращая "Create Room"
                   setTimeout(() => setCreateTxKey(prev => prev + 1), 3000);
                }}
              >
                <TransactionButton text="CREATE ROOM" className="bg-blue-600 w-full rounded-xl py-4 font-bold" />
                <div style={{ fontSize: '10px', marginTop: '5px' }}><TransactionStatus><TransactionStatusLabel /></TransactionStatus></div>
              </Transaction>
            </div>

            {/* ЛОББИ */}
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '15px', textAlign: 'center', letterSpacing: '1px' }}>ACTIVE DUELS</h3>
              {activeIds.length > 0 ? (
                [...activeIds].reverse().map((id, index) => {
                  const i = activeIds.length - 1 - index;
                  const duelAmt = activeAmounts[i];
                  return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1e293b', borderRadius: '16px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatUnits(duelAmt, 6)} <span style={{fontSize: '0.7rem', opacity: 0.5}}>USDC</span></div>
                      <Transaction 
                        chainId={8453} 
                        calls={[
                          { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, duelAmt] }) },
                          { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }
                        ] as any} 
                        onSuccess={handleJoinSuccess}
                      >
                        <TransactionButton text="JOIN" className="bg-green-600 !py-1 !px-4 !text-xs !font-bold" />
                      </Transaction>
                    </div>
                  );
                })
              ) : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>No active duels</div>}
            </div>

            {/* УМНАЯ ССЫЛКА НА ИСТОРИЮ */}
            <a 
              href={`https://basescan.org/token/${USDC_ADDRESS}?a=${address}`} 
              target="_blank" 
              style={{ display: 'block', textAlign: 'center', background: '#1e293b', padding: '15px', borderRadius: '15px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.2)' }}
            >
               VIEW MY WIN/LOSS HISTORY ↗
            </a>
            <p style={{ textAlign: 'center', fontSize: '10px', color: '#64748b', marginTop: '10px' }}>
                Filtered by USDC transfers on Basescan
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <h2 style={{ color: '#3b82f6', fontWeight: '900' }}>TokenFlip</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Connect Wallet to Play</p>
          </div>
        )}
      </div>
    </main>
  );
}
