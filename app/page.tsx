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

  const startFlipAnimation = async () => {
    // ЗАМЕНИЛИ 0n на BigInt(0) ДЛЯ СОВМЕСТИМОСТИ
    const oldBalance = usdcBalance?.value || BigInt(0);
    setGameState('flipping');
    
    setTimeout(async () => {
      const { data: newBalanceData } = await refetchUSDC();
      const newBalance = newBalanceData?.value || BigInt(0);
      
      setWinStatus(newBalance > oldBalance ? 'win' : 'lose');
      setGameState('result');
      refreshLobby();
    }, 4500);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes superFlip {
          0% { transform: rotateX(0); }
          100% { transform: rotateX(1800deg) scale(1.1); }
        }
        .overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(2, 6, 23, 0.95); z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          backdrop-filter: blur(10px);
        }
        .coin-box { width: 200px; height: 200px; perspective: 1000px; }
        .coin-img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; box-shadow: 0 0 50px rgba(59, 130, 246, 0.3); }
        .flipping-active { animation: superFlip 4.5s cubic-bezier(0.1, 0, 0.3, 1) forwards; }
        .win-glow { box-shadow: 0 0 80px #10b981 !important; border: 4px solid #10b981; }
        .lose-glow { filter: grayscale(1) opacity(0.5); }
      `}} />

      {gameState !== 'idle' && (
        <div className="overlay">
          <div className="coin-box">
            <img 
              src="/coin.png" 
              className={`coin-img ${gameState === 'flipping' ? 'flipping-active' : ''} ${winStatus === 'win' ? 'win-glow' : winStatus === 'lose' ? 'lose-glow' : ''}`}
              onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }}
            />
          </div>
          <h2 style={{ marginTop: '40px', fontSize: '2rem', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>
            {gameState === 'flipping' ? 'FLIPPING...' : winStatus === 'win' ? 'YOU WON!' : 'YOU LOST!'}
          </h2>
          {gameState === 'result' && (
            <button onClick={() => {setGameState('idle'); setWinStatus(null);}} style={{ marginTop: '20px', padding: '12px 30px', borderRadius: '12px', background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer' }}>Back to Lobby</button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', color: '#3b82f6', fontWeight: 'bold' }}>TokenFlip</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                <div style={{ color: '#94a3b8' }}>{ethBalance?.formatted.slice(0, 6)} ETH</div>
                <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>{usdcBalance?.formatted.slice(0, 4)} USDC</div>
            </div>
            <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
        </div>
      </div>

      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ padding: '25px', background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '30px', textAlign: 'center' }}>
            <div style={{ marginBottom: '15px', color: '#94a3b8' }}>Bet Amount (USDC)</div>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#020617', border: '1px solid #3b82f6', color: 'white', marginBottom: '20px', textAlign: 'center', fontSize: '1.5rem' }} />
            <Transaction chainId={8453} calls={createCalls as any} onSuccess={() => refreshLobby()}>
              <TransactionButton text={`Create Duel`} className="bg-blue-600 w-full rounded-xl" />
              <TransactionStatus><TransactionStatusLabel /><TransactionStatusAction /></TransactionStatus>
            </Transaction>
          </div>

          <div style={{ padding: '20px', background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: '#94a3b8' }}>Active Duels</h3>
            {activeIds.length > 0 ? (
              [...activeIds].reverse().map((id, index) => {
                const i = activeIds.length - 1 - index;
                return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#1e293b', borderRadius: '16px', marginBottom: '10px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{formatUnits(activeAmounts[i], 6)} USDC</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>by {activePlayers[i].slice(0, 8)}...</div>
                        </div>
                        <div style={{ width: '100px' }}>
                          <Transaction 
                              chainId={8453} 
                              calls={[
                                  { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, activeAmounts[i]] }) },
                                  { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }
                              ] as any}
                              onSuccess={startFlipAnimation}
                          >
                              <TransactionButton text="Join" className="bg-green-600 !py-2 !px-4 !text-sm !min-w-0" />
                          </Transaction>
                        </div>
                    </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b' }}>No active duels found.</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2 style={{ color: '#3b82f6' }}>Connect Wallet to Play</h2>
        </div>
      )}
    </main>
  );
}
