import React, { useState, useEffect } from 'react';
import { TonWallet } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Copy, RefreshCw, CheckCircle2, ShieldCheck, Send, QrCode, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface WalletManagerProps {
  userId: string;
}

export function WalletManager({ userId }: WalletManagerProps) {
  const [wallet, setWallet] = useState<TonWallet | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Transfer form state
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  const generateWallet = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wallet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.wallet) {
        setWallet(data.wallet);
        toast.success(data.existing ? 'Wallet loaded' : 'New wallet generated!');
        fetchBalance(data.wallet.address);
        fetchHistory(data.wallet.address);
      } else {
        toast.error('Failed to generate wallet');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (address: string) => {
    setRefreshingBalance(true);
    try {
      const response = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (data.balance !== undefined) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch balance');
    } finally {
      setRefreshingBalance(false);
    }
  };

  const fetchHistory = async (address: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/wallet/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAddress || !transferAmount) return;
    
    setTransferring(true);
    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          toAddress: transferAddress,
          amount: transferAmount
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Transfer initiated successfully!');
        setTransferAddress('');
        setTransferAmount('');
        // Refresh balance after a short delay
        setTimeout(() => fetchBalance(wallet!.address), 5000);
      } else {
        toast.error(data.error || 'Transfer failed');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setTransferring(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  useEffect(() => {
    // Attempt to load existing wallet on mount
    generateWallet();
  }, [userId]);

  return (
    <div id="wallet-manager" className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900">Custodial TON Wallet</h3>
            <p className="text-sm text-gray-500 font-medium tracking-tight">FIFA HUB SECURE VAULT</p>
          </div>
        </div>
        {wallet && (
          <button
            onClick={() => fetchBalance(wallet.address)}
            disabled={refreshingBalance}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshingBalance ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!wallet && loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Initializing your secure wallet...</p>
        </div>
      )}

      {!wallet && !loading && (
        <div className="py-8 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-gray-900">Ready to start?</h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Generate your unique TON address to deposit funds and start trading in the FIFA Hub ecosystem.
            </p>
          </div>
          <button
            onClick={generateWallet}
            className="w-full max-w-xs py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <ShieldCheck className="w-5 h-5" />
            CREATE MY WALLET
          </button>
        </div>
      )}

      <AnimatePresence>
        {wallet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
              <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">{balance}</span>
                <span className="text-xl font-bold text-blue-200">TON</span>
              </div>
            </div>

            {/* Address Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Deposit Address (v4r2)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="p-1.5 bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 group relative">
                <div className="flex items-center justify-between gap-4">
                  <code className="text-xs text-blue-700 font-mono break-all font-bold">
                    {wallet.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(wallet.address, 'Address')}
                    className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 flex flex-col items-center gap-3">
                        <div className="p-3 bg-white rounded-xl shadow-md border border-gray-100">
                          <QRCodeSVG value={wallet.address} size={160} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">SCAN TO DEPOSIT TON</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Transfer Section */}
            <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <h4>Withdraw Funds</h4>
              </div>
              
              <form onSubmit={handleTransfer} className="space-y-3">
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Recipient TON Address"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={transferring || !transferAddress || !transferAmount}
                    className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {transferring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    SEND
                  </button>
                </div>
              </form>
            </div>

            {/* Security Notice / Mnemonic */}
            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-orange-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Recovery phrase</span>
                </div>
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="text-[10px] font-bold text-orange-700 uppercase hover:underline"
                >
                  {showMnemonic ? 'Hide' : 'Show Phrase'}
                </button>
              </div>
              
              <AnimatePresence>
                {showMnemonic && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-3 gap-2 mt-3"
                  >
                    {wallet.mnemonic.map((word, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-orange-200 text-xs text-gray-700">
                        <span className="text-orange-400 font-mono font-bold w-4">{i + 1}</span>
                        <span className="font-semibold">{word}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!showMnemonic && (
                <p className="text-[10px] text-orange-600/80 font-medium leading-relaxed italic">
                  This phrase allows total control of your funds. It is stored securely on our servers, but you should back it up in a safe place.
                </p>
              )}
            </div>

            {/* History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  <h4>Recent Activity</h4>
                </div>
                <button
                  onClick={() => fetchHistory(wallet.address)}
                  className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2">
                {loadingHistory ? (
                  <div className="py-4 flex justify-center">
                    <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  history.map((tx) => (
                    <div key={tx.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tx.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {tx.type === 'in' ? <ArrowRightLeft className="w-4 h-4 rotate-180" /> : <ArrowRightLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {tx.type === 'in' ? 'Received' : 'Sent'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(tx.utime * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === 'in' ? 'text-green-600' : 'text-orange-600'}`}>
                          {tx.type === 'in' ? '+' : '-'}{tx.amount} TON
                        </p>
                        <p className={`text-[10px] font-bold ${tx.success ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.success ? 'Confirmed' : 'Failed'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium italic">No transactions found yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Network: TON Mainnet Secure</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
