import dotenv from "dotenv";
import Product from "../models/product.model.js";
import { connectDB } from "../lib/db.js";

dotenv.config();

const DEFAULT_MAIN_CATEGORY = process.env.DEFAULT_PRODUCT_MAIN_CATEGORY || "women";

const run = async () => {
  await connectDB();

  const result = await Product.updateMany(
    {
      $or: [{ mainCategory: { $exists: false } }, { mainCategory: null }, { mainCategory: "" }],
    },
    {
      $set: { mainCategory: DEFAULT_MAIN_CATEGORY },
    },
  );

  console.log(`Updated ${result.modifiedCount} products with main category ${DEFAULT_MAIN_CATEGORY}.`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to backfill product main categories:", error);
  process.exit(1);
});
