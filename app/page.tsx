'use client';

import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: '#020617', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Wallet>
          <ConnectWallet />
          <WalletDropdown><WalletDropdownDisconnect /></WalletDropdown>
        </Wallet>
      </div>

      <h1 style={{ fontSize: '3.5rem', color: '#3b82f6', marginTop: '50px' }}>TokenFlip</h1>

      {isConnected ? (
        <div style={{ marginTop: '40px', padding: '30px', background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center' }}>
          <p>Wallet Connected! Ready for USDC Duel.</p>
        </div>
      ) : (
        <p style={{ marginTop: '50px', color: '#64748b' }}>Connect your wallet to start playing</p>
      )}
    </main>
  );
}
