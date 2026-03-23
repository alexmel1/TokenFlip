'use client';

import { 
  Wallet, 
  ConnectWallet, 
  WalletDropdown, 
  WalletDropdownDisconnect,
  Identity,
  Avatar,
  Name,
  Address 
} from '@coinbase/onchainkit';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'white', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', fontFamily: 'sans-serif' }}>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar /><Name /><Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <h1 style={{ fontSize: '3.5rem', color: '#3b82f6', fontWeight: 'bold' }}>TokenFlip</h1>
      <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Standard Web App on Base</p>

      {isConnected ? (
        <div style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '24px', border: '1px solid #1e293b' }}>
          <p style={{ color: '#60a5fa', fontWeight: 'bold' }}>Wallet Connected!</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Ready to build TokenFlip logic.</p>
        </div>
      ) : (
        <p style={{ color: '#64748b' }}>Connect your Smart Wallet to start</p>
      )}
    </main>
  );
}
