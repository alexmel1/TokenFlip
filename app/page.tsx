'use client';

import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      {/* Шапка с кошельком */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      {/* Центральная часть игры */}
      <h1 style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '10px' }}>TokenFlip</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>1vs1 USDC Duel</p>

      {isConnected ? (
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ padding: '40px', background: '#0f172a', borderRadius: '30px', border: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Join a Duel</h2>
            <button style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Create Room (10 USDC)
            </button>
            <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#64748b' }}>
              Winner takes all! Fully on-chain.
            </p>
          </div>
        </div>
      ) : (
        <p style={{ color: '#60a5fa', fontSize: '1.2rem' }}>Connect your wallet to play</p>
      )}
    </main>
  );
}
