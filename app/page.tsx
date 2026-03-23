'use client';

import { useState, useMemo } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction'; 
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
  const [gameState, setGameState] = useState<'idle' | 'flipping' | 'result'>('idle');
  const [winStatus, setWinStatus] = useState<'win' | 'lose' | null>(null);

  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance, refetch: refetchUSDC } = useBalance({ address, token: USDC_ADDRESS });
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
  }, [amount]);

  const handleJoinSuccess = async () => {
    const oldBalance = usdcBalance?.value || BigInt(0);
    setGameState('flipping');
    setTimeout(async () => {
      const { data: newB } = await refetchUSDC();
      setWinStatus((newB?.value || 0n) > oldBalance ? 'win' : 'lose');
      setGameState('result');
      refreshLobby();
    }, 6000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coinFlip { 0% { transform: rotateY(0); } 100% { transform: rotateY(1440deg); } }
        .overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.98); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
        .coin-img { width: 150px; height: 150px; border-radius: 50%; transition: all 0.6s; }
        .flipping-anim { animation: coinFlip 5s cubic-bezier(0.15, 0, 0.15, 1) forwards; }
        .win-effect { box-shadow: 0 0 50px #10b981; border: 4px solid #10b981; }
        .lose-effect { filter: grayscale(1) opacity(0.3); }
        
        .nav-container { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 10px; }
        .user-stats { display: flex; align-items: center; gap: 10px; }
        .balance-text { font-size: 0.7rem; text-align: right; line-height: 1.1; }
        
        @media (max-width: 400px) {
          .nav-container { justify-content: center; text-align: center; }
          .balance-text { display: none; } /* Скрываем мелкий текст баланса на очень узких экранах для красоты */
        }
      `}} />

      {/* АНИМАЦИЯ */}
      {gameState !== 'idle' && (
        <div className="overlay">
          <img src="/coin.png" className={`coin-img ${gameState === 'flipping' ? 'flipping-anim' : ''} ${winStatus === 'win' ? 'win-effect' : winStatus === 'lose' ? 'lose-effect' : ''}`} onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }} />
          <h2 style={{ marginTop: '30px', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>{gameState === 'flipping' ? 'FLIPPING...' : winStatus === 'win' ? 'WINNER!' : 'LOST'}</h2>
          {gameState === 'result' && <button onClick={() => setGameState('idle')} style={{ marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '10px' }}>Close</button>}
        </div>
      )}

      {/* ШАПКА */}
      <nav className="nav-container">
        <div style={{ fontWeight: '900', color: '#3b82f6', fontSize: '1.2rem' }}>TokenFlip</div>
        <div className="user-stats">
          <div className="balance-text">
            <div style={{ color: '#94a3b8' }}>{ethBalance?.formatted.slice(0, 5)} ETH</div>
            <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>{usdcBalance?.formatted.slice(0, 5)} USDC</div>
          </div>
          <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
        </div>
      </nav>

      <div style={{ maxWidth: '450px', margin: '30px auto', padding: '0 15px' }}>
        
        {/* СОЗДАНИЕ */}
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '5px' }}>BET AMOUNT</div>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', textAlign: 'center', fontWeight: 'bold', outline: 'none' }} />
          <div style={{ marginBottom: '15px' }}>
            <Transaction chainId={8453} calls={createCalls as any} onSuccess={() => refreshLobby()}>
              <TransactionButton text="CREATE DUEL" className="bg-blue-600 w-full rounded-xl py-3 font-bold" />
              <div style={{ fontSize: '10px', marginTop: '5px' }}><TransactionStatus><TransactionStatusLabel /></TransactionStatus></div>
            </Transaction>
          </div>
        </div>

        {/* ЛОББИ */}
        <div style={{ background: '#0f172a', padding: '15px', borderRadius: '20px', border: '1px solid #1e293b', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '15px' }}>ACTIVE DUELS</h3>
          {activeIds.length > 0 ? (
            [...activeIds].reverse().map((id, index) => {
              const i = activeIds.length - 1 - index;
              return (
                <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1e293b', borderRadius: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatUnits(activeAmounts[i], 6)}</span> USDC
                  </div>
                  <Transaction chainId={8453} calls={[{ to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, activeAmounts[i]] }) }, { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi, functionName: 'joinGame', args: [id] }) }] as any} onSuccess={handleJoinSuccess}>
                    <TransactionButton text="JOIN" className="bg-green-600 !py-1 !px-4 !text-xs !min-w-0" />
                  </Transaction>
                </div>
              );
            })
          ) : <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>No rooms</div>}
        </div>

        {/* ИСТОРИЯ (УПРОЩЕННАЯ) */}
        <div style={{ background: '#0f172a', padding: '15px', borderRadius: '20px', border: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>LATEST ACTIVITY</h3>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
            <a href={`https://basescan.org/address/${CONTRACT_ADDRESS}`} target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>View all transactions on Basescan ↗</a>
          </div>
        </div>

      </div>
    </main>
  );
}
