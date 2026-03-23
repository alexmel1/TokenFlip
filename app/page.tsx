'use client';

import { useState, useMemo } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction'; 
import { useAccount, useReadContract, useBalance, useWatchContractEvent } from 'wagmi';
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
  const [resultSide, setResultSide] = useState<'HEADS' | 'TAILS' | null>(null);
  const [winStatus, setWinStatus] = useState<'win' | 'lose' | null>(null);

  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance, refetch: refetchBalances } = useBalance({ address, token: USDC_ADDRESS });
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

  const handleJoinSuccess = () => {
    setGameState('flipping');
    setWinStatus(null);
    
    // Имитируем бросок 5 секунд
    setTimeout(() => {
      // Генерируем визуальный результат (для красоты на фронтенде)
      const side = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setResultSide(side);
      
      // Проверяем баланс через паузу
      setTimeout(async () => {
        const oldBalance = usdcBalance?.value || BigInt(0);
        const { data: newData } = await refetchBalances();
        setWinStatus(newData && newData.value > oldBalance ? 'win' : 'lose');
        setGameState('result');
        refreshLobby();
      }, 1000);
    }, 5000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coinFlipAnim {
          0% { transform: rotateY(0) scale(1); }
          50% { transform: rotateY(900deg) scale(1.3); }
          100% { transform: rotateY(1800deg) scale(1); }
        }
        .overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(2, 6, 23, 0.98); z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          backdrop-filter: blur(20px);
        }
        .coin-wrapper {
          position: relative; width: 200px; height: 200px;
        }
        .coin-img {
          width: 100%; height: 100%; object-fit: contain; border-radius: 50%;
          transition: all 0.5s;
        }
        .animating { animation: coinFlipAnim 5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .side-text {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-size: 2rem; font-weight: bold; text-shadow: 0 0 10px black;
          pointer-events: none; color: #fff;
        }
        .win-border { border: 6px solid #10b981; box-shadow: 0 0 50px #10b981; }
        .lose-border { border: 6px solid #ef4444; filter: grayscale(1); }
      `}} />

      {gameState !== 'idle' && (
        <div className="overlay">
          <div className="coin-wrapper">
            <img src="/coin.png" className={`coin-img ${gameState === 'flipping' ? 'animating' : ''} ${winStatus === 'win' ? 'win-border' : winStatus === 'lose' ? 'lose-border' : ''}`} />
            {gameState === 'result' && <div className="side-text">{resultSide}</div>}
          </div>
          
          <h2 style={{ marginTop: '40px', fontSize: '2.5rem', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>
            {gameState === 'flipping' ? 'FLIPPING...' : winStatus === 'win' ? 'JACKPOT!' : 'YOU LOST'}
          </h2>

          {gameState === 'result' && (
            <button onClick={() => {setGameState('idle'); setResultSide(null);}} style={{ marginTop: '30px', padding: '15px 40px', borderRadius: '15px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold' }}>Return to Lobby</button>
          )}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#3b82f6', fontWeight: 'bold' }}>TokenFlip</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
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
            <div style={{ marginBottom: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>Enter Bet Amount</div>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#020617', border: '1px solid #3b82f6', color: 'white', marginBottom: '15px', textAlign: 'center', fontSize: '1.2rem' }} />
            <Transaction chainId={8453} calls={createCalls as any} onSuccess={() => refreshLobby()}>
              <TransactionButton text={`Create Duel`} className="bg-blue-600 w-full" />
            </Transaction>
          </div>

          <div style={{ padding: '20px', background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1rem', color: '#94a3b8' }}>Active Duels</h3>
            {activeIds.length > 0 ? (
              [...activeIds].reverse().map((id, index) => {
                const i = activeIds.length - 1 - index;
                const duelAmt = activeAmounts[i];
                return (
                    <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1e293b', borderRadius: '16px', marginBottom: '8px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#10b981' }}>{formatUnits(duelAmt, 6)} USDC</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>by {activePlayers[i].slice(0, 8)}...</div>
                        </div>
                        <div style={{ width: '80px' }}>
                          <Transaction 
                              chainId={8453} 
                              calls={[
                                  { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, duelAmt] }) },
                                  { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }
                              ] as any}
                              onSuccess={handleJoinSuccess}
                          >
                              <TransactionButton text="Join" className="bg-green-600 !py-1 !px-0 !text-xs !min-w-0" />
                          </Transaction>
                        </div>
                    </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>No duels. Be the first!</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2 style={{ color: '#3b82f6' }}>Connect Wallet to Start</h2>
        </div>
      )}
    </main>
  );
}
