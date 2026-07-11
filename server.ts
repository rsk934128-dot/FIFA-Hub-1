import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { google } from "googleapis";
import dotenv from "dotenv";
import Stripe from "stripe";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
import { createTonWallet } from "./src/lib/ton.js";
import { tonService } from "./src/services/ton.service.js";

dotenv.config();

const DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';

// Initialize Firebase Admin if Service Account is provided
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT not found. Notification sending will be mocked.");
  }
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}

// Lazy initialize Stripe for production readiness
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log("Stripe Engine initialized successfully.");
  }
} catch (e) {
  console.error("Stripe initialization skipped: Missing or invalid key.");
}

// Helper to clean Gemini JSON responses (removes markdown backticks)
function cleanJsonResponse(text: string | null | undefined) {
  if (!text) return "";
  return text.replace(/```json|```/g, "").trim();
}

// Create the express app
async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Stripe Configuration Endpoint
  app.get("/api/config", (req, res) => {
    res.send({
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    });
  });

  // Create Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not initialized" });
    }

    const { priceId, successUrl, cancelUrl } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: priceId || 'price_default', 
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${process.env.APP_URL || 'http://localhost:3000'}/?status=success`,
        cancel_url: cancelUrl || `${process.env.APP_URL || 'http://localhost:3000'}/?status=cancel`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Session Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
  // --- API ROUTE: Telegram Payments API: Create Invoice Link ---
  app.post("/api/payments/telegram/create-invoice", async (req, res) => {
    const { userId, planId, amount, currency = "USD" } = req.body;
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const providerToken = process.env.TELEGRAM_STRIPE_TOKEN; // Stripe Test Provider Token from BotFather
    
    if (!botToken || botToken === "MY_BOT_TOKEN") {
      // Mock invoice link for development
      console.warn("TELEGRAM_BOT_TOKEN missing. Providing mock invoice link.");
      return res.json({ 
        url: "https://t.me/invoice/mock_link_" + Math.random().toString(36).substring(7),
        mock: true 
      });
    }

    try {
      // Telegram createInvoiceLink API
      // For Stars (XTR), provider_token should be empty
      const isStars = currency === "XTR";
      
      const payload = JSON.stringify({ userId, planId, timestamp: Date.now() });
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `FIFA Hub: ${planId.toUpperCase()} Access`,
          description: `Unlock Elite Tactical Insights and Scouting Deck for ${planId}`,
          payload: payload,
          provider_token: isStars ? "" : (providerToken || ""),
          currency: currency,
          prices: [{ label: "Access Fee", amount: amount }], // Amount is in smallest units (cents for USD, whole for Stars)
          need_name: true,
          need_email: true,
          send_email_to_provider: true,
          is_flexible: false
        })
      });
      
      const data = await response.json() as any;
      if (data.ok) {
        res.json({ url: data.result });
      } else {
        console.error("Telegram API Error:", data);
        res.status(500).json({ error: data.description || "Failed to create invoice link" });
      }
    } catch (error: any) {
      console.error("Telegram Invoice Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- API ROUTE: Send Match Notification ---
  app.post("/api/notifications/match-event", async (req, res) => {
    const { userId, title, body, data } = req.body;
    
    // Check if user has any tokens
    if (getApps().length === 0) {
      console.log("[Mock FCM] Sending to", userId, ":", title, "-", body);
      return res.json({ success: true, mock: true });
    }

    try {
      // Get the user's tokens from Firestore
      const dbAdmin = getFirestore(DATABASE_ID);
      const tokensSnapshot = await dbAdmin.collection('users').doc(userId).collection('fcm_tokens').get();
      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

      if (tokens.length === 0) {
        return res.json({ success: false, error: "No tokens found for user" });
      }

      const message = {
        notification: { title, body },
        data: data || {},
        tokens: tokens
      };

      const response = await getMessaging().sendEachForMulticast(message);
      res.json({ success: true, response });
    } catch (error: any) {
      console.error("FCM Send Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- API ROUTE: Generate TON Wallet ---
  app.post("/api/wallet/generate", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      const dbAdmin = getFirestore(DATABASE_ID);
      const userRef = dbAdmin.collection('users').doc(userId);
      
      const userDoc = await userRef.get();
      if (userDoc.exists && userDoc.data()?.wallet) {
        return res.json({ wallet: userDoc.data()?.wallet, existing: true });
      }

      const walletData = await createTonWallet();
      
      const wallet = {
        address: walletData.address,
        publicKey: walletData.publicKey,
        version: walletData.version,
        createdAt: new Date().toISOString(),
        mnemonic: walletData.mnemonic 
      };

      await userRef.set({ wallet }, { merge: true });

      res.json({ wallet, existing: false });
    } catch (error: any) {
      console.error("Wallet Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- API ROUTE: Get TON Balance ---
  app.post("/api/wallet/balance", async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "address is required" });

    try {
      const balance = await tonService.getBalance(address);
      res.json({ balance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- API ROUTE: Transfer TON ---
  app.post("/api/wallet/transfer", async (req, res) => {
    const { userId, toAddress, amount } = req.body;
    if (!userId || !toAddress || !amount) {
      return res.status(400).json({ error: "userId, toAddress, and amount are required" });
    }

    try {
      const dbAdmin = getFirestore(DATABASE_ID);
      const userRef = dbAdmin.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      const wallet = userDoc.data()?.wallet;
      if (!wallet || !wallet.mnemonic) {
        return res.status(404).json({ error: "Wallet not found for this user" });
      }

      const result = await tonService.sendTransfer(wallet.mnemonic, toAddress, amount);
      res.json({ success: true, message: `Transfer of ${amount} TON initiated. Seqno: ${result}` });
    } catch (error: any) {
      console.error("Transfer Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- API ROUTE: Get TON History ---
  app.post("/api/wallet/history", async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "address is required" });

    try {
      const history = await tonService.fetchWalletHistory(address);
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize Gemini if key exists
  let ai: GoogleGenAI | null = null;
  const MODEL_NAME = "gemini-3.5-flash"; // Recommended model as per latest skill

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log(`Gemini API Client successfully initialized with model: ${MODEL_NAME}`);
    } catch (e) {
      console.error("Failed to initialize Gemini Client: ", e);
    }
  } else {
    console.log("No valid GEMINI_API_KEY found or default placeholder detected. Using high-fidelity local simulator.");
  }

  // Cooldown variables for resilient model circuit breaker
  let isGeminiCooldown = false;
  let isGeminiCooldownStartTime = 0;
  const COOLDOWN_DURATION = 1000 * 60 * 2; // 2 minutes cooldown

  // Centralized safe content generation helper with self-healing fallback mechanisms
  async function safeGenerateContent(contents: string | any, schema?: any, systemInstruction?: string) {
    if (!ai) return null;

    if (isGeminiCooldown) {
      if (Date.now() - isGeminiCooldownStartTime < COOLDOWN_DURATION) {
        console.log(`[Resilience Engine] Gemini is currently on cooldown due to recent failures. Skipping call to prevent lag.`);
        return null;
      } else {
        isGeminiCooldown = false;
      }
    }

    // Prioritized list of non-deprecated models allowed in this environment
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: schema ? "application/json" : "text/plain",
            responseSchema: schema,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
          }
        });
        if (response && response.text) {
          if (model !== candidateModels[0]) {
            console.log(`[Resilience Engine] Primary model failed, but successfully recovered using fallback model: ${model}`);
          }
          return response.text;
        }
      } catch (error: any) {
        lastError = error;
        const errMsg = String(error?.message || error || "").toLowerCase();
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("denied") || errMsg.includes("403")) {
          isGeminiCooldown = true;
          isGeminiCooldownStartTime = Date.now();
          console.log(`[Resilience Engine] API quota limit or authorization issue detected. Cooldown activated. Seamlessly using local simulator.`);
          break;
        } else {
          console.log(`[Resilience Engine] Call to model ${model} did not succeed.`);
        }
      }
    }

    if (!isGeminiCooldown && lastError) {
      console.log("[Resilience Engine] All candidate Gemini models exhausted.");
    }
    return null;
  }

  // Centralized safe content generation helper with Google Search grounding
  async function safeGenerateGroundedContent(contents: string, schema?: any, systemInstruction?: string) {
    if (!ai) return null;

    if (isGeminiCooldown) {
      if (Date.now() - isGeminiCooldownStartTime < COOLDOWN_DURATION) {
        console.log(`[Resilience Engine] Gemini is currently on cooldown due to recent failures. Skipping grounded call to prevent lag.`);
        return null;
      } else {
        isGeminiCooldown = false;
      }
    }

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: schema ? "application/json" : "text/plain",
            responseSchema: schema,
            tools: [{ googleSearch: {} }],
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
          }
        });
        if (response) {
          if (model !== candidateModels[0]) {
            console.log(`[Resilience Engine] Primary model failed for search grounding, but successfully recovered using fallback model: ${model}`);
          }
          return response;
        }
      } catch (error: any) {
        lastError = error;
        const errMsg = String(error?.message || error || "").toLowerCase();
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("denied") || errMsg.includes("403")) {
          isGeminiCooldown = true;
          isGeminiCooldownStartTime = Date.now();
          console.log(`[Resilience Engine] Grounding API quota limit or authorization issue detected. Cooldown activated. Seamlessly using local simulator.`);
          break;
        } else {
          console.log(`[Resilience Engine] Grounded call to model ${model} did not succeed.`);
        }
      }
    }

    if (!isGeminiCooldown && lastError) {
      console.log("[Resilience Engine] All candidate grounded Gemini models exhausted.");
    }
    return null;
  }

  // Caching for news and ticker to avoid hitting quota
  let newsCache: { data: any, timestamp: number } | null = null;
  let tickerCache: { data: any, timestamp: number } | null = null;
  let quizCache: { data: any, timestamp: number } | null = null;
  let groundedNewsCache: { data: any, timestamp: number } | null = null;
  const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
  const IMAGE_CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  const imageSearchCache: Record<string, { url: string, timestamp: number }> = {};

  // --- API ROUTE: Unsplash Proxy ---
  app.get("/api/unsplash-search", async (req, res) => {
    const { query } = req.query;
    const searchQuery = query ? String(query) : "football";
    
    if (imageSearchCache[searchQuery] && (Date.now() - imageSearchCache[searchQuery].timestamp < IMAGE_CACHE_DURATION)) {
      return res.json({ url: imageSearchCache[searchQuery].url });
    }

    const accessKey = process.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.json({ url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000" });
    }

    try {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery + " football")}&per_page=1&orientation=landscape`, {
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });
      const data = await response.json() as any;
      const imageUrl = data.results?.[0]?.urls?.regular || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000";
      
      imageSearchCache[searchQuery] = { url: imageUrl, timestamp: Date.now() };
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Unsplash API Error:", error);
      res.json({ url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000" });
    }
  });

  // --- API ROUTE: Get News ---
  app.get("/api/football-news", async (req, res) => {
    // Check cache
    if (newsCache && (Date.now() - newsCache.timestamp < CACHE_DURATION)) {
      return res.json(newsCache.data);
    }

    if (ai) {
      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique article ID" },
            title: { type: Type.STRING, description: "Engaging headline" },
            category: { type: Type.STRING, description: "Category like Transfer, Tournament, Statement, Analysis" },
            summary: { type: Type.STRING, description: "1-sentence summary" },
            content: { type: Type.STRING, description: "Full news article contents (2-3 paragraphs)" },
            date: { type: Type.STRING, description: "Formatted date like June 24, 2026" },
            imageSeed: { type: Type.STRING, description: "One word like football, stadium, jersey, boots, goalie, pitch, trophy, manager, crowd" },
            source: { type: Type.STRING, description: "Source name like FIFA Hub News, Global Football" }
          },
          required: ["id", "title", "category", "summary", "content", "date", "imageSeed", "source"]
        }
      };

      const resultText = await safeGenerateContent(
        "Generate 5 exciting and realistic football news articles. Include items about international tournaments, transfer gossip, tactician statements, or underdog stories. Ensure they feel contemporary (set in 2026). Make some specific to global and Asian football contexts.",
        schema
      );

      if (resultText) {
        try {
          const news = JSON.parse(cleanJsonResponse(resultText));
          const result = news.map((item: any) => ({ ...item, engine: "gemini" }));
          newsCache = { data: result, timestamp: Date.now() };
          return res.json(result);
        } catch (error) {
          console.warn("Failed to parse Gemini news JSON:", error);
        }
      }
    }

    // High quality offline fallback articles
    const localNews = [
      {
        id: "fb-news-1",
        title: "The 2026 FIFA World Cup Countdown: Final Team Tactics Revealed",
        category: "Tournament",
        summary: "Nations around the globe finalize their defensive alignments and high-pressing routines as pre-tournament friendlies wrap up.",
        content: "As the football world pivots towards the highly anticipated tournament stage, leading tacticians are solidifying their core setups. High-intensity pressing and fluid 4-3-3 transitions have emerged as the dominant schemes among European and South American favorites, with teams experimenting with deeper, compact midfields to counter sudden breakaways. Tactical analysis shows a record level of defensive readiness as teams aim to shut down space in the critical middle zone.",
        date: "June 24, 2026",
        imageSeed: "stadium",
        source: "FIFA Hub Sports"
      },
      {
        id: "fb-news-2",
        title: "Midnight Marvel: Emerging Talents Set to Shake Up the Transfer Market",
        category: "Transfer",
        summary: "Scouts pinpoint three highly promising wingers whose exceptional performances have ignited bidding wars among elite clubs.",
        content: "A wave of dynamic, creative wingers has caught the eye of top scouting departments. Known for high progressive carry rates and explosive acceleration, these young stars are driving major valuation spikes. Club negotiators are already preparing high-budget proposals to secure long-term signatures ahead of the pre-season window, anticipating intense competition in the transfer market.",
        date: "June 23, 2026",
        imageSeed: "football",
        source: "Transfer Insider"
      },
      {
        id: "fb-news-3",
        title: "Tactical Deep-Dive: How Hybrid Midfielders Command the Modern Pitch",
        category: "Analysis",
        summary: "An exploration of box-to-box creators who manage defensive recoveries while unlocking opponent low blocks.",
        content: "The evolution of the modern midfielder shows a clear shift away from pure single-role players. Today's command generals must match rigorous ball-recovery counts with surgical progressive passing. By stepping up to break down low blocks while simultaneously anchoring fast recovery sprints, these hybrid players have become the central nodes around which contemporary matches succeed or fail.",
        date: "June 22, 2026",
        imageSeed: "jersey",
        source: "Tactical Board"
      },
      {
        id: "fb-news-4",
        title: "Underdog Journeys: National Squads Inspiring the Next Generation of Fans",
        category: "Tournament",
        summary: "A heartfelt look at smaller nations breaking tournament records and challenging historically dominant forces.",
        content: "There is nothing more magical in football than seeing unfancied teams disrupt established hierarchies. This season, several rising squads have demonstrated that defensive synergy, collective work-rate, and relentless counter-attacking can neutralize superior individual talent. Their inspiring runs have ignited national fan celebrations and proved that strategic discipline can bridge any resource gap.",
        date: "June 21, 2026",
        imageSeed: "boots",
        source: "Global Football"
      }
    ];
    res.json(localNews.map(n => ({ ...n, engine: "fallback" as const })));
  });

  // --- API ROUTE: Get Grounded Headlines using Google Search Grounding ---
  app.get("/api/grounded-headlines", async (req, res) => {
    // Check cache
    if (groundedNewsCache && (Date.now() - groundedNewsCache.timestamp < CACHE_DURATION)) {
      return res.json(groundedNewsCache.data);
    }

    if (ai) {
      try {
        const query = "Provide 5 of the absolute latest, real-world football (soccer) news and transfer updates from the last few days. For each article, write a highly descriptive and engaging real-world headline, set the category (Transfer, Match, Tournament, or Injury), a 1-sentence summary, a detailed 2-3 paragraph content writeup, the correct formatted current date in 2026, a suitable imageSeed (football, stadium, jersey, boots, goalie, pitch, trophy, manager, crowd), and a real-world sports news publisher source (e.g., Sky Sports, BBC Sport, ESPN, Fabrizio Romano). Make sure they are real, actual current events grounded in search!";

        const schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique article ID like gh-news-1, gh-news-2, etc." },
              title: { type: Type.STRING, description: "Latest real-world grounded football headline" },
              category: { type: Type.STRING, description: "Transfer, Match, Tournament, or Injury" },
              summary: { type: Type.STRING, description: "1-sentence summary" },
              content: { type: Type.STRING, description: "Full detailed news writeup (2-3 paragraphs)" },
              date: { type: Type.STRING, description: "Today's date or very recent date in 2026" },
              imageSeed: { type: Type.STRING, description: "One of: football, stadium, jersey, boots, goalie, pitch, trophy, manager, crowd" },
              source: { type: Type.STRING, description: "Real source name (e.g. Sky Sports, BBC Sport)" }
            },
            required: ["id", "title", "category", "summary", "content", "date", "imageSeed", "source"]
          }
        };

        const response = await safeGenerateGroundedContent(query, schema);

        if (response) {
          // Extract sources
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const sources = chunks ? chunks.map((c: any) => ({
            title: c.web?.title || "Search Reference",
            url: c.web?.uri || ""
          })).filter((s: any) => s.url) : [];

          let articles = [];
          if (response.text) {
            articles = JSON.parse(cleanJsonResponse(response.text));
          }

          const groundedArticles = articles.map((art: any, index: number) => {
            // Attribute relevant sources to each article
            const startIdx = index * 2;
            const endIdx = (index + 1) * 2;
            const articleSources = sources.slice(startIdx, endIdx).length > 0 
              ? sources.slice(startIdx, endIdx) 
              : sources.slice(0, 3);

            return {
              ...art,
              engine: "grounded" as const,
              sources: articleSources
            };
          });

          const result = {
            articles: groundedArticles,
            allSources: sources
          };

          groundedNewsCache = { data: result, timestamp: Date.now() };
          return res.json(result);
        }
      } catch (err: any) {
        console.error("Grounded news generation failed, using high-fidelity local simulator:", err);
      }
    }

    // High quality fallback with genuine real-world sources and links
    const localGrounded = {
      articles: [
        {
          id: "gh-news-1",
          title: "Erling Haaland's Agent Reaffirms Commitment Amid Summer Transfer Speculation",
          category: "Transfer",
          summary: "Official statement confirms Norway's premier striker plans to remain with Manchester City despite heavy links to major European suitors.",
          content: "Speculation surrounding Erling Haaland's future has been put to rest by his agent, who released an official statement reaffirming the striker's long-term commitment. Following intense rumors of a potential block-buster move to Paris Saint-Germain or Real Madrid, the player's camp clarified that Haaland is fully focused on achieving more silverware under Pep Guardiola. Real-world publications report Manchester City is preparing a contract extension to secure his presence for the next several seasons.",
          date: "June 29, 2026",
          imageSeed: "jersey",
          source: "Sky Sports",
          engine: "fallback",
          sources: [
            { title: "Sky Sports Transfer Centre", url: "https://www.skysports.com/football/transfer-paper-talk" },
            { title: "Fabrizio Romano on Twitter/X", url: "https://x.com/FabrizioRomano" }
          ]
        },
        {
          id: "gh-news-2",
          title: "Kylian Mbappé Reflects on National Team Leadership After Crucial Match",
          category: "Match",
          summary: "France captain emphasizes squad unity and defensive improvements after securing a hard-fought tournament win.",
          content: "Kylian Mbappé has praised his teammates' tactical adaptability after leading France to a crucial victory in international competition. Speaking to reporters post-match, Mbappé noted that the team's strategic defensive shifts in the second half were critical to neutralising their opponents' high-press. Analysts from major sports channels have lauded Mbappé's tactical maturity as leader of the new-look squad.",
          date: "June 28, 2026",
          imageSeed: "stadium",
          source: "BBC Sport",
          engine: "fallback",
          sources: [
            { title: "BBC Sport - Football Section", url: "https://www.bbc.co.uk/sport/football" }
          ]
        },
        {
          id: "gh-news-3",
          title: "Jamal Musiala Set to Extend Contract with Bayern Munich After Advanced Talks",
          category: "Transfer",
          summary: "German playmaker chooses to commit his future to the Bavarian giants following positive talks over a record-breaking deal.",
          content: "In what is shaping up to be the biggest deal of the pre-season, Jamal Musiala has reportedly reached a verbal agreement with Bayern Munich for a new five-year contract extension. According to reliable news outlets, the deal will elevate the young midfielder into the club's top-earning tier. The move shuts down long-standing interest from top Premier League clubs who were eager to secure the dynamic creator's services.",
          date: "June 27, 2026",
          imageSeed: "football",
          source: "ESPN FC",
          engine: "fallback",
          sources: [
            { title: "ESPN Football News", url: "https://www.espn.com/soccer/" }
          ]
        },
        {
          id: "gh-news-4",
          title: "Lamine Yamal Sparks Tactical Redesign as Clubs Prep for Next-Gen Wingers",
          category: "Analysis",
          summary: "Tacticians study the teenagers' elite positioning and dribbling metrics to adapt modern defensive block heights.",
          content: "Lamine Yamal's meteoric rise continues to dictate how top managers structure their defensive systems. A detailed study of his high-volume progressive carries and central link-ups reveals why traditional block heights fail to contain hybrid wingers. Strategic analysis boards are now suggesting a move to double-wide fullback coverages to prevent isolation on the wings.",
          date: "June 26, 2026",
          imageSeed: "boots",
          source: "The Athletic",
          engine: "fallback",
          sources: [
            { title: "The Athletic Tactical Analysis", url: "https://theathletic.com" }
          ]
        }
      ],
      allSources: [
        { title: "Sky Sports Transfer Centre", url: "https://www.skysports.com/football/transfer-paper-talk" },
        { title: "Fabrizio Romano on Twitter/X", url: "https://x.com/FabrizioRomano" },
        { title: "BBC Sport - Football Section", url: "https://www.bbc.co.uk/sport/football" },
        { title: "ESPN Football News", url: "https://www.espn.com/soccer/" },
        { title: "The Athletic Football", url: "https://theathletic.com" }
      ]
    };

    res.json(localGrounded);
  });

  // --- API ROUTE: Get News Ticker ---
  app.get("/api/news-ticker", async (req, res) => {
    // Check cache
    if (tickerCache && (Date.now() - tickerCache.timestamp < CACHE_DURATION)) {
      return res.json(tickerCache.data);
    }

    if (ai) {
      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["BREAKING", "TRANSFER", "RUMOR"] }
          },
          required: ["id", "text", "type"]
        }
      };

      const resultText = await safeGenerateContent(
        "Generate 10 short football news ticker items. Types: BREAKING, TRANSFER, RUMOR. Keep them under 80 characters. Set in June 2026.",
        schema
      );

      if (resultText) {
        try {
          const result = JSON.parse(cleanJsonResponse(resultText));
          tickerCache = { data: result, timestamp: Date.now() };
          return res.json(result);
        } catch (error) {
          console.warn("Failed to parse Gemini ticker JSON:", error);
        }
      }
    }

    const fallbackTicker = [
      { id: "t1", text: "BREAKING: Global star agrees personal terms for record-breaking summer move.", type: "BREAKING" },
      { id: "t2", text: "TRANSFER: Rising Asian talent signs 5-year deal with European giants.", type: "TRANSFER" },
      { id: "t3", text: "RUMOR: Veteran keeper considering retirement after tournament finale.", type: "RUMOR" },
      { id: "t4", text: "BREAKING: Stadium expansion plans approved ahead of 2027 season.", type: "BREAKING" },
      { id: "t5", text: "TRANSFER: Midfield general completes medical ahead of official unveiling.", type: "TRANSFER" },
      { id: "t6", text: "RUMOR: Top manager spotted in talks with struggling national side.", type: "RUMOR" },
      { id: "t7", text: "BREAKING: Key striker ruled out of group stage following training injury.", type: "BREAKING" },
      { id: "t8", text: "TRANSFER: Defensive anchor moves for undisclosed fee in shock deadline day deal.", type: "TRANSFER" }
    ];
    res.json(fallbackTicker);
  });

  // --- API ROUTE: Scout Team ---
  app.post("/api/scout-team", async (req, res) => {
    const { country } = req.body;
    const countryName = country || "Argentina";

    if (ai) {
      const schema = {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          formation: { type: Type.STRING, description: "e.g. 4-3-3 or 4-2-3-1" },
          styleOfPlay: { type: Type.STRING, description: "2-3 sentences explaining play style" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          tacticalRating: { type: Type.INTEGER, description: "Overall rating 1 to 100" },
          defenseRating: { type: Type.INTEGER, description: "Defense rating 1 to 100" },
          attackRating: { type: Type.INTEGER, description: "Attack rating 1 to 100" },
          midfieldRating: { type: Type.INTEGER, description: "Midfield rating 1 to 100" },
          keyPlayers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                number: { type: Type.INTEGER },
                position: { type: Type.STRING, description: "GK, DEF, MID, FWD" },
                role: { type: Type.STRING, description: "e.g. Creative Playmaker, Anchor, Poacher" },
                heatmap: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.INTEGER },
                      y: { type: Type.INTEGER },
                      intensity: { type: Type.NUMBER }
                    },
                    required: ["x", "y", "intensity"]
                  }
                }
              },
              required: ["name", "number", "position", "role", "heatmap"]
            }
          },
          lineup: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Player Last Name" },
                position: { type: Type.STRING, description: "e.g. GK, CB, LB, RB, CM, CDM, RW, LW, ST" },
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER }
              },
              required: ["name", "position", "x", "y"]
            }
          }
        },
        required: ["country", "formation", "styleOfPlay", "strengths", "weaknesses", "tacticalRating", "defenseRating", "attackRating", "midfieldRating", "keyPlayers", "lineup"]
      };

      const resultText = await safeGenerateContent(
        `Create a comprehensive and realistic tactical scouting report for the national football team of: ${countryName}.
Provide detailed lineups, positions, strengths, weaknesses, ratings, playstyle, and standard players.
Include exact (x, y) coordinates for 11 players on a tactical pitch visualizer.
X coordinate ranges from 0 to 100 (where 0 is left wing, 100 is right wing, 50 is center).
Y coordinate ranges from 0 to 100 (where 10 is goalkeeper at the bottom, and 90 is forward at the top).
Ensure the lineup layout perfectly reflects their actual formation (e.g. 4-3-3, 3-5-2, 4-2-3-1, or 4-4-2).`,
        schema
      );

      if (resultText) {
        try {
          const report = JSON.parse(cleanJsonResponse(resultText));
          return res.json({ ...report, engine: "gemini" });
        } catch (error) {
          console.warn("Failed to parse Gemini scouting JSON:", error);
        }
      }
    }

    // High fidelity offline fallback scouting data for common requests
    const defaultReports: Record<string, any> = {
      "argentina": {
        country: "Argentina",
        formation: "4-3-3",
        styleOfPlay: "High-possession fluid attacking. Build-up operates through the central areas with quick short passing interchanges, combined with aggressive counter-pressing upon losing possession.",
        strengths: ["World-class creative passing", "Exceptional close-control dribbling", "Highly resilient midfield holding", "Clinical finishing in box"],
        weaknesses: ["Vulnerability to direct counter-attacks", "Aerial vulnerability on set pieces", "Aging core defense"],
        tacticalRating: 92,
        defenseRating: 88,
        attackRating: 94,
        midfieldRating: 93,
        keyPlayers: [
          { name: "Lionel Messi", number: 10, position: "FWD", role: "Trequartista & Playmaker", heatmap: [{x:70,y:60,intensity:0.8},{x:75,y:65,intensity:0.9},{x:80,y:70,intensity:1.0},{x:72,y:55,intensity:0.7},{x:65,y:62,intensity:0.6},{x:78,y:68,intensity:0.9}] },
          { name: "Lautaro Martínez", number: 22, position: "FWD", role: "Pressing Forward", heatmap: [{x:50,y:80,intensity:0.9},{x:55,y:85,intensity:1.0},{x:45,y:75,intensity:0.8},{x:50,y:90,intensity:0.7},{x:52,y:82,intensity:1.0}] },
          { name: "Alexis Mac Allister", number: 20, position: "MID", role: "Box-to-Box Creator", heatmap: [{x:40,y:50,intensity:0.9},{x:35,y:55,intensity:1.0},{x:45,y:45,intensity:0.8},{x:38,y:48,intensity:0.7},{x:42,y:52,intensity:1.0}] },
          { name: "Emiliano Martínez", number: 23, position: "GK", role: "Elite Shot Stopper", heatmap: [{x:50,y:10,intensity:1.0},{x:50,y:15,intensity:0.8},{x:45,y:12,intensity:0.7},{x:55,y:12,intensity:0.7}] }
        ],
        lineup: [
          { name: "E. Martínez", position: "GK", x: 50, y: 12 },
          { name: "Molina", position: "RB", x: 82, y: 32 },
          { name: "Romero", position: "CB", x: 62, y: 28 },
          { name: "Otamendi", position: "CB", x: 38, y: 28 },
          { name: "Tagliafico", position: "LB", x: 18, y: 32 },
          { name: "De Paul", position: "CM", x: 65, y: 50 },
          { name: "Enzo F.", position: "CDM", x: 50, y: 44 },
          { name: "Mac Allister", position: "CM", x: 35, y: 50 },
          { name: "Messi", position: "RW", x: 75, y: 72 },
          { name: "Lautaro", position: "ST", x: 50, y: 82 },
          { name: "Álvarez", position: "LW", x: 25, y: 72 }
        ]
      },
      "brazil": {
        country: "Brazil",
        formation: "4-2-3-1",
        styleOfPlay: "Expressive attacking with rapid wing transitions. Utilizes highly creative wingers to isolate defenders in 1v1 situations, backed by double defensive pivots for stability.",
        strengths: ["Explosive wing pace", "Surgical dribbling in wide areas", "High defensive shielding", "Dynamic full-backs"],
        weaknesses: ["Over-commitment in attack", "Slowing tempo against low blocks", "Midfield gaps on quick turnovers"],
        tacticalRating: 91,
        defenseRating: 87,
        attackRating: 93,
        midfieldRating: 90,
        keyPlayers: [
          { name: "Vinícius Júnior", number: 7, position: "FWD", role: "Explosive Inside Winger", heatmap: [{x:20,y:70,intensity:0.9},{x:25,y:75,intensity:1.0},{x:30,y:80,intensity:0.8},{x:22,y:65,intensity:0.7},{x:28,y:72,intensity:1.0}] },
          { name: "Rodrygo Goes", number: 10, position: "FWD", role: "Creative Attacking Mid", heatmap: [{x:50,y:65,intensity:0.9},{x:55,y:70,intensity:1.0},{x:45,y:60,intensity:0.8},{x:50,y:75,intensity:0.7},{x:52,y:68,intensity:1.0}] },
          { name: "Bruno Guimarães", number: 5, position: "MID", role: "Deep Lying Playmaker", heatmap: [{x:50,y:45,intensity:0.9},{x:55,y:40,intensity:1.0},{x:45,y:50,intensity:0.8},{x:48,y:48,intensity:0.7},{x:52,y:42,intensity:1.0}] },
          { name: "Marquinhos", number: 4, position: "DEF", role: "Covering Center Back", heatmap: [{x:60,y:25,intensity:0.9},{x:62,y:30,intensity:1.0},{x:58,y:22,intensity:0.8},{x:60,y:35,intensity:0.7}] }
        ],
        lineup: [
          { name: "Alisson", position: "GK", x: 50, y: 12 },
          { name: "Danilo", position: "RB", x: 82, y: 30 },
          { name: "Marquinhos", position: "CB", x: 62, y: 28 },
          { name: "Gabriel M.", position: "CB", x: 38, y: 28 },
          { name: "Arana", position: "LB", x: 18, y: 30 },
          { name: "Guimarães", position: "CDM", x: 62, y: 45 },
          { name: "Gomes", position: "CDM", x: 38, y: 45 },
          { name: "Raphinha", position: "RW", x: 78, y: 65 },
          { name: "Rodrygo", position: "AM", x: 50, y: 62 },
          { name: "Vinícius Jr.", position: "LW", x: 22, y: 65 },
          { name: "Endrick", position: "ST", x: 50, y: 82 }
        ]
      },
      "france": {
        country: "France",
        formation: "4-3-3",
        styleOfPlay: "Direct counter-attacking and high athletic coverage. Prefers structured mid-blocks that lure opponents forward, leaving massive vertical spaces for speed forwards to run into.",
        strengths: ["Unrivaled physical speed", "Resilient central defense", "Incredible roster depth", "Surgical finishing"],
        weaknesses: ["Passive build-up play", "Occasional lapses in concentration", "Over-reliance on individual brilliance"],
        tacticalRating: 93,
        defenseRating: 91,
        attackRating: 95,
        midfieldRating: 91,
        keyPlayers: [
          { name: "Kylian Mbappé", number: 10, position: "FWD", role: "Speed Merchant & Inside Forward", heatmap: [{x:20,y:80,intensity:1.0},{x:30,y:85,intensity:0.9},{x:40,y:82,intensity:0.8},{x:25,y:75,intensity:0.7},{x:15,y:82,intensity:0.8}] },
          { name: "Antoine Griezmann", number: 7, position: "MID", role: "Roaming Creator", heatmap: [{x:50,y:60,intensity:1.0},{x:55,y:55,intensity:0.8},{x:45,y:55,intensity:0.8},{x:50,y:45,intensity:0.7},{x:60,y:65,intensity:0.9}] },
          { name: "Aurélien Tchouaméni", number: 8, position: "MID", role: "Ball Winning Anchor", heatmap: [{x:50,y:40,intensity:1.0},{x:40,y:42,intensity:0.8},{x:60,y:42,intensity:0.8},{x:50,y:35,intensity:0.7}] },
          { name: "William Saliba", number: 4, position: "DEF", role: "Elite Stopper", heatmap: [{x:60,y:25,intensity:1.0},{x:62,y:30,intensity:0.8},{x:58,y:22,intensity:0.8}] }
        ],
        lineup: [
          { name: "Maignan", position: "GK", x: 50, y: 12 },
          { name: "Koundé", position: "RB", x: 80, y: 32 },
          { name: "Saliba", position: "CB", x: 62, y: 28 },
          { name: "Upamecano", position: "CB", x: 38, y: 28 },
          { name: "Hernández", position: "LB", x: 20, y: 32 },
          { name: "Tchouaméni", position: "CDM", x: 50, y: 44 },
          { name: "Kanté", position: "CM", x: 65, y: 52 },
          { name: "Rabiot", position: "CM", x: 35, y: 52 },
          { name: "Dembélé", position: "RW", x: 78, y: 72 },
          { name: "Mbappé", position: "ST", x: 50, y: 82 },
          { name: "Barcola", position: "LW", x: 22, y: 72 }
        ]
      },
      "england": {
        country: "England",
        formation: "4-2-3-1",
        styleOfPlay: "Control-oriented wing play with overlapping fullbacks. Focuses on patient positional play, utilizing smart link-up play from strikers dropping deep to let wide wingers cut inside.",
        strengths: ["Excellent ball retention", "Dangerous set-piece delivery", "Tactical flexibility", "Elite shooting accuracy"],
        weaknesses: ["Slow tempo in transition", "Defensive tracking under speed counters", "Decision making in penalty shootouts"],
        tacticalRating: 90,
        defenseRating: 86,
        attackRating: 92,
        midfieldRating: 91,
        keyPlayers: [
          { name: "Harry Kane", number: 9, position: "FWD", role: "Deep-Dropping Complete Forward", heatmap: [{x:50,y:75,intensity:1.0},{x:50,y:65,intensity:0.9},{x:55,y:70,intensity:0.8},{x:45,y:70,intensity:0.8},{x:50,y:85,intensity:0.7}] },
          { name: "Jude Bellingham", number: 10, position: "MID", role: "Dynamic Shadow Striker", heatmap: [{x:50,y:62,intensity:1.0},{x:55,y:68,intensity:0.9},{x:45,y:68,intensity:0.9},{x:50,y:55,intensity:0.7},{x:60,y:72,intensity:0.8}] },
          { name: "Bukayo Saka", number: 7, position: "FWD", role: "Inside Forward", heatmap: [{x:80,y:75,intensity:1.0},{x:85,y:80,intensity:0.9},{x:75,y:70,intensity:0.8},{x:78,y:65,intensity:0.7},{x:82,y:85,intensity:0.8}] },
          { name: "Declan Rice", number: 4, position: "MID", role: "Box-to-Box Destroyer", heatmap: [{x:40,y:45,intensity:1.0},{x:45,y:48,intensity:0.8},{x:35,y:42,intensity:0.8},{x:42,y:40,intensity:0.7}] }
        ],
        lineup: [
          { name: "Pickford", position: "GK", x: 50, y: 12 },
          { name: "Walker", position: "RB", x: 82, y: 30 },
          { name: "Stones", position: "CB", x: 62, y: 28 },
          { name: "Guéhi", position: "CB", x: 38, y: 28 },
          { name: "Shaw", position: "LB", x: 18, y: 30 },
          { name: "Mainoo", position: "CDM", x: 62, y: 45 },
          { name: "Rice", position: "CDM", x: 38, y: 45 },
          { name: "Saka", position: "RW", x: 78, y: 65 },
          { name: "Bellingham", position: "AM", x: 50, y: 62 },
          { name: "Foden", position: "LW", x: 22, y: 65 },
          { name: "Kane", position: "ST", x: 50, y: 82 }
        ]
      }
    };

    // Normalize input key to match fallbacks
    const normalizedKey = countryName.toLowerCase().trim();
    if (defaultReports[normalizedKey]) {
      return res.json({ ...defaultReports[normalizedKey], engine: "fallback" as const });
    }

    // Dynamic mock generator for any other country name (ensures perfect reliability!)
    const genericReport = {
      country: countryName.charAt(0).toUpperCase() + countryName.slice(1),
      formation: "4-3-3",
      styleOfPlay: `High team coordination and disciplined positioning. ${countryName} focuses on strong defensive cohesion, looking to break with high-speed transitions and structured wing support.`,
      strengths: ["Incredible squad work-rate", "Resilient defensive structure", "Rapid tactical counter-attacks"],
      weaknesses: ["Vulnerability to sustained heavy pressure", "Limited bench depth in key positions"],
      tacticalRating: 78,
      defenseRating: 77,
      attackRating: 75,
      midfieldRating: 79,
      keyPlayers: [
        { name: "Captain Star", number: 10, position: "MID", role: "Playmaking Catalyst", heatmap: [{x:50,y:50,intensity:1.0},{x:45,y:55,intensity:0.8},{x:55,y:45,intensity:0.8},{x:50,y:60,intensity:0.7}] },
        { name: "Wall defender", number: 4, position: "DEF", role: "Commanding Center Back", heatmap: [{x:50,y:30,intensity:1.0},{x:40,y:25,intensity:0.8},{x:60,y:25,intensity:0.8}] },
        { name: "Speedster forward", number: 11, position: "FWD", role: "Rapid Counter-Attacker", heatmap: [{x:50,y:80,intensity:1.0},{x:30,y:70,intensity:0.7},{x:70,y:70,intensity:0.7}] },
        { name: "Safe Keeper", number: 1, position: "GK", role: "Reliable Shot Blocker", heatmap: [{x:50,y:10,intensity:1.0}] }
      ],
      lineup: [
        { name: "Keeper", position: "GK", x: 50, y: 12 },
        { name: "R. Back", position: "RB", x: 80, y: 32 },
        { name: "C. Back 1", position: "CB", x: 62, y: 28 },
        { name: "C. Back 2", position: "CB", x: 38, y: 28 },
        { name: "L. Back", position: "LB", x: 20, y: 32 },
        { name: "Anchor", position: "CDM", x: 50, y: 44 },
        { name: "Midfield L", position: "CM", x: 65, y: 52 },
        { name: "Midfield R", position: "CM", x: 35, y: 52 },
        { name: "R. Winger", position: "RW", x: 78, y: 72 },
        { name: "Striker", position: "ST", x: 50, y: 82 },
        { name: "L. Winger", position: "LW", x: 22, y: 72 }
      ]
    };
    res.json({ ...genericReport, engine: "fallback" as const });
  });

  // --- API ROUTE: Generate Player Card ---
  app.post("/api/generate-player-card", async (req, res) => {
    const { player, teamContext } = req.body;
    if (!player) {
      return res.status(400).json({ error: "Player data is required" });
    }

    if (ai) {
      try {
        const prompt = `Generate a professional digital player trading card for a football player.
        Player Name: ${player.name}
        Team: ${teamContext || 'Unknown'}
        Position: ${player.position}
        Squad Number: ${player.number || 'N/A'}
        Tactical Role: ${player.role}
        
        Style Guidelines:
        - High-quality cinematic photorealistic headshot of a professional athlete.
        - The card should have a sleek tech-inspired background with glowing blue and amber accents.
        - Incorporate the player's name and position as elegant typography on the card.
        - Add a stats panel with numeric ratings for: Speed, Skill, Passing, Defense, and Physicality.
        - Futuristic "Tactical Scouting" aesthetic with holographic overlays and light trails.
        - Centered composition, premium trading card layout.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4",
              imageSize: "1K"
            }
          }
        });

        let imageUrl = null;
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (imageUrl) {
          return res.json({ imageUrl });
        }
      } catch (error: any) {
        console.error("Image Generation Error:", error.message);
      }
    }

    // Fallback if AI fails or is not available
    const fallbackImage = `https://picsum.photos/seed/${encodeURIComponent(player.name)}/300/400`;
    res.json({ imageUrl: fallbackImage, note: "AI generation unavailable, using tactical simulation placeholder." });
  });

  // --- API ROUTE: Simulate Match ---
  app.post("/api/simulate-match", async (req, res) => {
    const { teamA, teamB, difficulty } = req.body;
    const nameA = teamA || "Argentina";
    const nameB = teamB || "Brazil";

    if (ai) {
      const schema = {
        type: Type.OBJECT,
        properties: {
          teamA: { type: Type.STRING },
          teamB: { type: Type.STRING },
          scoreA: { type: Type.INTEGER },
          scoreB: { type: Type.INTEGER },
          stats: {
            type: Type.OBJECT,
            properties: {
              possession: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              shots: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              shotsOnTarget: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              corners: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              fouls: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              yellowCards: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              redCards: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["possession", "shots", "shotsOnTarget", "corners", "fouls", "yellowCards", "redCards"]
          },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                minute: { type: Type.INTEGER },
                type: { type: Type.STRING },
                team: { type: Type.STRING },
                player: { type: Type.STRING },
                description: { type: Type.STRING },
                headline: { type: Type.STRING, description: "Punchy 2-word headline for commentary" },
                aiCommentary: { type: Type.STRING, description: "Exciting 1-sentence reaction for the ticker/toast" }
              },
              required: ["minute", "type", "team", "player", "description", "headline", "aiCommentary"]
            }
          },
          highlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          manOfTheMatch: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              team: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              highlight: { type: Type.STRING }
            },
            required: ["name", "team", "rating", "highlight"]
          }
        },
        required: ["teamA", "teamB", "scoreA", "scoreB", "stats", "events", "highlights", "manOfTheMatch"]
      };

      const resultText = await safeGenerateContent(
        `Simulate a realistic, highly exciting, detailed football match between team A (${nameA}) and team B (${nameB}). 
Write a complete match timeline detailing goals, yellow/red cards, near misses, or key events. 
Ensure the final score feels representative of real-world strengths (for example, if a massive powerhouse plays a heavy underdog, the powerhouse is favored, but surprises can happen!).
Assign realistic statistics such as possession (should sum to 100), shots, shots on target, corners, fouls, and yellow/red cards.
Finally, generate a set of "AI Highlights" (3-5 bulleted narrative summaries) and identify the "Man of the Match" with a short, expert analytical highlight explaining why they were the standout performer.
Return the simulation strictly adhering to the JSON schema specified.`,
        schema
      );

      if (resultText) {
        try {
          const result = JSON.parse(cleanJsonResponse(resultText));
          return res.json({ ...result, engine: "gemini" });
        } catch (error) {
          console.warn("Failed to parse Gemini match simulation JSON:", error);
        }
      }
    }

    // High fidelity local match simulator (runs 100% offline, highly realistic!)
    console.log("Using high-fidelity offline match simulation engine.");
    
    // Assign strength indices (ratings) for standard teams
    const ratings: Record<string, number> = {
      "argentina": 92, "brazil": 91, "france": 93, "england": 90, "spain": 92,
      "germany": 89, "portugal": 88, "italy": 87, "japan": 81, "bangladesh": 55,
      "morocco": 83, "usa": 79, "mexico": 78, "netherlands": 88, "senegal": 80
    };

    const getRating = (team: string) => ratings[team.toLowerCase().trim()] || 75;
    const rA = getRating(nameA);
    const rB = getRating(nameB);

    // Calculate goal weights based on rating ratios
    const weightA = rA / (rA + rB);
    const totalGoalsLambda = 2.4 + (Math.random() * 1.6); // typical soccer goals count
    
    // Simple Poisson-like randomized simulation
    let scoreA = 0;
    let scoreB = 0;
    const events: any[] = [];

    // Add kickoff
    events.push({
      minute: 1,
      type: "kickoff",
      team: "none",
      player: "",
      description: `The referee blows the whistle and the match between ${nameA} and ${nameB} is underway!`,
      headline: "KICK OFF",
      aiCommentary: "The whistle blows and we are finally underway in this tactical showdown!"
    });

    // Generate random events throughout 90 minutes
    const possibleEvents = Math.floor(6 + Math.random() * 6);
    const eventMinutes: number[] = [];
    while (eventMinutes.length < possibleEvents) {
      const min = Math.floor(5 + Math.random() * 80);
      if (!eventMinutes.includes(min) && min !== 45) {
        eventMinutes.push(min);
      }
    }
    eventMinutes.sort((a, b) => a - b);

    // Sample player lists for descriptions
    const genericPlayersA = ["Silva", "Gomes", "Rodriguez", "Fernandez", "Santos", "Costa", "Almeida"];
    const genericPlayersB = ["Smith", "Jones", "Taylor", "Brown", "Miller", "Davis", "Wilson"];

    const getPlayer = (team: 'A' | 'B') => {
      const list = team === 'A' ? genericPlayersA : genericPlayersB;
      return list[Math.floor(Math.random() * list.length)];
    };

    eventMinutes.forEach((min) => {
      if (min === 45) return;
      const isTeamA = Math.random() < weightA;
      const side = isTeamA ? 'A' : 'B';
      const activeTeam = isTeamA ? nameA : nameB;
      const opponentTeam = isTeamA ? nameB : nameA;

      const roll = Math.random();
      if (roll < 0.25) {
        // GOAL!
        const scorer = getPlayer(side);
        if (isTeamA) scoreA++; else scoreB++;
        events.push({
          minute: min,
          type: "goal",
          team: side,
          player: scorer,
          description: `GOAL! Beautiful link-up play finds ${scorer}, who turns past his marker and strikes a powerful shot into the bottom corner! ${activeTeam} takes the lead/equalizes!`,
          headline: "GOAL!",
          aiCommentary: `SENSATIONAL! ${scorer} breaks the deadlock with a clinical finish!`
        });
      } else if (roll < 0.50) {
        // CHANCE!
        const player = getPlayer(side);
        events.push({
          minute: min,
          type: "chance",
          team: side,
          player: player,
          description: `WHAT A SAVE! ${player} rises highest to meet an incoming cross, but the goalkeeper pulls off an unbelievable fingertip save to deny ${activeTeam}!`,
          headline: "CHANCE!",
          aiCommentary: `How did that not go in? An absolute world-class save!`
        });
      } else if (roll < 0.75) {
        // YELLOW CARD
        const defender = getPlayer(side === 'A' ? 'B' : 'A'); // opponent commits foul
        events.push({
          minute: min,
          type: "card_yellow",
          team: side === 'A' ? 'B' : 'A',
          player: defender,
          description: `Yellow Card! ${defender} commits a tactical foul to halt a promising, fast-breaking attack by ${activeTeam}.`,
          headline: "CAUTION",
          aiCommentary: `The referee has no choice but to show yellow for that cynical challenge.`
        });
      } else {
        // SUBSTITUTION
        events.push({
          minute: min,
          type: "substitution",
          team: side,
          player: getPlayer(side),
          description: `Tactical Substitution. ${activeTeam} changes their formation, bringing on a fresh midfielder to regain central control.`,
          headline: "SUBSTITUTION",
          aiCommentary: `A tactical shift here as ${activeTeam} looks to freshen up the engine room.`
        });
      }
    });

    // Add Halftime
    events.push({
      minute: 45,
      type: "halftime",
      team: "none",
      player: "",
      description: `Halftime whistle blows. The teams head down the tunnel with the score resting at ${nameA} ${scoreA} - ${scoreB} ${nameB}.`,
      headline: "HALFTIME",
      aiCommentary: "A breather for both sides after an intense first half of tactical maneuvers."
    });

    // Add Fulltime
    events.push({
      minute: 90,
      type: "fulltime",
      team: "none",
      player: "",
      description: `The referee blows the final whistle! Match ends: ${nameA} ${scoreA} - ${scoreB} ${nameB}. What an intense tactical battle!`,
      headline: "FULL TIME",
      aiCommentary: "The final whistle sounds! A masterclass in modern tactical football comes to an end."
    });

    // Sort all events chronologically
    events.sort((a, b) => a.minute - b.minute);

    // Dynamic stats
    const basePossessionA = Math.round(40 + (weightA * 20) + (Math.random() * 10 - 5));
    const finalPossessionA = Math.max(25, Math.min(75, basePossessionA));
    const possession: [number, number] = [finalPossessionA, 100 - finalPossessionA];

    const shotsA = Math.round(5 + (rA / 10) + Math.floor(Math.random() * 5));
    const shotsB = Math.round(5 + (rB / 10) + Math.floor(Math.random() * 5));
    const shots: [number, number] = [shotsA, shotsB];

    const sOnTargetA = Math.max(1, Math.round(shotsA * (0.3 + Math.random() * 0.2)));
    const sOnTargetB = Math.max(1, Math.round(shotsB * (0.3 + Math.random() * 0.2)));
    const shotsOnTarget: [number, number] = [sOnTargetA, sOnTargetB];

    const corners: [number, number] = [Math.floor(2 + Math.random() * 7), Math.floor(2 + Math.random() * 7)];
    const fouls: [number, number] = [Math.floor(6 + Math.random() * 10), Math.floor(6 + Math.random() * 10)];
    
    // Count yellow cards from events
    const yellowsA = events.filter(e => e.type === "card_yellow" && e.team === "A").length + Math.floor(Math.random() * 2);
    const yellowsB = events.filter(e => e.type === "card_yellow" && e.team === "B").length + Math.floor(Math.random() * 2);
    const yellowCards: [number, number] = [yellowsA, yellowsB];
    const redCards: [number, number] = [0, 0];

    // Generate some procedural highlights
    const highlights = [
      `An intense tactical battle where ${nameA} and ${nameB} both showcased high defensive lines.`,
      scoreA > scoreB 
        ? `${nameA} dominated the final third with clinical finishing and rapid transitions.` 
        : scoreB > scoreA 
          ? `${nameB} exploited spaces on the counter-attack to secure a decisive result.`
          : `A tightly contested midfield battle resulting in a deadlock that neither side could break.`,
      `Key tactical substitutions in the second half significantly altered the momentum of the match.`
    ];

    // Pick a Man of the Match (MVP) from fallback
    const motmTeam = scoreA >= scoreB ? 'A' : 'B';
    const motmName = getPlayer(motmTeam);
    const manOfTheMatch = {
      name: motmName,
      team: motmTeam === 'A' ? nameA : nameB,
      rating: 8.5 + (Math.random() * 1.4),
      highlight: `A standout performance from ${motmName}, whose tactical awareness and work-rate anchored the team during critical transitions.`
    };

    res.json({
      teamA: nameA,
      teamB: nameB,
      scoreA,
      scoreB,
      stats: { possession, shots, shotsOnTarget, corners, fouls, yellowCards, redCards },
      events,
      highlights,
      manOfTheMatch,
      engine: "fallback" as const
    });
  });

  // --- API ROUTE: Compare Players ---
  app.get("/api/compare-players", async (req, res) => {
    const { player1, player2 } = req.query;
    
    if (!player1 || !player2) {
      return res.status(400).json({ error: "Missing player names for comparison." });
    }

    if (ai) {
      const schema = {
        type: Type.OBJECT,
        properties: {
          playerA: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  },
                  required: ["label", "value"]
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["name", "metrics", "summary"]
          },
          playerB: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  },
                  required: ["label", "value"]
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["name", "metrics", "summary"]
          },
          tacticalVerdict: { type: Type.STRING }
        },
        required: ["playerA", "playerB", "tacticalVerdict"]
      };

      const resultText = await safeGenerateContent(
        `Perform a detailed, head-to-head tactical comparison between two football players: ${player1} and ${player2}.
Provide realistic performance metrics (0-100), a concise summary of their playing style/role, and a final "Tactical Verdict" on who would be better suited for a high-intensity modern tactical system.
Return the data in a clean JSON format.`,
        schema
      );

      if (resultText) {
        try {
          const comparison = JSON.parse(cleanJsonResponse(resultText));
          return res.json({ ...comparison, engine: "gemini" });
        } catch (error) {
          console.warn("Failed to parse Gemini comparison JSON:", error);
        }
      }
    }

    // Fallback comparison
    const fallbackComparison = {
      playerA: {
        name: player1 as string,
        metrics: [
          { label: "Pace", value: 85 },
          { label: "Dribbling", value: 88 },
          { label: "Shooting", value: 82 },
          { label: "Passing", value: 80 }
        ],
        summary: "A versatile attacker with great movement and technical quality."
      },
      playerB: {
        name: player2 as string,
        metrics: [
          { label: "Pace", value: 82 },
          { label: "Dribbling", value: 84 },
          { label: "Shooting", value: 89 },
          { label: "Passing", value: 78 }
        ],
        summary: "A clinical finisher with exceptional positioning and power."
      },
      tacticalVerdict: "While both players offer elite quality, the choice depends on whether you value creative dribbling or pure finishing output.",
      engine: "fallback" as const
    };
    res.json(fallbackComparison);
  });

  // --- API ROUTE: Tactical Advisor Chat ---
  app.post("/api/chat", express.json(), async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid chat history." });
    }

    if (ai) {
      const lastMessage = messages[messages.length - 1].content;
      const resultText = await safeGenerateContent(
        `You are an elite, world-class football (soccer) tactical coach and advisor. 
You provide deep, expert-level analysis on formations, player roles, team dynamics, and historical tactical evolutions.
Be professional, slightly analytical, and passionate about the "beautiful game". 
Keep responses concise but insightful (max 2-3 paragraphs).
Context of user query: ${lastMessage}`
      );

      if (resultText) {
        return res.json({ 
          content: resultText.trim(),
          engine: "gemini" 
        });
      }
    }

    // Fallback AI behavior
    const fallbackResponses = [
      "That is an interesting tactical observation. Modern systems increasingly rely on inverted full-backs to create overloads in central areas.",
      "From a coaching perspective, the balance between defensive transition and offensive width is critical. Have you considered a high-pressing 4-3-3?",
      "Tactical discipline is the bedrock of success. Even the most creative players must adhere to the defensive structure to maintain team shape.",
      "The evolution of the 'False 9' has completely changed how center-backs approach marking. It requires a high level of communication to manage the space."
    ];
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.json({ 
      content: `${randomFallback} (Note: Offline advisor active.)`,
      engine: "fallback" 
    });
  });

  // --- API ROUTE: Quiz Question ---
  app.get("/api/quiz-question", async (req, res) => {
    // Check cache (one question at a time, rotate every 5 mins)
    if (quizCache && (Date.now() - quizCache.timestamp < 1000 * 60 * 5)) {
      return res.json(quizCache.data);
    }

    if (ai) {
      const schema = {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options" },
          correctIndex: { type: Type.INTEGER, description: "0-indexed index of correct answer" },
          explanation: { type: Type.STRING, description: "Detailed explanation of why this answer is correct and historical details" },
          category: { type: Type.STRING, description: "World Cup, Player Record, Clubs, Rules" }
        },
        required: ["question", "options", "correctIndex", "explanation", "category"]
      };

      const resultText = await safeGenerateContent(
        "Generate a tough, highly interesting multiple-choice football (soccer) trivia question about FIFA World Cup histories, football records, legendary players, or tactical concepts. Return options, a clear explanation, and a category tag.",
        schema
      );

      if (resultText) {
        try {
          const quiz = JSON.parse(cleanJsonResponse(resultText));
          const result = { ...quiz, engine: "gemini" };
          quizCache = { data: result, timestamp: Date.now() };
          return res.json(result);
        } catch (error) {
          console.warn("Failed to parse Gemini quiz JSON:", error);
        }
      }
    }

    // High quality trivia questions bank
    const quizBank = [
      {
        question: "Who is the all-time leading goal scorer in FIFA World Cup history?",
        options: ["Pelé (Brazil)", "Miroslav Klose (Germany)", "Ronaldo Nazário (Brazil)", "Just Fontaine (France)"],
        correctIndex: 1,
        explanation: "Miroslav Klose of Germany holds the record with 16 goals across four World Cup tournaments (2002, 2006, 2010, and 2014), surpassing Ronaldo Nazário's previous record of 15 goals.",
        category: "World Cup"
      },
      {
        question: "Which nation won the inaugural FIFA World Cup in 1930?",
        options: ["Argentina", "Uruguay", "Brazil", "Italy"],
        correctIndex: 1,
        explanation: "Uruguay hosted and won the first-ever FIFA World Cup in 1930, defeating their neighboring rivals Argentina 4-2 in the final in Montevideo.",
        category: "World Cup"
      },
      {
        question: "Who is the only player to have won three FIFA World Cup trophies?",
        options: ["Pelé", "Diego Maradona", "Franz Beckenbauer", "Zinedine Zidane"],
        correctIndex: 0,
        explanation: "Edson Arantes do Nascimento, famously known as Pelé, is the only player in football history to win three World Cups: in 1958 (Sweden), 1962 (Chile), and 1970 (Mexico).",
        category: "World Cup"
      },
      {
        question: "Which goalkeeper has kept the most clean sheets in a single World Cup tournament?",
        options: ["Gianluigi Buffon", "Iker Casillas", "Walter Zenga", "Oliver Kahn"],
        correctIndex: 2,
        explanation: "Walter Zenga of Italy holds the record for the most consecutive minutes without conceding a goal (517 minutes) and kept 5 clean sheets in the 1990 tournament in Italy.",
        category: "Records"
      },
      {
        question: "What is the famous tactical style developed by Rinus Michels and Johan Cruyff in the 1970s?",
        options: ["Catenaccio", "Tiki-Taka", "Gegenpressing", "Total Football"],
        correctIndex: 3,
        explanation: "Total Football (Totaalvoetbal) is a tactical system where any outfield player can take over the role of any other player in the team. It was pioneered by Ajax and the Netherlands national team.",
        category: "Tactics"
      }
    ];

    const randomQuiz = quizBank[Math.floor(Math.random() * quizBank.length)];
    res.json({ ...randomQuiz, engine: "fallback" as const });
  });

  // --- API ROUTE: Get MVP Prediction ---
  app.post("/api/mvp-prediction", async (req, res) => {
    const { teamA, teamB, events, scoreA, scoreB } = req.body;

    if (ai) {
      const schema = {
        type: Type.OBJECT,
        properties: {
          player: { type: Type.STRING },
          team: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          rating: { type: Type.NUMBER }
        },
        required: ["player", "team", "reasoning", "rating"]
      };

      const resultText = await safeGenerateContent(
        `Analyze the following football match events and scoreline to predict the Man of the Match (MVP).
Team A: ${teamA}
Team B: ${teamB}
Final Score: ${scoreA} - ${scoreB}

Events:
${JSON.stringify(events)}

Return a JSON object with:
- player: The name of the predicted MVP (must be a player mentioned in the events or a logical star).
- team: The team they play for.
- reasoning: A 2-sentence tactical justification for why they deserve MVP based on the events.
- rating: A performance rating from 1 to 10 (e.g., 8.7).`,
        schema
      );

      if (resultText) {
        try {
          return res.json(JSON.parse(cleanJsonResponse(resultText)));
        } catch (error) {
          console.warn("Failed to parse Gemini MVP prediction JSON:", error);
        }
      }
    }

    const goalScorer = events.find(e => e.type === 'goal')?.player;
    res.json({
      player: goalScorer || (scoreA >= scoreB ? "Team A Captain" : "Team B Captain"),
      team: scoreA >= scoreB ? teamA : teamB,
      reasoning: "Demonstrated exceptional tactical discipline and leadership under pressure throughout the match duration.",
      rating: 8.5,
      engine: "fallback"
    });
  });

  // --- API ROUTE: Get Live Event Commentary ---
  app.post("/api/event-commentary", async (req, res) => {
    const { event, teamA, teamB } = req.body;

    if (ai) {
      const schema = {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          commentary: { type: Type.STRING }
        },
        required: ["headline", "commentary"]
      };

      const resultText = await safeGenerateContent(
        `Provide a punchy, exciting, and professional 1-sentence live commentary for this football match event.
Match: ${teamA} vs ${teamB}
Event: ${JSON.stringify(event)}

Return a JSON object with:
- headline: A short 2-3 word headline (e.g., "GOAL!", "DRAMA!", "TACTICAL MOVE").
- commentary: The exciting 1-sentence reaction.`,
        schema
      );

      if (resultText) {
        try {
          return res.json(JSON.parse(cleanJsonResponse(resultText)));
        } catch (error) {
          console.warn("Failed to parse Gemini commentary JSON:", error);
        }
      }
    }

    // Fallback commentary
    const fallbacks: Record<string, string> = {
      goal: `Sensational goal by ${event.player}! The stadium is erupting!`,
      card_yellow: `${event.player} goes into the book with a yellow card.`,
      card_red: `UNBELIEVABLE! A red card for ${event.player}! A massive moment in the match!`,
      substitution: `Tactical change: ${event.player} coming on.`,
      chance: `A close call for ${event.team === 'A' ? teamA : teamB}!`,
    };

    res.json({
      headline: event.type.toUpperCase().replace('_', ' '),
      commentary: fallbacks[event.type] || event.description
    });
  });

  // --- API ROUTE: Send Gmail Match Report ---
  app.post("/api/gmail/send", async (req, res) => {
    const { to, subject, body, accessToken } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: 'v1', auth });

      // Create RFC822 message
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body,
      ];
      const message = messageParts.join('\n');

      // The body needs to be base64url encoded.
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Gmail Send Error:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  // --- API ROUTE: Save to Google Drive ---
  app.post("/api/drive/save", async (req, res) => {
    const { name, content, mimeType, accessToken } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: name || 'Match Report.html',
        mimeType: mimeType || 'text/html',
      };

      let uploadBody = content;
      if (typeof content === 'string' && (content.startsWith('data:') || mimeType === 'application/pdf')) {
        const base64Data = content.includes(';base64,') 
          ? content.split(';base64,')[1] 
          : content;
        uploadBody = Buffer.from(base64Data, 'base64');
      }

      const media = {
        mimeType: mimeType || 'text/html',
        body: uploadBody,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      res.json({ success: true, fileId: file.data.id, link: file.data.webViewLink });
    } catch (error: any) {
      console.error("Drive Save Error:", error);
      res.status(500).json({ error: error.message || "Failed to save to Drive" });
    }
  });

  // --- API ROUTE: List Google Drive Files ---
  app.get("/api/drive/list", async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const search = req.query.search as string;

    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth });

      let query = "trashed = false";
      if (search) {
        query += ` and name contains '${search}'`;
      }

      const response = await drive.files.list({
        pageSize: 20,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, createdTime)',
        q: query,
        orderBy: 'createdTime desc'
      });

      res.json({ files: response.data.files });
    } catch (error: any) {
      console.error("Drive List Error:", error);
      res.status(500).json({ error: error.message || "Failed to list Drive files" });
    }
  });

  // --- API ROUTE: Delete Google Drive File ---
  app.delete("/api/drive/delete/:fileId", async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { fileId } = req.params;

    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth });

      await drive.files.delete({ fileId });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Drive Delete Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete file" });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIFA Hub full-stack server successfully running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
