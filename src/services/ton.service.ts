import { TonClient, Address, fromNano } from "@ton/ton";

const TON_API_URL = "https://toncenter.com/api/v2/jsonRPC";

export class TonService {
  private client: TonClient;

  constructor() {
    this.client = new TonClient({
      endpoint: TON_API_URL,
    });
  }

  /**
   * Fetches the current balance of a TON address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.client.getBalance(Address.parse(address));
      return fromNano(balance);
    } catch (error) {
      console.error("Error fetching TON balance:", error);
      throw error;
    }
  }

  /**
   * Fetches recent transaction history for a TON address
   */
  async fetchWalletHistory(address: string) {
    try {
      const transactions = await this.client.getTransactions(Address.parse(address), {
        limit: 15,
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
      throw error;
    }
  }

  /**
   * Transfers TON from a wallet
   */
  async sendTransfer(mnemonic: string[], toAddress: string, amount: string): Promise<string> {
    try {
      const { mnemonicToWalletKey } = await import("@ton/crypto");
      const { WalletContractV4, internal, toNano } = await import("@ton/ton");

      const keyPair = await mnemonicToWalletKey(mnemonic);
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
      });

      const contract = this.client.open(wallet);
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

      return seqno.toString();
    } catch (error) {
      console.error("Error sending TON transfer:", error);
      throw error;
    }
  }
}

export const tonService = new TonService();
