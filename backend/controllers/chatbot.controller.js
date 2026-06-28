import Product from "../models/product.model.js";

const MAX_HISTORY_MESSAGES = 8;
const MAX_MATCHES = 5;
const SHOP_TIME_ZONE = process.env.SHOP_TIME_ZONE || "Europe/Berlin";
const MAIN_CATEGORIES = ["women", "men", "babies"];
const PRODUCT_TYPES = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "bags"];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "have",
  "i",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "please",
  "show",
  "stock",
  "the",
  "to",
  "want",
  "with",
  "you",
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTodayText = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: SHOP_TIME_ZONE,
  }).format(new Date());

const isGeneralChatMessage = (message) => {
  const normalizedMessage = message.toLowerCase();

  return (
    /\b(hi|hello|hey|good morning|good afternoon|good evening|how are you|thank you|thanks)\b/.test(
      normalizedMessage,
    ) ||
    /\b(what day|what date|today|time|who are you|what can you do|help)\b/.test(normalizedMessage)
  );
};

const getSearchTerms = (message) =>
  message
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => {
      const trimmedTerm = term.trim();
      if (trimmedTerm === "man" || trimmedTerm === "mens") return "men";
      if (trimmedTerm === "woman" || trimmedTerm === "womens") return "women";
      if (trimmedTerm === "baby" || trimmedTerm === "toddler" || trimmedTerm === "kids") return "babies";
      return trimmedTerm;
    })
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
    .slice(0, 8);

const scoreProduct = (product, terms) => {
  const haystack = `${product.name} ${product.mainCategory || ""} ${product.category} ${
    product.description
  }`.toLowerCase();

  return terms.reduce((score, term) => {
    if (product.name.toLowerCase().includes(term)) return score + 4;
    if ((product.mainCategory || "").toLowerCase().includes(term)) return score + 4;
    if (product.category.toLowerCase().includes(term)) return score + 3;
    if (haystack.includes(term)) return score + 1;
    return score;
  }, 0);
};

const buildProductSummary = (products) =>
  products
    .map((product) => {
      const stockText =
        typeof product.stock === "number"
          ? product.stock > 0
            ? `${product.stock} in stock`
            : "out of stock"
          : "stock not set";

      return `${product.name} (${product.mainCategory || "women"} / ${product.category}) - $${
        product.price
      }: ${stockText}. ${product.description}`;
    })
    .join("\n");

const getFallbackReply = ({ message, products, terms, isGeneralChat }) => {
  const normalizedMessage = message.toLowerCase();
  const isStockQuestion = /\b(stock|available|availability|have|left)\b/.test(normalizedMessage);
  const isCatalogQuestion = /\b(categories|category|sections|section|men|man|women|woman|baby|babies|kids)\b/.test(
    normalizedMessage,
  );
  const isRecommendationQuestion = /\b(recommend|suggest|best|popular|should i buy|looking for|want|need)\b/.test(
    normalizedMessage,
  );
  const requestedMainCategory = MAIN_CATEGORIES.find((category) => terms.includes(category));

  if (/\b(what day|what date|today)\b/.test(normalizedMessage)) {
    return `Today is ${getTodayText()}.`;
  }

  if (/\b(hi|hello|hey|good morning|good afternoon|good evening|how are you)\b/.test(normalizedMessage)) {
    return "Hi! I can help you find products, check stock, or suggest something that fits what you are shopping for.";
  }

  if (isGeneralChat) {
    return `I am your shopping assistant. I can chat a little, help you find products, suggest items, and check stock. The main shop sections are ${MAIN_CATEGORIES.join(
      ", ",
    )}, and product types include ${PRODUCT_TYPES.join(", ")}.`;
  }

  if (!products.length) {
    if (requestedMainCategory || isCatalogQuestion) {
      const section = requestedMainCategory || "that section";
      return `Yes, the shop has main sections for Women, Men, and Babies. I could not find matching products in ${section} yet, but the product types are ${PRODUCT_TYPES.join(
        ", ",
      )}.`;
    }

    return "I could not find a matching product yet. Try telling me the color, category, or style you want, like \"red hat\" or \"black shoes\".";
  }

  if (isStockQuestion) {
    const product = products[0];
    if (typeof product.stock !== "number") {
      return `${product.name} is in our catalog, but its stock count has not been set yet.`;
    }

    return product.stock > 0
      ? `Yes, ${product.name} is in stock. We currently have ${product.stock} available.`
      : `${product.name} is currently out of stock.`;
  }

  if (isRecommendationQuestion || terms.length) {
    const names = products
      .slice(0, 3)
      .map((product) => `${product.name} ($${product.price})`)
      .join(", ");

    return `I found a few products that match: ${names}. My top pick is ${products[0].name} in ${
      products[0].mainCategory || "women"
    } / ${products[0].category}.`;
  }

  return "I can help you search products, check whether something is in stock, or suggest items based on what you like.";
};

const polishReplyWithAi = async ({ message, history, products, fallbackReply }) => {
  if (!process.env.GEMINI_API_KEY) return fallbackReply;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `You are a friendly ecommerce shopping assistant. Today is ${getTodayText()} in the ${SHOP_TIME_ZONE} timezone. The shop has three main categories: Women, Men, and Babies. Under those, product types include ${PRODUCT_TYPES.join(
                ", ",
              )}. You can make short, polite small talk and answer harmless basic questions like greetings, the date, what you can do, and what categories the shop has. For product names, stock, prices, and recommendations, use only the product context provided. If stock is not set, say that clearly. Do not invent products.`,
            },
          ],
        },
        contents: [
          ...history.slice(-MAX_HISTORY_MESSAGES).map((item) => ({
            role: item.sender === "bot" ? "model" : "user",
            parts: [{ text: item.text }],
          })),
          {
            role: "user",
            parts: [
              {
                text: `Customer message: ${message}\n\nMatched product context:\n${
              products.length ? buildProductSummary(products) : "No matching products found."
            }\n\nDraft answer to improve:\n${fallbackReply}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 220,
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) return fallbackReply;

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      ?.filter(Boolean)
      ?.join(" ");

    return aiText?.trim() || fallbackReply;
  } catch (error) {
    console.log("Gemini chatbot polish failed:", error.message);
    return fallbackReply;
  }
};

export const chatWithShopAssistant = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const isGeneralChat = isGeneralChatMessage(message);
    const terms = isGeneralChat ? [] : getSearchTerms(message);
    const query = terms.length
      ? {
          $or: terms.flatMap((term) => {
            const regex = new RegExp(escapeRegex(term), "i");
            return [{ name: regex }, { description: regex }, { category: regex }, { mainCategory: regex }];
          }),
        }
      : {};

    const candidates = isGeneralChat
      ? []
      : terms.length
      ? await Product.find(query).select("name description price image mainCategory category stock").lean()
        : await Product.aggregate([
          { $sample: { size: MAX_MATCHES } },
          { $project: { name: 1, description: 1, price: 1, image: 1, mainCategory: 1, category: 1, stock: 1 } },
        ]);

    const products = candidates
      .map((product) => ({ ...product, matchScore: terms.length ? scoreProduct(product, terms) : 1 }))
      .filter((product) => product.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_MATCHES);

    const fallbackReply = getFallbackReply({ message, products, terms, isGeneralChat });
    const reply = await polishReplyWithAi({ message, history, products, fallbackReply });

    res.json({
      reply,
      products: products.map(({ matchScore, ...product }) => product),
    });
  } catch (error) {
    console.log("Error in chatWithShopAssistant controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
