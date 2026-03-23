'use client';

import { useState, useMemo } from 'react';
import { 
  Wallet, 
  ConnectWallet, 
  WalletDropdown, 
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet';
import { 
  Identity, 
  Avatar, 
  Name, 
  Address 
} from '@coinbase/onchainkit/identity';
import { 
  Transaction, 
  TransactionButton, 
  TransactionStatus, 
  TransactionStatusAction, 
  TransactionStatusLabel 
} from '@coinbase/onchainkit/transaction'; 
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
      // ИСПРАВЛЕНО: Заменили 0n на BigInt(0)
      const currentBalance = newB?.value || BigInt(0);
      setWinStatus(currentBalance > oldBalance ? 'win' : 'lose');
      setGameState('result');
      refreshLobby();
    }, 6000);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coinFlip { 0% { transform: rotateY(0); } 100% { transform: rotateY(1440deg); } }
        .overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.98); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); padding: 20px; text-align: center; }
        .coin-img { width: 150px; height: 150px; border-radius: 50%; transition: all 0.6s; margin-bottom: 30px; }
        .flipping-anim { animation: coinFlip 5s cubic-bezier(0.15, 0, 0.15, 1) forwards; }
        .win-effect { box-shadow: 0 0 50px #10b981; border: 4px solid #10b981; }
        .lose-effect { filter: grayscale(1) opacity(0.3); border: 4px solid #ef4444; }
        
        .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #1e293b; background: rgba(15, 23, 42, 0.5); }
        .balance-container { display: flex; flex-direction: column; align-items: flex-end; margin-right: 10px; line-height: 1.2; }
        
        @media (max-width: 450px) {
          .balance-container { display: none; } /* Скрываем цифры на очень узких мобилках для чистоты */
          .title { font-size: 1.1rem !important; }
        }
      `}} />

      {/* АНИМАЦИЯ РЕЗУЛЬТАТА */}
      {gameState !== 'idle' && (
        <div className="overlay">
          <img src="/coin.png" className={`coin-img ${gameState === 'flipping' ? 'flipping-anim' : ''} ${winStatus === 'win' ? 'win-effect' : winStatus === 'lose' ? 'lose-effect' : ''}`} onError={(e) => { (e.target as any).src = 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: winStatus === 'win' ? '#10b981' : winStatus === 'lose' ? '#ef4444' : '#3b82f6' }}>
            {gameState === 'flipping' ? 'LUCK IS ROTATING...' : winStatus === 'win' ? 'YOU WON!' : 'BET LOST'}
          </h2>
          {gameState === 'result' && (
            <button onClick={() => setGameState('idle')} style={{ marginTop: '30px', background: '#3b82f6', color: 'white', border: 'none', padding: '15px 50px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Continue</button>
          )}
        </div>
      )}

      {/* НАВИГАЦИЯ */}
      <nav className="header">
        <div className="title" style={{ fontWeight: '900', color: '#3b82f6', fontSize: '1.4rem' }}>TokenFlip</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="balance-container">
            <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{ethBalance?.formatted.slice(0, 5)} ETH</div>
            <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem' }}>{usdcBalance?.formatted.slice(0, 5)} USDC</div>
          </div>
          <Wallet><ConnectWallet><Avatar className="h-6 w-6" /><Name /></ConnectWallet><WalletDropdown><WalletDropdownDisconnect /></WalletDropdown></Wallet>
        </div>
      </nav>

      <div style={{ maxWidth: '450px', margin: '30px auto', padding: '0 15px' }}>
        
        {/* БЛОК СОЗДАНИЯ */}
        <div style={{ background: '#0f172a', padding: '25px', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '10px', letterSpacing: '1px' }}>BET AMOUNT (USDC)</div>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', outline: 'none', marginBottom: '15px' }} />
          <Transaction chainId={8453} calls={createCalls as any} onSuccess={() => refreshLobby()}>
            <TransactionButton text="CREATE ROOM" className="bg-blue-600 w-full rounded-xl py-4 font-black" />
            <div style={{ fontSize: '10px', marginTop: '10px' }}><TransactionStatus><TransactionStatusLabel /></TransactionStatus></div>
          </Transaction>
        </div>

        {/* ЛОББИ */}
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '15px', fontWeight: 'bold' }}>ACTIVE DUELS</h3>
          {activeIds.length > 0 ? (
            [...activeIds].reverse().map((id, index) => {
              const i = activeIds.length - 1 - index;
              return (
                <div key={id.toString()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#1e293b', borderRadius: '16px', marginBottom: '10px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#10b981' }}>{formatUnits(activeAmounts[i], 6)} USDC</div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>by {activePlayers[i].slice(0, 10)}...</div>
                  </div>
                  <div style={{ width: '80px' }}>
                    <Transaction 
                      chainId={8453} 
                      calls={[
                        { to: USDC_ADDRESS, data: encodeFunctionData({ abi: usdcAbi, functionName: 'approve', args: [CONTRACT_ADDRESS, activeAmounts[i]] }) },
                        { to: CONTRACT_ADDRESS, data: encodeFunctionData({ abi: abi, functionName: 'joinGame', args: [id] }) }
                      ] as any} 
                      onSuccess={handleJoinSuccess}
                    >
                      <TransactionButton text="JOIN" className="bg-green-600 !py-2 !px-0 !text-xs !font-bold" />
                    </Transaction>
                  </div>
                </div>
              );
            })
          ) : <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.8rem' }}>No rooms found.</div>}
        </div>

        {/* ССЫЛКА НА СКАНЕР */}
        <div style={{ textAlign: 'center' }}>
          <a href={`https://basescan.org/address/${CONTRACT_ADDRESS}`} target="_blank" style={{ fontSize: '0.7rem', color: '#3b82f6', textDecoration: 'none', opacity: 0.7 }}>View Contract History on Basescan ↗</a>
        </div>

      </div>
    </main>
  );
}
