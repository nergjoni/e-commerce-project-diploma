import Product from "../models/product.model.js";

const MAX_HISTORY_MESSAGES = 8;
const MAX_MATCHES = 5;
const MAX_CATALOG_PRODUCTS = 120;
const SHOP_TIME_ZONE = process.env.SHOP_TIME_ZONE || "Europe/Berlin";
const MAIN_CATEGORIES = ["women", "men", "babies"];
const PRODUCT_TYPES = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "bags"];
const OUTFIT_CATEGORY_ORDER = ["t-shirts", "jeans", "shoes", "jackets", "bags", "glasses"];
const CURRENCY_SYMBOL = "$";
const ATTRIBUTE_TERMS = new Set([
  "black",
  "blue",
  "brown",
  "cream",
  "dark",
  "gold",
  "gray",
  "green",
  "grey",
  "light",
  "orange",
  "pink",
  "purple",
  "red",
  "silver",
  "straight",
  "relaxed",
  "ribbed",
  "slim",
  "soft",
  "white",
  "yellow",
]);

const CATEGORY_ALIASES = {
  bag: "bags",
  bags: "bags",
  denim: "jeans",
  jean: "jeans",
  jeans: "jeans",
  jacket: "jackets",
  jackets: "jackets",
  shoe: "shoes",
  shoes: "shoes",
  sneaker: "shoes",
  sneakers: "shoes",
  tee: "t-shirts",
  tees: "t-shirts",
  "t-shirt": "t-shirts",
  "t-shirts": "t-shirts",
  tshirt: "t-shirts",
  tshirts: "t-shirts",
  shirt: "t-shirts",
  shirts: "t-shirts",
  glass: "glasses",
  glasses: "glasses",
  sunglasses: "glasses",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "around",
  "can",
  "cheap",
  "cheaper",
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
  "or",
  "please",
  "price",
  "show",
  "stock",
  "the",
  "to",
  "under",
  "want",
  "with",
  "you",
]);

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
  const hasShoppingIntent =
    /\b(recommend|suggest|best|looking for|want|need|find|buy|under|below|less than|less then|max|budget|men|women|baby|babies|kids|t-?shirt|shirt|jeans|shoes|jacket|bag|glasses|outfit|fit)\b/.test(
      normalizedMessage,
    );

  if (hasShoppingIntent) return false;

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

const getConversationText = (message, history) => {
  const recentUserMessages = history
    .filter((item) => item.sender === "user")
    .slice(-3)
    .map((item) => item.text)
    .join(" ");

  return `${recentUserMessages} ${message}`.trim();
};

const normalizeCategory = (term) => CATEGORY_ALIASES[term.toLowerCase()];

const getMainCategoryFromTerms = (terms) => MAIN_CATEGORIES.find((category) => terms.includes(category));

const getRequestedCategories = (terms) => [
  ...new Set(terms.map((term) => normalizeCategory(term)).filter(Boolean)),
];

const getRequestedAttributes = (terms) => terms.filter((term) => ATTRIBUTE_TERMS.has(term));

const getProductText = (product) => `${product.name} ${product.description}`.toLowerCase();

const getProductAudience = (product) => {
  const productText = getProductText(product);

  if (/\b(men|mens|men's|male)\b/.test(productText)) return "men";
  if (/\b(women|womens|women's|female|ladies|lady)\b/.test(productText)) return "women";
  if (/\b(baby|babies|kids|toddler)\b/.test(productText)) return "babies";

  return product.mainCategory;
};

const parseBudget = (text) => {
  const normalizedText = text.toLowerCase().replace(/[\u20ac\u00a3]/g, "$").replace(/\bless then\b/g, "less than");
  const budgetPatterns = [
    /\b(?:under|below|less than|max|maximum|up to|no more than|budget(?: is)?|for)\s*(?:[$€£])?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:[$€£])\s*(\d+(?:\.\d{1,2})?)\s*\b(?:budget|max|maximum|or less|and under)?/i,
    /\b(\d+(?:\.\d{1,2})?)\s*(?:[$€£]|dollars?|euros?|pounds?)\b/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = normalizedText.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
};

const parseShoppingIntent = ({ message, history }) => {
  const conversationText = getConversationText(message, history);
  const normalizedText = conversationText.toLowerCase();
  const currentMessage = message.toLowerCase();
  const currentTerms = getSearchTerms(message);
  const conversationTerms = getSearchTerms(conversationText);
  const budget = parseBudget(conversationText);
  const currentBudget = parseBudget(message);
  const currentMainCategory = getMainCategoryFromTerms(currentTerms);
  const currentCategories = getRequestedCategories(currentTerms);
  const currentAttributes = getRequestedAttributes(currentTerms);
  const requestedMainCategory = currentMainCategory || getMainCategoryFromTerms(conversationTerms);
  const requestedCategories = currentCategories.length ? currentCategories : getRequestedCategories(conversationTerms);
  const requestedAttributes = currentAttributes.length ? currentAttributes : getRequestedAttributes(conversationTerms);
  const rankingTerms = currentTerms.length ? currentTerms : conversationTerms;
  const wantsOutfit = /\b(whole fit|full fit|complete fit|outfit|look|set|match together)\b/.test(normalizedText);
  const isRecommendationQuestion = /\b(recommend|suggest|best|pick|idea|ideas|looking for|want|need|fit|outfit)\b/.test(
    normalizedText,
  );
  const isFollowUpAnswer =
    !getRequestedCategories(getSearchTerms(currentMessage)).length &&
    !getMainCategoryFromTerms(getSearchTerms(currentMessage)) &&
    (currentBudget !== null || currentMessage.split(/\s+/).length <= 4);

  return {
    budget,
    requestedMainCategory,
    requestedCategories,
    requestedAttributes,
    rankingTerms,
    wantsOutfit,
    isRecommendationQuestion,
    isFollowUpAnswer,
  };
};

const scoreProduct = (product, terms, intent) => {
  const haystack = `${product.name} ${product.mainCategory || ""} ${product.category} ${
    product.description
  }`.toLowerCase();

  let score = terms.reduce((currentScore, term) => {
    const normalizedCategory = normalizeCategory(term);
    if (normalizedCategory && product.category === normalizedCategory) return currentScore + 7;
    if (product.name.toLowerCase().includes(term)) return currentScore + 4;
    if ((product.mainCategory || "").toLowerCase().includes(term)) return currentScore + 4;
    if (product.category.toLowerCase().includes(term)) return currentScore + 3;
    if (haystack.includes(term)) return currentScore + 1;
    return currentScore;
  }, 0);

  if (intent.requestedMainCategory && getProductAudience(product) === intent.requestedMainCategory) score += 8;
  if (intent.requestedCategories.includes(product.category)) score += 10;
  score += intent.requestedAttributes.filter((attribute) => haystack.includes(attribute)).length * 6;
  if (typeof product.stock === "number" && product.stock > 0) score += 2;
  if (intent.budget !== null && product.price <= intent.budget) score += 3;

  return score;
};

const filterProductsByIntent = (products, intent) =>
  products.filter((product) => {
    if (intent.requestedMainCategory && getProductAudience(product) !== intent.requestedMainCategory) return false;
    if (intent.requestedCategories.length && !intent.requestedCategories.includes(product.category)) return false;
    if (intent.requestedAttributes.length) {
      const productText = getProductText(product);
      if (!intent.requestedAttributes.every((attribute) => productText.includes(attribute))) return false;
    }
    if (intent.budget !== null && product.price > intent.budget) return false;
    return true;
  });

const buildOutfit = (products, intent) => {
  if (intent.budget === null) return null;

  const availableProducts = filterProductsByIntent(products, {
    ...intent,
    requestedCategories: [],
  })
    .filter((product) => (Number(product.stock) || 0) > 0 && product.price <= intent.budget)
    .sort((a, b) => a.price - b.price);

  const selected = [];
  let total = 0;

  for (const category of OUTFIT_CATEGORY_ORDER) {
    const option = availableProducts.find(
      (product) =>
        product.category === category &&
        !selected.some((selectedProduct) => selectedProduct._id.toString() === product._id.toString()) &&
        total + product.price <= intent.budget,
    );

    if (option) {
      selected.push(option);
      total += option.price;
    }
  }

  return selected.length >= 2 ? { products: selected, total } : null;
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

const formatProductList = (products) =>
  products
    .slice(0, 3)
    .map((product) => `${product.name} (${CURRENCY_SYMBOL}${Number(product.price).toFixed(2)})`)
    .join(", ");

const getFallbackReply = ({ message, products, terms, isGeneralChat, intent, outfit }) => {
  const normalizedMessage = message.toLowerCase();
  const isStockQuestion = /\b(stock|available|availability|have|left)\b/.test(normalizedMessage);
  const isCatalogQuestion = /\b(categories|category|sections|section|men|man|women|woman|baby|babies|kids)\b/.test(
    normalizedMessage,
  );
  const requestedMainCategory = intent.requestedMainCategory;

  if (/\b(what day|what date|today)\b/.test(normalizedMessage)) {
    return `Today is ${getTodayText()}.`;
  }

  if (/\b(hi|hello|hey|good morning|good afternoon|good evening|how are you)\b/.test(normalizedMessage)) {
    return "Hi! I can help you find products, check stock, or suggest something that fits what you are shopping for.";
  }

  if (isGeneralChat) {
    return `I am your shopping assistant. I can chat a little, help you find products, suggest items, and check stock. The main shop sections are ${MAIN_CATEGORIES.join(
      ", ",
    )}, and product types include ${PRODUCT_TYPES.join(
      ", ",
    )}. You can also ask for things like "men's t-shirt under $50" or "suggest a whole outfit under $120."`;
  }

  if (intent.wantsOutfit && intent.budget === null) {
    return "Sure. What budget should I stay under for the whole outfit?";
  }

  if (outfit) {
    const names = outfit.products
      .map((product) => `${product.name} (${CURRENCY_SYMBOL}${Number(product.price).toFixed(2)})`)
      .join(", ");

    return `Here is a complete fit under ${CURRENCY_SYMBOL}${intent.budget.toFixed(
      2,
    )}: ${names}. Total: ${CURRENCY_SYMBOL}${outfit.total.toFixed(2)}, leaving ${CURRENCY_SYMBOL}${(
      intent.budget - outfit.total
    ).toFixed(2)}.`;
  }

  if (!products.length) {
    if (
      intent.requestedCategories.length ||
      intent.requestedAttributes.length ||
      intent.budget !== null ||
      (requestedMainCategory && !isCatalogQuestion)
    ) {
      return "Sorry, we do not have this product yet.";
    }

    if (requestedMainCategory || isCatalogQuestion) {
      const section = requestedMainCategory || "that section";
      return `Yes, the shop has main sections for Women, Men, and Babies. I could not find matching products in ${section} yet, but the product types are ${PRODUCT_TYPES.join(
        ", ",
      )}.`;
    }

    return "I could not find a matching product yet. Try telling me the budget, category, section, color, or style you want, like \"men's t-shirt under $50\".";
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

  if (intent.isRecommendationQuestion || terms.length || intent.isFollowUpAnswer) {
    const names = formatProductList(products);
    const budgetText = intent.budget !== null ? ` under ${CURRENCY_SYMBOL}${intent.budget.toFixed(2)}` : "";
    const sectionText = intent.requestedMainCategory ? ` for ${intent.requestedMainCategory}` : "";
    const categoryText = intent.requestedCategories.length ? ` in ${intent.requestedCategories.join(", ")}` : "";

    return `I found these matching products${sectionText}${categoryText}${budgetText}: ${names}. My top pick is ${products[0].name} in ${
      products[0].mainCategory || "women"
    } / ${products[0].category}.`;
  }

  return "I can help you search products, check whether something is in stock, or suggest items based on what you like.";
};

const polishReplyWithAi = async ({ message, history, products, fallbackReply, intent, outfit }) => {
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
              )}. You can make short, polite small talk and answer harmless basic questions like greetings, the date, what you can do, and what categories the shop has. For product names, stock, prices, calculations, and recommendations, use only the product context provided. Respect the parsed filters exactly. If no product context is provided, ask one concise follow-up question instead of inventing products.`,
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
                text: `Customer message: ${message}\n\nParsed filters:\n${JSON.stringify({
              budget: intent.budget,
              section: intent.requestedMainCategory,
              categories: intent.requestedCategories,
              wantsOutfit: intent.wantsOutfit,
              outfitTotal: outfit?.total,
            })}\n\nMatched product context:\n${
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
    const intent = parseShoppingIntent({ message, history });
    const terms = isGeneralChat ? [] : intent.rankingTerms;
    const catalogProducts = isGeneralChat
      ? []
      : await Product.find({})
          .select("name description price image mainCategory category stock")
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(MAX_CATALOG_PRODUCTS)
          .lean();
    const outfit = intent.wantsOutfit ? buildOutfit(catalogProducts, intent) : null;
    const candidates = outfit ? outfit.products : filterProductsByIntent(catalogProducts, intent);
    const hasHardFilters =
      intent.requestedMainCategory || intent.requestedCategories.length || intent.budget !== null || terms.length;

    const products = candidates
      .map((product) => ({ ...product, matchScore: hasHardFilters ? scoreProduct(product, terms, intent) : 1 }))
      .filter((product) => product.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_MATCHES);

    const fallbackReply = getFallbackReply({ message, products, terms, isGeneralChat, intent, outfit });
    const shouldPolishWithAi = isGeneralChat && !products.length && !outfit;
    const reply = shouldPolishWithAi
      ? await polishReplyWithAi({ message, history, products, fallbackReply, intent, outfit })
      : fallbackReply;

    res.json({
      reply,
      products: products.map(({ matchScore, ...product }) => product),
    });
  } catch (error) {
    console.log("Error in chatWithShopAssistant controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
