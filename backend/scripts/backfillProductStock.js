import dotenv from "dotenv";
import Product from "../models/product.model.js";
import { connectDB } from "../lib/db.js";

dotenv.config();

const DEFAULT_STOCK = Number(process.env.DEFAULT_PRODUCT_STOCK) || 10;

const run = async () => {
  await connectDB();

  const result = await Product.updateMany(
    {
      $or: [{ stock: { $exists: false } }, { stock: null }],
    },
    {
      $set: { stock: DEFAULT_STOCK },
    },
  );

  console.log(`Updated ${result.modifiedCount} products with stock ${DEFAULT_STOCK}.`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to backfill product stock:", error);
  process.exit(1);
});
