const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK with default credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * handleTelegramPayment
 * Secure webhook endpoint for Telegram Payments.
 * Verifies pre-checkout queries and processes successful payments via Firestore transactions.
 */
exports.handleTelegramPayment = functions.https.onRequest(async (req, res) => {
  // Method verification
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const update = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secretToken = process.env.TELEGRAM_SECRET_TOKEN;

  if (!botToken) {
    console.error("[Config] TELEGRAM_BOT_TOKEN is missing.");
    return res.status(500).send("Configuration Error");
  }

  // 1. Request Verification
  // Ensure the request originates from your trusted Telegram bot webhook configuration.
  if (secretToken && req.headers['x-telegram-bot-api-secret-token'] !== secretToken) {
    console.warn("[Security] Unauthorized request attempt detected.");
    return res.status(403).send("Unauthorized");
  }

  // 2. Verify Invoice / Pre-Checkout Query
  // Telegram sends this to check if the product is still available before charging the user.
  if (update.pre_checkout_query) {
    const preCheckoutId = update.pre_checkout_query.id;
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: preCheckoutId,
          ok: true
        })
      });

      const data = await response.json();
      if (!data.ok) {
        console.error("[Telegram API] Failed to answer pre-checkout:", data);
        return res.status(500).send("Verification failed");
      }

      return res.status(200).send({ status: 'ok' });
    } catch (err) {
      console.error("[System Error] Verification flow failed:", err);
      return res.status(500).send("Internal processing error");
    }
  }

  // 2. Handle Successful Payment Notification
  const successfulPayment = update.message?.successful_payment;
  if (successfulPayment) {
    const providerChargeId = successfulPayment.provider_payment_charge_id;
    
    if (!providerChargeId) {
      console.error("[Payload Error] No provider_payment_charge_id found.");
      return res.status(400).send("Invalid charge metadata");
    }

    try {
      const payload = JSON.parse(successfulPayment.invoice_payload);
      const { userId, planId } = payload;

      if (!userId) {
        console.error("[Payload Error] No userId in successful_payment payload.");
        return res.status(400).send("Missing identity");
      }

      const db = admin.firestore();
      const userRef = db.collection('users').doc(userId);
      const paymentRef = db.collection('processed_payments').doc(providerChargeId);

      // 3. EXECUTE SECURE FIRESTORE TRANSACTION WITH DEDUPLICATION
      // Atomically check if this charge has been processed, then approve the user.
      await db.runTransaction(async (transaction) => {
        const [userSnapshot, paymentSnapshot] = await Promise.all([
          transaction.get(userRef),
          transaction.get(paymentRef)
        ]);
        
        if (paymentSnapshot.exists) {
          console.log(`[Deduplication] Payment ${providerChargeId} already processed for user ${userId}.`);
          return; // Idempotent success
        }

        if (!userSnapshot.exists) {
          throw new Error(`User ${userId} record not found.`);
        }

        // Record the payment to prevent future duplicates
        transaction.set(paymentRef, {
          userId,
          amount: successfulPayment.total_amount,
          currency: successfulPayment.currency,
          telegramChargeId: successfulPayment.telegram_payment_charge_id,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Approve the user
        transaction.update(userRef, {
          isApproved: true,
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          planId: planId || 'premium_hub',
          subscriptionActive: true,
          paymentStatus: 'confirmed',
          lastTransaction: {
            amount: successfulPayment.total_amount,
            currency: successfulPayment.currency,
            chargeId: successfulPayment.telegram_payment_charge_id,
            providerChargeId: providerChargeId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          }
        });
      });

      console.log(`[Transaction Success] User ${userId} tactical access approved (Charge: ${providerChargeId}).`);
      return res.status(200).send({ status: 'success' });
    } catch (err) {
      console.error("[Transaction Failure] Failed to securely update user:", err);
      return res.status(500).send("Database transaction failure");
    }
  }

  // Acknowledge other events (e.g. standard messages) to prevent Telegram retries
  return res.status(200).send({ status: 'ignored' });
});
