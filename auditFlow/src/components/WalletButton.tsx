// components/WalletButton.tsx
import { useWallet } from '../services/WalletProvider';

const WalletButton = () => {
  const {

    formattedAddress,
    isConnected,
    isOnLisk,
    loading,
    connect,
    disconnect,
    switchToLisk,
    error
  } = useWallet();

  if (error) {
    return (
      <div className="wallet-error">
        <button className="btn btn-error" onClick={() => {}}>
          ❌ {error}
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        className="btn btn-primary"
        onClick={connect}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-small"></span>
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>
    );
  }

  return (
    <div className="wallet-info">
      {!isOnLisk && (
        <button
          className="btn btn-warning"
          onClick={switchToLisk}
          disabled={loading}
        >
          ⚠️ Switch to Lisk
        </button>
      )}
      
      <div className="wallet-details">
        <span className="wallet-address">{formattedAddress}</span>
        <span className={`network-indicator ${isOnLisk ? 'on-lisk' : 'wrong-network'}`}>
          {isOnLisk ? '✓ Lisk' : 'Wrong Network'}
        </span>
        <button
          className="btn btn-secondary"
          onClick={disconnect}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default WalletButton;