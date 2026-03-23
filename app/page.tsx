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

interface GameResult { id: string; status: 'WIN' | 'LOSE'; amount: string; }

export default function Home() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('0.01');
  const [gameState, setGameState] = useState<'idle' | 'flipping' | 'result'>('idle');
  const [winStatus, setWinStatus] = useState<'win' | 'lose' | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [createTxKey, setCreateTxKey] = useState(0);

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
  }, [amount, createTxKey]);

  const handleJoinSuccess = async () => {
    const oldBalance = usdcBalance?.value || BigInt(0);
    setGameState('flipping');
    
    // Эпичная анимация 6 секунд
    setTimeout(async () => {
      const { data: newB } = await refetchUSDC();
      const currentBalance = newB?.value || BigInt(0);
      const isWin = currentBalance > oldBalance;
      
      setWinStatus(isWin ? 'win' : 'lose');
      setGameState('result');

      // Добавляем в историю
      const newResult: GameResult = {
        id: Math.random().toString(36).substr(2, 9),
        status: isWin ? 'WIN' : 'LOSE',
        amount: amount
      };
      setHistory(prev => [newResult, ...prev].slice(0, 5));
      refreshLobby();
    }, 6000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coinRotate { 0% { transform: rotateY(0); } 100% { transform: rotateY(3600deg); } }
        .flip-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.98); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); padding: 20px; }
        .coin-spin { width: 160px; height: 160px; border-radius: 50%; }
        .flipping-active { animation: coinRotate 6s cubic-bezier(0.1, 0, 0.1, 1) forwards; }
        .win-glow { box-shadow: 0 0 60px #10b981; border: 5px solid #10b981; }
        .lose-glow { filter: grayscale(1) opacity(0.3); border: 5px solid #ef4444; }
        
        .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; }
        .balance-bold { font-size: 14px; font-weight: 800; color: #3b82f6; margin-top: 2px; }
      `}} />

      {/* OVERLAY РЕЗУЛЬТАТА */}
      {gameState !== 'idle' && (
        <div className="flip-overlay">
          <img 
            src="/coin.png" 
            className={`coin-spin ${gameState === 'flipping' ? 'flipping-active' : ''} ${winStatus === 'win' ? 'win-glow' : winStatus === 'lose' ? 'lose-glow' : ''}`} 
            onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }} 
          />
          <h2 style={{ marginTop: '40px', fontSize: '2.5rem', fontWeight: '900', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>
            {gameState === 'flipping' ? 'BETTING...' : winStatus === 'win' ? 'YOU WON!' : 'YOU LOST'}
          </h2>
          {gameState === 'result' && (
            <button onClick={() => setGameState('idle')} style={{ marginTop: '30px', background: '#3b82f6', color: 'white', border: 'none', padding: '15px 50px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>BACK TO LOBBY</button>
          )}
        </div>
      )}

      {/* ШАПКА */}
      <nav className="header">
        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#3b82f6' }}>TokenFlip</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
          {isConnected && (
            <div className="balance-bold">
              {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'} USDC
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '420px', margin: '20px auto', padding: '0 20px' }}>
        
        {isConnected ? (
          <>
            {/* СОЗДАНИЕ */}
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '20px' }}>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '2.8rem', textAlign: 'center', fontWeight: '900', outline: 'none' }} />
              <div style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 'bold' }}>USDC BET</div>
              <Transaction key={createTxKey} chainId={8453} calls={createCalls as any} onSuccess={() => { refreshLobby(); setTimeout(() => setCreateTxKey(p => p + 1), 2000); }}>
                <TransactionButton text="CREATE DUEL" className="bg-blue-600 w-full rounded-xl py-4 font-black" />
                <div style={{ fontSize: '10px', marginTop: '8px' }}><TransactionStatus><TransactionStatusLabel /></TransactionStatus></div>
              </Transaction>
            </div>

            {/* ЛОББИ */}
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '15px', textAlign: 'center', fontWeight: '800' }}>ACTIVE DUELS</h3>
              {activeIds.length > 0 ? (
                [...activeIds].reverse().map((id, index) => {
                  const i = activeIds.length - 1 - index;
                  const duelAmt = activeAmounts[i];
                  return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#1e293b', borderRadius: '16px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{formatUnits(duelAmt, 6)} <span style={{fontSize: '0.7rem', opacity: 0.5}}>USDC</span></div>
                      <Transaction 
                        chainId={8453} 
                        calls={[{ to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, duelAmt] }) }, { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }] as any} 
                        onSuccess={handleJoinSuccess}
                      >
                        <TransactionButton text="JOIN" className="bg-green-600 !py-2 !px-5 !text-xs !font-black" />
                      </Transaction>
                    </div>
                  );
                })
              ) : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '10px' }}>No rooms. Start one!</div>}
            </div>

            {/* ТАБЛИЦА ИСТОРИИ */}
            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '24px', border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '15px', fontWeight: '800' }}>YOUR RECENT RESULTS</h3>
              {history.length > 0 ? history.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ fontWeight: 'bold', color: item.status === 'WIN' ? '#10b981' : '#ef4444' }}>{item.status}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.amount} USDC</span>
                </div>
              )) : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>Play a game to see results</div>}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2 style={{ color: '#3b82f6', fontWeight: '900', fontSize: '2rem' }}>TokenFlip</h2>
            <p style={{ color: '#94a3b8' }}>Connect wallet to duel</p>
          </div>
        )}
      </div>
    </main>
  );
}
