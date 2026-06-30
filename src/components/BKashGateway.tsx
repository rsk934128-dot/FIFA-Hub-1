import React, { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, 
  CreditCard, 
  Lock, 
  Settings, 
  RefreshCw, 
  ArrowRightLeft, 
  Send, 
  Undo2, 
  Search, 
  Trash2, 
  Play, 
  Copy, 
  Check, 
  CheckCircle2, 
  Bell, 
  FileText, 
  Plus, 
  AlertTriangle,
  Layers,
  ChevronRight,
  Code,
  Terminal,
  User,
  ShieldAlert,
  Sliders,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// Interfaces
interface BKashCredentials {
  brandApiKey: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  intent: "Sale" | "Authorize";
  webhookUrl: string;
}

interface WalletBalances {
  collection: number;
  disbursement: number;
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  type: "Collection" | "Disbursement" | "Refund" | "Webhook_Offline";
  status: "Pending" | "Completed" | "Authorized" | "Refunded" | "Failed";
  intent: "Sale" | "Authorize";
  createdAt: string;
  completedAt?: string;
  paymentUrl?: string;
  referenceId?: string;
}

interface CustomerAgreement {
  id: string;
  customerPhone: string;
  customerName: string;
  createdAt: string;
  agreementStatus: "Active" | "Paused";
}

// Default Seed Data
const DEFAULT_CREDENTIALS: BKashCredentials = {
  brandApiKey: "BP_Live_Sec_9x8f7d6s5a4q3w2e1r0t",
  appKey: "bkash_app_key_8e7d6c5b4a3_prod",
  appSecret: "bkash_app_secret_7f6e5d4c3b2a1_prod",
  username: "fifahub_merchant_bkash",
  password: "••••••••••••••••",
  intent: "Sale",
  webhookUrl: "https://ais-dev-jglxahajw4egzrtkpdnj65-957147108662.asia-southeast1.run.app/api/webhook"
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "BP7A8B9C0D1E2F3G",
    orderId: "ORD-99218",
    amount: 1500,
    customerName: "Mahmudul Hasan",
    customerEmail: "mahmudul@gmail.com",
    type: "Collection",
    status: "Completed",
    intent: "Sale",
    createdAt: "2026-06-30 11:15:22",
    completedAt: "2026-06-30 11:16:05"
  },
  {
    id: "BP3R2E1W8Q7T6Y5U",
    orderId: "ORD-99154",
    amount: 3200,
    customerName: "Fahim Ahmed",
    customerEmail: "fahim@hotmail.com",
    type: "Collection",
    status: "Refunded",
    intent: "Sale",
    createdAt: "2026-06-29 14:30:10",
    completedAt: "2026-06-29 14:31:00",
    referenceId: "BP_REF_8s7d6f5"
  },
  {
    id: "BP9Q8W7E6R5T4Y3U",
    orderId: "ORD-99088",
    amount: 500,
    customerName: "Jariyan Kabir",
    customerEmail: "jariyan@outlook.com",
    type: "Collection",
    status: "Authorized",
    intent: "Authorize",
    createdAt: "2026-06-29 18:45:00",
    completedAt: "2026-06-29 18:45:30"
  },
  {
    id: "BP5D4F3G2H1J0K9L",
    orderId: "DISB-8801",
    amount: 800,
    customerName: "Arif Chowdhury",
    customerEmail: "arif@gmail.com",
    type: "Disbursement",
    status: "Completed",
    intent: "Sale",
    createdAt: "2026-06-30 09:12:00",
    completedAt: "2026-06-30 09:12:30"
  }
];

const INITIAL_AGREEMENTS: CustomerAgreement[] = [
  {
    id: "AGR-887123991",
    customerPhone: "01712345678",
    customerName: "Mahmudul Hasan",
    createdAt: "2026-06-28 10:22:15",
    agreementStatus: "Active"
  },
  {
    id: "AGR-998234112",
    customerPhone: "01987654321",
    customerName: "Nusrat Jahan",
    createdAt: "2026-06-29 16:40:00",
    agreementStatus: "Active"
  }
];

export default function BKashGateway() {
  // States
  const [credentials, setCredentials] = useState<BKashCredentials>(() => {
    const saved = localStorage.getItem("bkash_credentials");
    return saved ? JSON.parse(saved) : DEFAULT_CREDENTIALS;
  });

  const [wallet, setWallet] = useState<WalletBalances>(() => {
    const saved = localStorage.getItem("bkash_balances");
    return saved ? JSON.parse(saved) : { collection: 42500, disbursement: 18400 };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("bkash_transactions");
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [agreements, setAgreements] = useState<CustomerAgreement[]>(() => {
    const saved = localStorage.getItem("bkash_agreements");
    return saved ? JSON.parse(saved) : INITIAL_AGREEMENTS;
  });

  // Local state persistence
  useEffect(() => {
    localStorage.setItem("bkash_credentials", JSON.stringify(credentials));
  }, [credentials]);

  useEffect(() => {
    localStorage.setItem("bkash_balances", JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem("bkash_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("bkash_agreements", JSON.stringify(agreements));
  }, [agreements]);

  // Form Inputs
  const [paymentAmount, setPaymentAmount] = useState<string>("750");
  const [customerName, setCustomerName] = useState<string>("Zeeshan Ahmed");
  const [customerEmail, setCustomerEmail] = useState<string>("zeeshan@gmail.com");
  const [orderId, setOrderId] = useState<string>(() => "ORD-" + Math.floor(10000 + Math.random() * 90000));

  // Wallet Transfer State
  const [transferAmount, setTransferAmount] = useState<string>("5000");
  const [transferDirection, setTransferDirection] = useState<"coll_to_disb" | "disb_to_coll">("coll_to_disb");

  // Disbursement State
  const [disbursePhone, setDisbursePhone] = useState<string>("01812345678");
  const [disburseAmount, setDisburseAmount] = useState<string>("1200");
  const [disburseName, setDisburseName] = useState<string>("Imran Khan");

  // Refund dialog / active transaction
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState<string>("Customer requested cancellation");

  // Search and filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Active sandbox tab
  const [sandboxTab, setSandboxTab] = useState<"api" | "checkout_flow">("api");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active transaction link simulator result
  const [simulatedLinkResponse, setSimulatedLinkResponse] = useState<any>(null);
  const [activeCreatedTx, setActiveCreatedTx] = useState<Transaction | null>(null);

  // Checkout flow screen state: "bkash_auth" | "otp" | "pin" | "success"
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "number" | "otp" | "pin" | "complete">("idle");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("017XXXXXXXX");
  const [checkoutOtp, setCheckoutOtp] = useState<string>("");
  const [checkoutPin, setCheckoutPin] = useState<string>("");

  // Endpoint selector for API Playground
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("POST_create");

  // Copy API Helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Reset checkout state
  const resetCheckoutState = () => {
    setCheckoutStep("idle");
    setCheckoutPhone("017XXXXXXXX");
    setCheckoutOtp("");
    setCheckoutPin("");
  };

  // Create payment link handler
  const handleCreatePaymentLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const txId = "BP" + Array.from({ length: 14 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
    const mockPaymentUrl = `https://secure-payment.bohudurpay.com/pay/${txId.toLowerCase()}`;

    const newTx: Transaction = {
      id: txId,
      orderId: orderId,
      amount: parsedAmount,
      customerName,
      customerEmail,
      type: "Collection",
      status: "Pending",
      intent: credentials.intent,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      paymentUrl: mockPaymentUrl
    };

    setTransactions(prev => [newTx, ...prev]);
    setActiveCreatedTx(newTx);
    setCheckoutPhone("017");

    // Populate API JSON response
    setSimulatedLinkResponse({
      status: 1,
      message: "Payment Link Created Successfully",
      payment_url: mockPaymentUrl,
      transaction_id: txId,
      details: {
        amount: parsedAmount,
        cus_name: customerName,
        cus_email: customerEmail,
        intent: credentials.intent,
        merchant_wallet: credentials.username,
        webhook_url: credentials.webhookUrl
      }
    });

    toast.success("Payment link generated! Launch the checkout simulator to pay.", {
      duration: 5000,
    });

    // Reset random orderId for next simulation
    setOrderId("ORD-" + Math.floor(10000 + Math.random() * 90000));
  };

  // Simulation of Webhook Notification (Offline Transaction View)
  const simulateWebhook = (tx: Transaction) => {
    toast.info("Triggering background offline webhook...", {
      description: `Targeting: ${credentials.webhookUrl}`
    });

    setTimeout(() => {
      toast.success("Webhook Callback Delivered successfully!", {
        description: `BohudurPay postback: Transaction ${tx.id} is finalized offline.`
      });
    }, 1800);
  };

  // Complete customer payment in the simulator
  const handleCompletePaymentSimulation = () => {
    if (!activeCreatedTx) return;

    // Transition to completion
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    
    setTransactions(prev => prev.map(t => {
      if (t.id === activeCreatedTx.id) {
        return {
          ...t,
          status: credentials.intent === "Sale" ? "Completed" : "Authorized",
          completedAt: nowStr
        };
      }
      return t;
    }));

    // Update Collection Balance immediately if it's "Sale"
    if (credentials.intent === "Sale") {
      setWallet(prev => ({
        ...prev,
        collection: prev.collection + activeCreatedTx.amount
      }));
    }

    toast.success(`bKash payment simulation successful! Mode: ${credentials.intent}`, {
      description: credentials.intent === "Sale" 
        ? `BDT ${activeCreatedTx.amount} added to Collection Wallet.`
        : `Transaction authorized for late capture.`
    });

    // Automatically trigger Webhook callback simulation
    simulateWebhook({
      ...activeCreatedTx,
      status: credentials.intent === "Sale" ? "Completed" : "Authorized",
      completedAt: nowStr
    });

    // Add Agreement if customer registers
    const hasActiveAgreement = agreements.some(a => a.customerName === activeCreatedTx.customerName);
    if (!hasActiveAgreement && Math.random() > 0.3) {
      const newAgr: CustomerAgreement = {
        id: "AGR-" + Math.floor(100000000 + Math.random() * 900000000),
        customerPhone: checkoutPhone.length > 5 ? checkoutPhone : "01712984551",
        customerName: activeCreatedTx.customerName,
        createdAt: nowStr,
        agreementStatus: "Active"
      };
      setAgreements(prev => [newAgr, ...prev]);
    }

    setCheckoutStep("complete");
  };

  // Wallet Transfer (Internal Wallet Transfers)
  const handleWalletTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid transfer amount.");
      return;
    }

    if (transferDirection === "coll_to_disb") {
      if (wallet.collection < amount) {
        toast.error("Insufficient funds in Collection Wallet.");
        return;
      }
      setWallet(prev => ({
        collection: prev.collection - amount,
        disbursement: prev.disbursement + amount
      }));
      toast.success(`Transferred BDT ${amount} internally`, {
        description: "Moved from Collection Wallet to Disbursement Wallet."
      });
    } else {
      if (wallet.disbursement < amount) {
        toast.error("Insufficient funds in Disbursement Wallet.");
        return;
      }
      setWallet(prev => ({
        disbursement: prev.disbursement - amount,
        collection: prev.collection + amount
      }));
      toast.success(`Transferred BDT ${amount} internally`, {
        description: "Moved from Disbursement Wallet to Collection Wallet."
      });
    }

    // Add Internal Log Tx
    const logId = "BP_INT_" + Math.floor(100000 + Math.random() * 900000);
    const newLogTx: Transaction = {
      id: logId,
      orderId: "INTERNAL-XFER",
      amount: amount,
      customerName: "Internal Vault",
      customerEmail: "vault@merch.com",
      type: transferDirection === "coll_to_disb" ? "Disbursement" : "Collection",
      status: "Completed",
      intent: "Sale",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      completedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setTransactions(prev => [newLogTx, ...prev]);
  };

  // Disburse Money to Customer Wallet
  const handleDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(disburseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid disbursement amount.");
      return;
    }
    if (wallet.disbursement < amount) {
      toast.error("Insufficient funds in Disbursement Wallet.");
      return;
    }

    // Process
    setWallet(prev => ({
      ...prev,
      disbursement: prev.disbursement - amount
    }));

    const txId = "BP_DIS_" + Array.from({ length: 10 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
    const newTx: Transaction = {
      id: txId,
      orderId: "DISB-" + Math.floor(1000 + Math.random() * 9000),
      amount: amount,
      customerName: disburseName || "bKash Customer",
      customerEmail: disbursePhone + "@bkash.net",
      type: "Disbursement",
      status: "Completed",
      intent: "Sale",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      completedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      referenceId: "RECV-" + disbursePhone
    };

    setTransactions(prev => [newTx, ...prev]);
    toast.success(`Disbursed BDT ${amount} Successfully!`, {
      description: `Money credited to bKash Customer wallet (${disbursePhone}).`
    });

    // Reset phone/amount
    setDisbursePhone("01");
    setDisburseAmount("");
  };

  // Refund execution
  const executeRefund = () => {
    if (!selectedTxForRefund) return;
    const tx = selectedTxForRefund;

    setTransactions(prev => prev.map(t => {
      if (t.id === tx.id) {
        return {
          ...t,
          status: "Refunded",
          referenceId: "BP_REF_" + Math.floor(1000000 + Math.random() * 9000000)
        };
      }
      return t;
    }));

    // Revert collection wallet balance if it was completed
    if (tx.status === "Completed") {
      setWallet(prev => ({
        ...prev,
        collection: Math.max(0, prev.collection - tx.amount)
      }));
    }

    toast.success(`Transaction ${tx.id} Refunded!`, {
      description: `BDT ${tx.amount} returned. Reason: ${refundReason}`
    });

    setSelectedTxForRefund(null);
  };

  // Delete Customer Agreement (Mandatory request)
  const handleDeleteAgreement = (id: string) => {
    setAgreements(prev => prev.filter(a => a.id !== id));
    toast.success("Customer Agreement Revoked", {
      description: "Agreement token was successfully deleted and canceled on the bKash tokenization server."
    });
  };

  // Search and Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === "ALL" ||
        t.status.toUpperCase() === statusFilter.toUpperCase() ||
        (statusFilter === "SALE" && t.intent === "Sale" && t.status === "Completed") ||
        (statusFilter === "AUTHORIZE" && t.intent === "Authorize");

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  // Code snippets generator based on selected sandbox endpoint
  const getApiDetails = () => {
    switch (selectedEndpoint) {
      case "POST_create":
        return {
          method: "POST",
          url: "https://secure-payment.bohudurpay.com/api/payment/create",
          headers: {
            "API-KEY": credentials.brandApiKey,
            "Content-Type": "application/json"
          },
          payload: {
            amount: parseFloat(paymentAmount) || 500,
            cus_name: customerName,
            cus_email: customerEmail,
            success_url: "https://yourhub.com/payment/success",
            cancel_url: "https://yourhub.com/payment/cancel",
            webhook_url: credentials.webhookUrl,
            metadata: { order_id: orderId, mode: credentials.intent.toLowerCase() }
          },
          curl: `curl -X POST https://secure-payment.bohudurpay.com/api/payment/create \\
  -H "API-KEY: ${credentials.brandApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": ${paymentAmount},
    "cus_name": "${customerName}",
    "cus_email": "${customerEmail}",
    "success_url": "https://yourhub.com/payment/success",
    "cancel_url": "https://yourhub.com/payment/cancel",
    "webhook_url": "${credentials.webhookUrl}",
    "metadata": { "order_id": "${orderId}", "plan": "premium" }
  }'`
        };
      case "POST_verify":
        return {
          method: "POST",
          url: "https://secure-payment.bohudurpay.com/api/payment/verify",
          headers: {
            "API-KEY": credentials.brandApiKey,
            "Content-Type": "application/json"
          },
          payload: {
            transaction_id: activeCreatedTx?.id || "BP7A8B9C0D1E2F3G"
          },
          curl: `curl -X POST https://secure-payment.bohudurpay.com/api/payment/verify \\
  -H "API-KEY: ${credentials.brandApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{ "transaction_id": "${activeCreatedTx?.id || "BP7A8B9C0D1E2F3G"}" }'`
        };
      case "POST_payment_link":
        return {
          method: "POST",
          url: "https://marchant.bohudurpay.com/api/payment-link",
          headers: {
            "API-KEY": credentials.brandApiKey,
            "Content-Type": "application/json"
          },
          payload: {
            amount: parseFloat(paymentAmount),
            merchant_id: credentials.username,
            intent: credentials.intent
          },
          curl: `curl -X POST https://marchant.bohudurpay.com/api/payment-link \\
  -H "API-KEY: ${credentials.brandApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": ${paymentAmount},
    "merchant_id": "${credentials.username}",
    "intent": "${credentials.intent}"
  }'`
        };
      case "GET_payment_link":
        return {
          method: "GET",
          url: "https://marchant.bohudurpay.com/api/payment-link",
          headers: {
            "API-KEY": credentials.brandApiKey
          },
          payload: null,
          curl: `curl -X GET https://marchant.bohudurpay.com/api/payment-link \\
  -H "API-KEY: ${credentials.brandApiKey}"`
        };
      case "DELETE_payment_link":
        return {
          method: "DELETE",
          url: `https://marchant.bohudurpay.com/api/payment-link/${activeCreatedTx?.id || "BP7A8B9C0D1E2F3G"}`,
          headers: {
            "API-KEY": credentials.brandApiKey
          },
          payload: null,
          curl: `curl -X DELETE https://marchant.bohudurpay.com/api/payment-link/${activeCreatedTx?.id || "BP7A8B9C0D1E2F3G"} \\
  -H "API-KEY: ${credentials.brandApiKey}"`
        };
      default:
        return null;
    }
  };

  const apiDetails = getApiDetails();

  return (
    <div className="space-y-8" id="bkash-portal-root">
      {/* Dynamic Header */}
      <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-500/10 via-amber-500/5 to-transparent blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-pink-500 text-xs font-mono font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              bKash Merchant Core Platform
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-tight mt-1 uppercase">
              bKash & BohudurPay Portal
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Fully compliant unified checkout portal. Configured for premium tokenization agreements, real-time refunds, transaction offline webhooks, intent-mode management, and internal wallet-part vault transfers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0c101a] border border-white/10 px-4 py-3 rounded-2xl">
              <span className="text-[9px] font-mono text-slate-500 font-bold block uppercase tracking-wider">Collection Wallet</span>
              <span className="text-xl font-black text-amber-400 font-mono">৳ {wallet.collection.toLocaleString()} BDT</span>
            </div>
            <div className="bg-[#0c101a] border border-white/10 px-4 py-3 rounded-2xl">
              <span className="text-[9px] font-mono text-slate-500 font-bold block uppercase tracking-wider">Disbursement Wallet</span>
              <span className="text-xl font-black text-pink-400 font-mono">৳ {wallet.disbursement.toLocaleString()} BDT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid: Setup Credentials & Intent Configuration */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Credentials manager */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-mono font-black uppercase text-white tracking-wider">bKash Credentials</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Manage live auth variables securely in browser state storage.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">BohudurPay Brand API Key</label>
                <div className="relative">
                  <input
                    type="text"
                    value={credentials.brandApiKey}
                    onChange={(e) => setCredentials(prev => ({ ...prev, brandApiKey: e.target.value }))}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">bKash App Key</label>
                <input
                  type="text"
                  value={credentials.appKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, appKey: e.target.value }))}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">bKash App Secret</label>
                <input
                  type="password"
                  value={credentials.appSecret}
                  onChange={(e) => setCredentials(prev => ({ ...prev, appSecret: e.target.value }))}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Username</label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Password</label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Set Intent Mode */}
              <div className="bg-[#0c101a] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono text-white font-black uppercase tracking-wider block">Intent Mode</span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold block mt-0.5">Sale capture or Auth reservation</span>
                  </div>
                  <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setCredentials(prev => ({ ...prev, intent: "Sale" }))}
                      className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md transition-all ${
                        credentials.intent === "Sale" ? "bg-amber-500 text-black shadow" : "text-slate-400"
                      }`}
                    >
                      Sale
                    </button>
                    <button
                      type="button"
                      onClick={() => setCredentials(prev => ({ ...prev, intent: "Authorize" }))}
                      className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md transition-all ${
                        credentials.intent === "Authorize" ? "bg-pink-600 text-white shadow" : "text-slate-400"
                      }`}
                    >
                      Auth
                    </button>
                  </div>
                </div>
                
                {credentials.intent === "Authorize" && (
                  <div className="flex items-start gap-1.5 text-[9px] font-medium text-pink-300 bg-pink-950/20 border border-pink-500/10 p-2 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                    <span>In **Authorize** mode, bKash reserves the funds. Capture them manually via your terminal postbacks.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Webhook URL Endpoint</label>
                <input
                  type="text"
                  value={credentials.webhookUrl}
                  onChange={(e) => setCredentials(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Wallet internal transfer */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-pink-500" />
              <h2 className="text-sm font-mono font-black uppercase text-white tracking-wider">Internal Transfers</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Securely transfer liquidity between your wallet parts.
            </p>

            <form onSubmit={handleWalletTransfer} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2 bg-[#0c101a] border border-white/10 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTransferDirection("coll_to_disb")}
                  className={`text-[9px] font-mono font-black uppercase py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 leading-none ${
                    transferDirection === "coll_to_disb" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400"
                  }`}
                >
                  Collection ➔ Disb
                </button>
                <button
                  type="button"
                  onClick={() => setTransferDirection("disb_to_coll")}
                  className={`text-[9px] font-mono font-black uppercase py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 leading-none ${
                    transferDirection === "disb_to_coll" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" : "text-slate-400"
                  }`}
                >
                  Disb ➔ Collection
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Transfer Amount (BDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">৳</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all py-2.5 rounded-xl font-mono text-xs font-black uppercase cursor-pointer"
              >
                Execute Vault Transfer
              </button>
            </form>
          </div>

          {/* Disbursement Form */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-mono font-black uppercase text-white tracking-wider">bKash Disbursement</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Disburse instant rewards, ticket refunds or cashbacks directly to customer bKash wallets.
            </p>

            <form onSubmit={handleDisbursement} className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Recipient Phone Number</label>
                <input
                  type="text"
                  value={disbursePhone}
                  onChange={(e) => setDisbursePhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={disburseName}
                    onChange={(e) => setDisburseName(e.target.value)}
                    placeholder="e.g. Imran Khan"
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-sans outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Amount (BDT)</label>
                  <input
                    type="number"
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    placeholder="৳ 500"
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1b253b] hover:bg-[#253351] text-amber-400 border border-amber-500/20 transition-all py-2.5 rounded-xl font-mono text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Disburse to Wallet
              </button>
            </form>
          </div>

        </div>

        {/* Right Grid: Sandbox & Interactive Simulator + Agreements List */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Interactive Core Simulator Sandbox */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-mono font-black uppercase text-white tracking-wider">Checkout & API Sandbox</h2>
              </div>

              {/* Sandbox Tabs Toggle */}
              <div className="flex bg-[#0c101a] border border-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setSandboxTab("api")}
                  className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-tight transition-all cursor-pointer ${
                    sandboxTab === "api" ? "bg-amber-500 text-black font-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  API Terminal
                </button>
                <button
                  onClick={() => setSandboxTab("checkout_flow")}
                  className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-tight transition-all cursor-pointer ${
                    sandboxTab === "checkout_flow" ? "bg-pink-500 text-white font-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  bKash Checkout UI
                </button>
              </div>
            </div>

            {/* Sandbox Panel Container */}
            {sandboxTab === "api" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Form to create link payload */}
                  <div className="md:col-span-5 space-y-4">
                    <span className="text-[10px] font-mono text-amber-500 font-black uppercase tracking-wider block">1. Set Up Simulated Charge</span>
                    <form onSubmit={handleCreatePaymentLink} className="space-y-3 bg-[#0a0d16] border border-white/10 p-4 rounded-2xl">
                      <div>
                        <label className="text-[9px] font-mono text-slate-500 uppercase font-black block mb-1">Customer Full Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-mono text-slate-500 uppercase font-black block mb-1">Customer Email</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase font-black block mb-1">Amount (BDT)</label>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase font-black block mb-1">Order Ref</label>
                          <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black transition-all py-2 rounded-xl font-mono text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1.5 mt-3"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Create Payment Link
                      </button>
                    </form>

                    {activeCreatedTx && (
                      <div className="bg-[#0c101a] border border-amber-500/10 p-3 rounded-2xl space-y-2">
                        <span className="text-[9px] font-mono text-amber-500 font-black uppercase block">Simulated Link Active</span>
                        <p className="text-[10px] font-mono text-slate-300 break-all bg-black/40 p-2 rounded-lg border border-white/5">
                          {activeCreatedTx.paymentUrl}
                        </p>
                        <button
                          onClick={() => {
                            setSandboxTab("checkout_flow");
                            setCheckoutStep("number");
                          }}
                          className="w-full bg-pink-500 text-white font-mono text-[9px] font-black uppercase py-1.5 rounded-lg hover:bg-pink-600 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          Launch Checkout Screen (Payer)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Code Generator Sandbox */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-pink-500 font-black uppercase tracking-wider block">2. REST Endpoint Playground</span>
                      <select
                        value={selectedEndpoint}
                        onChange={(e) => setSelectedEndpoint(e.target.value)}
                        className="bg-[#0c101a] text-slate-300 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-mono outline-none focus:border-amber-500"
                      >
                        <option value="POST_create">POST /api/payment/create</option>
                        <option value="POST_verify">POST /api/payment/verify</option>
                        <option value="POST_payment_link">POST /api/payment-link (Brand Auth)</option>
                        <option value="GET_payment_link">GET /api/payment-link</option>
                        <option value="DELETE_payment_link">DELETE /api/payment-link/{`{id}`}</option>
                      </select>
                    </div>

                    {apiDetails && (
                      <div className="space-y-3">
                        {/* Headers and payload viewer */}
                        <div className="bg-[#0a0d16] border border-white/10 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                              apiDetails.method === "POST" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                              apiDetails.method === "GET" ? "bg-sky-500/15 text-sky-400 border border-sky-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            }`}>
                              {apiDetails.method}
                            </span>
                            <span className="text-[10px] font-mono text-slate-300 break-all">{apiDetails.url}</span>
                          </div>

                          {/* Curl code block */}
                          <div className="relative group bg-black/40 p-3 rounded-xl border border-white/5">
                            <button
                              onClick={() => copyToClipboard(apiDetails.curl, "cURL Code")}
                              className="absolute right-2 top-2 bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white p-1 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === "cURL Code" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                            <pre className="text-[9px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-36 pt-2 leading-relaxed">
                              {apiDetails.curl}
                            </pre>
                          </div>
                        </div>

                        {/* Simulated Server JSON response */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Live API Sandbox Server Response Payload:</span>
                          <div className="bg-[#0a0d16] border border-emerald-500/10 p-4 rounded-2xl relative">
                            <div className="absolute right-3 top-3 flex items-center gap-1 text-[8px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              HTTP 200 OK
                            </div>
                            <pre className="text-[9px] font-mono text-emerald-400 overflow-x-auto max-h-40 leading-relaxed">
                              {JSON.stringify(simulatedLinkResponse || {
                                status: 1,
                                message: "Simulation active. Use 'Create Payment Link' on left side first.",
                                example_endpoint: apiDetails.url
                              }, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* High fidelity interactive bKash checkout simulation */
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-full max-w-sm bg-gradient-to-b from-[#e2136e] to-[#b00b53] rounded-[24px] overflow-hidden shadow-2xl border border-pink-500/20">
                  {/* Top Bar with Logo & Info */}
                  <div className="bg-[#b00b53] px-5 py-4 flex items-center justify-between border-b border-pink-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center font-black text-pink-600 text-sm font-sans leading-none">
                        b
                      </div>
                      <span className="text-white text-[11px] font-mono uppercase tracking-[0.2em] font-black">bKash Checkout</span>
                    </div>
                    <span className="text-white/60 text-[9px] font-mono">BohudurPay Gateway</span>
                  </div>

                  {/* Body Content depending on current state */}
                  <div className="p-6 bg-white min-h-[220px] text-slate-800 flex flex-col justify-between">
                    {checkoutStep === "idle" ? (
                      <div className="text-center py-4 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
                          <CreditCard className="w-6 h-6 text-pink-600" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 uppercase">Awaiting simulated transaction</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                            Go to the **API Terminal** tab, create a payment link first, then you can launch the simulated payer payment screen here.
                          </p>
                        </div>
                        <button
                          onClick={() => setSandboxTab("api")}
                          className="bg-[#e2136e] text-white hover:bg-pink-700 transition-all font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase cursor-pointer"
                        >
                          Go to API Panel
                        </button>
                      </div>
                    ) : checkoutStep === "number" ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-black">Merchant: FIFA Hub</span>
                          <span className="text-xs font-mono font-black text-[#e2136e]">৳ {paymentAmount} BDT</span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Enter Your bKash Phone Number</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono font-bold">+880</span>
                            <input
                              type="text"
                              value={checkoutPhone}
                              onChange={(e) => setCheckoutPhone(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-3 py-2 text-xs font-mono outline-none focus:border-pink-500 text-slate-800"
                            />
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-500 leading-tight">
                          By confirming, you agree to secure tokenization terms. An OTP will be triggered for agreement registration.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={resetCheckoutState}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all py-2 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              if (checkoutPhone.length < 11) {
                                toast.error("Please enter a valid 11-digit bKash number.");
                                return;
                              }
                              setCheckoutStep("otp");
                            }}
                            className="w-full bg-[#e2136e] text-white hover:bg-pink-700 transition-all py-2 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Proceed
                          </button>
                        </div>
                      </div>
                    ) : checkoutStep === "otp" ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-[9px] font-mono text-[#e2136e] bg-pink-50 px-2 py-0.5 rounded-full font-black uppercase">OTP Verification</span>
                          <p className="text-[9px] text-slate-500 mt-1">Verification code sent to {checkoutPhone}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-slate-500 uppercase font-black block text-center">Enter 6-Digit OTP Code</label>
                          <input
                            type="text"
                            value={checkoutOtp}
                            onChange={(e) => setCheckoutOtp(e.target.value)}
                            placeholder="652899"
                            maxLength={6}
                            className="w-2/3 mx-auto text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm font-mono tracking-[0.4em] outline-none focus:border-pink-500 block text-slate-800"
                          />
                        </div>
                        <p className="text-[8px] text-slate-500 text-center">
                          Simulated code is **652899** (or any 6 numbers)
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => setCheckoutStep("number")}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all py-2 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => {
                              if (!checkoutOtp) {
                                toast.error("Please enter the OTP.");
                                return;
                              }
                              setCheckoutStep("pin");
                            }}
                            className="w-full bg-[#e2136e] text-white hover:bg-pink-700 transition-all py-2 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    ) : checkoutStep === "pin" ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-[9px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-black uppercase">Final Authorization</span>
                          <p className="text-[9px] text-slate-500 mt-1">Enter your secret bKash wallet PIN</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-slate-500 uppercase font-black block text-center">Enter 5-Digit PIN</label>
                          <input
                            type="password"
                            value={checkoutPin}
                            onChange={(e) => setCheckoutPin(e.target.value)}
                            maxLength={5}
                            placeholder="•••••"
                            className="w-1/2 mx-auto text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm font-mono tracking-[0.4em] outline-none focus:border-pink-500 block text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => setCheckoutStep("otp")}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all py-2 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleCompletePaymentSimulation}
                            className="w-full bg-pink-600 text-white hover:bg-pink-700 transition-all py-2 rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Confirm Pay
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 uppercase">PAYMENT COMPLETED</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                            Simulated purchase successful. Check your **Transactions ledger** below to verify capturing and active agreements.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            resetCheckoutState();
                            setActiveCreatedTx(null);
                          }}
                          className="bg-[#e2136e] text-white hover:bg-pink-700 transition-all font-mono text-[9px] font-bold px-4 py-1.5 rounded-lg uppercase cursor-pointer"
                        >
                          Finish & Close
                        </button>
                      </div>
                    )}
                  </div>

                  {/* bKash Footer dial panel */}
                  <div className="bg-[#b00b53] px-5 py-3 text-center text-white/60 text-[8px] font-mono">
                    Warning: Never share your bKash PIN or OTP.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active agreements tokenizer tracker (Mandatory requirement) */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-mono font-black uppercase text-white tracking-wider">Customer Agreements (bKash Tokenization)</h2>
              </div>
              <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                {agreements.length} Tokenized
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              View and delete client pre-authorized charge agreements (tokenized IDs for seamless billing).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 font-black uppercase">
                    <th className="pb-3 text-[9px] tracking-wider">Agreement Token ID</th>
                    <th className="pb-3 text-[9px] tracking-wider">Customer Name</th>
                    <th className="pb-3 text-[9px] tracking-wider">Customer bKash</th>
                    <th className="pb-3 text-[9px] tracking-wider">Authorized Date</th>
                    <th className="pb-3 text-[9px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500 italic">No customer agreements registered yet. complete a simulator checkout.</td>
                    </tr>
                  ) : (
                    agreements.map((a) => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 text-white font-bold">{a.id}</td>
                        <td className="py-3 text-slate-300 font-sans font-bold">{a.customerName}</td>
                        <td className="py-3 text-slate-400">{a.customerPhone}</td>
                        <td className="py-3 text-slate-500">{a.createdAt}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteAgreement(a.id)}
                            className="text-rose-400 hover:text-rose-300 transition-all font-bold uppercase text-[9px] flex items-center gap-1 ml-auto cursor-pointer bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg hover:bg-rose-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unified Ledger Log & Transactions History */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" />
                <h2 className="text-sm font-mono font-black uppercase text-white tracking-wider">Transaction Ledger Terminal</h2>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tx, order, name..."
                    className="bg-[#0a0d16] text-slate-300 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono outline-none focus:border-amber-500 w-44"
                  />
                </div>

                <div className="flex bg-[#0c101a] border border-white/10 p-1 rounded-xl">
                  {["ALL", "COMPLETED", "PENDING", "REFUNDED", "AUTHORIZE"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        statusFilter === filter ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ledger List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 font-black uppercase">
                    <th className="pb-3 text-[9px] tracking-wider">Transaction ID / Type</th>
                    <th className="pb-3 text-[9px] tracking-wider">Order ID</th>
                    <th className="pb-3 text-[9px] tracking-wider">Customer / Recipient</th>
                    <th className="pb-3 text-[9px] tracking-wider">Intent</th>
                    <th className="pb-3 text-[9px] tracking-wider">Amount</th>
                    <th className="pb-3 text-[9px] tracking-wider">Status</th>
                    <th className="pb-3 text-[9px] tracking-wider text-right">Refund / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 italic">No matching transactions found in BohudurPay merchant ledger.</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-white leading-none">{tx.id}</div>
                          <span className={`inline-block text-[8px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded-full leading-none ${
                            tx.type === "Collection" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 text-slate-300 font-bold">{tx.orderId}</td>
                        <td className="py-4">
                          <div className="text-slate-200 font-sans font-bold leading-none">{tx.customerName}</div>
                          <div className="text-[10px] text-slate-500 mt-1 leading-none">{tx.customerEmail}</div>
                        </td>
                        <td className="py-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                            {tx.intent}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`text-sm font-black font-mono ${
                            tx.type === "Collection" ? "text-amber-400" : "text-pink-400"
                          }`}>
                            ৳ {tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full leading-none ${
                            tx.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            tx.status === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                            tx.status === "Authorized" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {tx.status === "Completed" && tx.type === "Collection" ? (
                            <button
                              onClick={() => setSelectedTxForRefund(tx)}
                              className="text-amber-400 hover:text-amber-300 transition-all font-bold uppercase text-[9px] flex items-center gap-1 ml-auto cursor-pointer bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500/20"
                            >
                              <Undo2 className="w-3 h-3" />
                              Refund
                            </button>
                          ) : tx.status === "Pending" && tx.type === "Collection" ? (
                            <button
                              onClick={() => {
                                setActiveCreatedTx(tx);
                                setPaymentAmount(tx.amount.toString());
                                setCustomerName(tx.customerName);
                                setCustomerEmail(tx.customerEmail);
                                setSandboxTab("checkout_flow");
                                setCheckoutStep("number");
                              }}
                              className="text-pink-400 hover:text-pink-300 transition-all font-bold uppercase text-[9px] flex items-center gap-1 ml-auto cursor-pointer bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded-lg hover:bg-pink-500/20 animate-pulse"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {selectedTxForRefund && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121826] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Undo2 className="w-5 h-5 animate-pulse" />
                  <h3 className="text-sm font-mono font-black uppercase text-white tracking-widest">Execute bKash Refund</h3>
                </div>
                
                <div className="bg-[#0a0d16] border border-white/5 p-4 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono text-white font-bold">{selectedTxForRefund.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono text-white font-bold">{selectedTxForRefund.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refund Amount:</span>
                    <span className="font-mono text-amber-400 font-bold">৳ {selectedTxForRefund.amount.toLocaleString()} BDT</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase font-black block">Reason for Refund</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setSelectedTxForRefund(null)}
                    className="w-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all py-2.5 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeRefund}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black transition-all py-2.5 rounded-xl text-xs font-mono uppercase cursor-pointer"
                  >
                    Confirm Refund
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
