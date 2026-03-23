'use client';

import { useState, useMemo } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusLabel } from '@coinbase/onchainkit/transaction'; 
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';

// НОВЫЙ КОНТРАКТ
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
  const [txHistory, setTxHistory] = useState<{hash: string, amount: string}[]>([]);

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

  const handleJoinSuccess = async (res: any) => {
    if (res.transactionReceipts?.[0]?.transactionHash) {
      setTxHistory(prev => [{ hash: res.transactionReceipts[0].transactionHash, amount: 'Duel' }, ...prev].slice(0, 5));
    }
    const oldBalance = usdcBalance?.value || BigInt(0);
    setGameState('flipping');
    setTimeout(async () => {
      const { data: newB } = await refetchUSDC();
      setWinStatus((newB?.value || BigInt(0)) > oldBalance ? 'win' : 'lose');
      setGameState('result');
      refreshLobby();
    }, 6000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coinFlip { 0% { transform: rotateY(0); } 100% { transform: rotateY(1440deg); } }
        .overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.98); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
        .coin-img { width: 140px; height: 140px; border-radius: 50%; transition: all 0.6s; margin-bottom: 20px; }
        .flipping-anim { animation: coinFlip 5s cubic-bezier(0.15, 0, 0.15, 1) forwards; }
        .win-glow { box-shadow: 0 0 50px #10b981; border: 4px solid #10b981; }
        .lose-glow { filter: grayscale(1) opacity(0.3); border: 4px solid #ef4444; }
        
        .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #1e293b; background: rgba(15, 23, 42, 0.5); }
        .balance-info { text-align: right; font-size: 0.65rem; color: #94a3b8; margin-right: 8px; line-height: 1.2; }
      `}} />

      {/* АНИМАЦИЯ */}
      {gameState !== 'idle' && (
        <div className="overlay">
          <img src="/coin.png" className={`coin-img ${gameState === 'flipping' ? 'flipping-anim' : ''} ${winStatus === 'win' ? 'win-glow' : winStatus === 'lose' ? 'lose-glow' : ''}`} onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>
            {gameState === 'flipping' ? 'FLIPPING...' : winStatus === 'win' ? 'WINNER!' : 'LOST'}
          </h2>
          {gameState === 'result' && <button onClick={() => setGameState('idle')} style={{ marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '10px', fontWeight: 'bold' }}>Back</button>}
        </div>
      )}

      {/* ШАПКА */}
      <nav className="header">
        <div style={{ fontWeight: '900', color: '#3b82f6', fontSize: '1.2rem' }}>TokenFlip</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isConnected && (
            <div className="balance-info">
              <div>{usdcBalance?.formatted.slice(0, 4)} USDC</div>
              <div>{ethBalance?.formatted.slice(0, 6)} ETH</div>
            </div>
          )}
          <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
        </div>
      </nav>

      <div style={{ maxWidth: '450px', margin: '20px auto', padding: '0 15px' }}>
        
        {isConnected ? (
          <>
            {/* СОЗДАНИЕ ИГРЫ */}
            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '15px' }}>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', outline: 'none' }} />
              <div style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '15px', letterSpacing: '1px' }}>USDC BET</div>
              <Transaction chainId={8453} calls={createCalls as any} onSuccess={(res) => {
                  if (res.transactionReceipts?.[0]?.transactionHash) {
                    setTxHistory(p => [{hash: res.transactionReceipts[0].transactionHash, amount}, ...p]);
                  }
                  refreshLobby();
              }}>
                <TransactionButton text="CREATE ROOM" className="bg-blue-600 w-full rounded-xl py-4 font-bold" />
                <div style={{ fontSize: '10px', marginTop: '8px' }}><TransactionStatus><TransactionStatusLabel /></TransactionStatus></div>
              </Transaction>
            </div>

            {/* ЛОББИ */}
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '15px', fontWeight: 'bold' }}>ACTIVE DUELS</h3>
              {activeIds.length > 0 ? (
                [...activeIds].reverse().map((id, index) => {
                  const i = activeIds.length - 1 - index;
                  return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1e293b', borderRadius: '16px', marginBottom: '8px', border: '1px solid rgba(59, 130, 246, 0.05)' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatUnits(activeAmounts[i], 6)} <span style={{fontSize: '0.7rem', color: '#64748b'}}>USDC</span></div>
                      <div style={{ width: '80px' }}>
                        <Transaction chainId={8453} calls={[{ to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, activeAmounts[i]] }) }, { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }] as any} onSuccess={handleJoinSuccess}>
                          <TransactionButton text="JOIN" className="bg-green-600 !py-2 !px-0 !text-xs !font-bold" />
                        </Transaction>
                      </div>
                    </div>
                  );
                })
              ) : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', padding: '10px' }}>No duels found</div>}
            </div>

            {/* ИСТОРИЯ ТРАНЗАКЦИЙ */}
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '24px', border: '1px solid #1e293b' }}>
              <h3 style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>MY RECENT ACTIVITY</h3>
              {txHistory.length > 0 ? txHistory.map(item => (
                <a key={item.hash} href={`https://basescan.org/tx/${item.hash}`} target="_blank" style={{ display: 'flex', justifyContent: 'space-between', background: '#020617', padding: '8px 12px', borderRadius: '10px', color: '#3b82f6', fontSize: '0.7rem', marginBottom: '6px', textDecoration: 'none', border: '1px solid #1e293b' }}>
                  <span>Tx: {item.hash.slice(0, 12)}...</span>
                  <span style={{ color: '#94a3b8' }}>Open ↗</span>
                </a>
              )) : <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>No transactions this session.</div>}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <h2 style={{ color: '#3b82f6', fontWeight: '900' }}>TokenFlip</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Connect your Smart Wallet to duel.</p>
          </div>
        )}
      </div>
    </main>
  );
}
