import { mnemonicNew, mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, TonClient, fromNano, internal, toNano } from "@ton/ton";
import { Address } from "@ton/core";

export interface GeneratedWallet {
  mnemonic: string[];
  address: string;
  publicKey: string;
  version: string;
}

const TON_API_URL = "https://toncenter.com/api/v2/jsonRPC";

/**
 * Generates a new TON wallet (V4R2)
 */
export async function createTonWallet(): Promise<GeneratedWallet> {
  // 1. Generate 24-word mnemonic
  const mnemonic = await mnemonicNew();

  // 2. Derive key pair from mnemonic
  const keyPair = await mnemonicToWalletKey(mnemonic);

  // 3. Create wallet contract (using V4R2 as it's the current standard)
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  return {
    mnemonic,
    address: wallet.address.toString({ bounceable: false, testOnly: false }),
    publicKey: keyPair.publicKey.toString("hex"),
    version: "v4r2",
  };
}

/**
 * Gets the balance of a TON address
 */
export async function getTonBalance(address: string): Promise<string> {
  try {
    const client = new TonClient({
      endpoint: TON_API_URL,
    });
    
    const actualBalance = await client.getBalance(Address.parse(address));
    return fromNano(actualBalance);
  } catch (error) {
    console.error("Error fetching TON balance:", error);
    return "0.00";
  }
}

/**
 * Transfers TON from a custodial wallet
 */
/**
 * Transfers TON from a custodial wallet
 */
export async function transferTon(
  mnemonic: string[],
  toAddress: string,
  amount: string
): Promise<string> {
  const client = new TonClient({
    endpoint: TON_API_URL,
  });

  const keyPair = await mnemonicToWalletKey(mnemonic);
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const contract = client.open(wallet);
  const seqno = await contract.getSeqno();

  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        value: toNano(amount),
        to: toAddress,
        body: "Transfer from FIFA Hub",
        bounce: false,
      }),
    ],
  });

  return `Transfer of ${amount} TON initiated. Seqno: ${seqno}`;
}

/**
 * Fetches recent transaction history for a TON address
 */
export async function getTonHistory(address: string) {
  try {
    const client = new TonClient({
      endpoint: TON_API_URL,
    });
    
    const transactions = await client.getTransactions(Address.parse(address), {
      limit: 10,
    });
    
    return transactions.map(tx => {
      const inMsg = tx.inMessage;
      let amount = "0";
      let type: 'in' | 'out' = 'in';

      if (inMsg && inMsg.info.type === 'internal') {
        amount = fromNano(inMsg.info.value.coins);
        type = 'in';
      } else {
        let totalOut = 0n;
        for (const [, outMsg] of tx.outMessages) {
           if (outMsg.info.type === 'internal') {
             totalOut += outMsg.info.value.coins;
           }
        }
        if (totalOut > 0n) {
          amount = fromNano(totalOut);
          type = 'out';
        }
      }

      return {
        id: tx.hash().toString('hex'),
        utime: tx.now,
        amount,
        type,
        lt: tx.lt.toString(),
        success: tx.description.type === 'generic' ? tx.description.computePhase.type === 'skipped' || tx.description.computePhase.success : true
      };
    });
  } catch (error) {
    console.error("Error fetching TON history:", error);
    return [];
  }
}
