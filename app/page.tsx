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

interface GameResult { id: string; status: 'WIN' | 'LOSE'; amount: string; time: number; }

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

  // Загрузка истории из памяти браузера
  useEffect(() => {
    const savedHistory = localStorage.getItem('flip_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Сохранение истории
  useEffect(() => {
    if (history.length > 0) localStorage.setItem('flip_history', JSON.stringify(history));
  }, [history]);

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
    
    setTimeout(async () => {
      const { data: newB } = await refetchUSDC();
      const currentBalance = newB?.value || BigInt(0);
      const isWin = currentBalance > oldBalance;
      
      const finalStatus = isWin ? 'win' : 'lose';
      setWinStatus(finalStatus);
      setGameState('result');

      const newResult: GameResult = {
        id: Math.random().toString(36).substr(2, 9),
        status: isWin ? 'WIN' : 'LOSE',
        amount: amount,
        time: Date.now()
      };
      setHistory(prev => [newResult, ...prev].slice(0, 10));
      refreshLobby();
    }, 6000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes verticalFlip { 0% { transform: rotateX(0); } 100% { transform: rotateX(1800deg); } }
        .flip-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.98); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); padding: 20px; }
        .coin-spin { width: 160px; height: 160px; border-radius: 50%; }
        .flipping-active { animation: verticalFlip 6s cubic-bezier(0.1, 0, 0.1, 1) forwards; }
        .win-glow { box-shadow: 0 0 80px #10b981; border: 6px solid #10b981; transform: scale(1.1); }
        .lose-glow { filter: grayscale(1) contrast(1.2); border: 6px solid #ef4444; transform: scale(0.9); }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; }
        .balance-hero { font-size: 16px; font-weight: 900; color: #3b82f6; letter-spacing: -0.5px; }
      `}} />

      {gameState !== 'idle' && (
        <div className="flip-overlay">
          <img src="/coin.png" className={`coin-spin ${gameState === 'flipping' ? 'flipping-active' : ''} ${winStatus === 'win' ? 'win-glow' : winStatus === 'lose' ? 'lose-glow' : ''}`} onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }} />
          <h2 style={{ marginTop: '40px', fontSize: '2.5rem', fontWeight: '900', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>
            {gameState === 'flipping' ? 'FLIPPING...' : winStatus === 'win' ? 'WINNER!' : 'BET LOST'}
          </h2>
          {gameState === 'result' && (
            <button onClick={() => setGameState('idle')} style={{ marginTop: '30px', background: '#3b82f6', color: 'white', border: 'none', padding: '15px 60px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}>OK</button>
          )}
        </div>
      )}

      <nav className="header">
        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#3b82f6' }}>TokenFlip</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
          {isConnected && <div className="balance-hero">{usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'} USDC</div>}
        </div>
      </nav>

      <div style={{ maxWidth: '420px', margin: '20px auto', padding: '0 20px' }}>
        {isConnected ? (
          <>
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '20px' }}>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '3rem', textAlign: 'center', fontWeight: '900', outline: 'none' }} />
              <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '20px' }}>USDC BET</div>
              <Transaction key={createTxKey} chainId={8453} calls={createCalls as any} onSuccess={() => { refreshLobby(); setTimeout(() => setCreateTxKey(p => p + 1), 2000); }}>
                <TransactionButton text="CREATE ROOM" className="bg-blue-600 w-full rounded-xl py-4 font-black" />
              </Transaction>
            </div>

            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '15px', textAlign: 'center', fontWeight: '800' }}>ACTIVE DUELS</h3>
              {activeIds.length > 0 ? (
                [...activeIds].reverse().map((id, index) => {
                  const i = activeIds.length - 1 - index;
                  return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1e293b', borderRadius: '16px', marginBottom: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatUnits(activeAmounts[i], 6)} USDC</div>
                      <Transaction chainId={8453} calls={[{ to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, activeAmounts[i]] }) }, { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }] as any} onSuccess={handleJoinSuccess}>
                        <TransactionButton text="JOIN" className="bg-green-600 !py-2 !px-5 !text-xs !font-black" />
                      </Transaction>
                    </div>
                  );
                })
              ) : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>No duels. Create one!</div>}
            </div>

            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '24px', border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '15px', fontWeight: '800' }}>HISTORY</h3>
              {history.length > 0 ? history.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ fontWeight: '900', color: item.status === 'WIN' ? '#10b981' : '#ef4444' }}>{item.status}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.amount} USDC</span>
                </div>
              )) : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>No games yet</div>}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1 style={{ color: '#3b82f6', fontWeight: '900' }}>TokenFlip</h1>
            <p style={{ color: '#94a3b8' }}>Connect Smart Wallet to Duel</p>
          </div>
        )}
      </div>
    </main>
  );
}
