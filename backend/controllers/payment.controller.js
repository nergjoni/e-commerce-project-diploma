import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		const productIds = products.map((product) => product._id);
		const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
		const productMap = new Map(dbProducts.map((product) => [product._id.toString(), product]));

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const dbProduct = productMap.get(product._id);
			const quantity = Number(product.quantity) || 1;

			if (!dbProduct) {
				const error = new Error(`${product.name || "A product"} is no longer available`);
				error.statusCode = 400;
				throw error;
			}

			const availableStock = Number(dbProduct.stock) || 0;
			if (availableStock < quantity) {
				const error = new Error(`Only ${availableStock} ${dbProduct.name} available`);
				error.statusCode = 400;
				throw error;
			}

			const amount = Math.round(dbProduct.price * 100); // stripe wants u to send in the format of cents
			totalAmount += amount * quantity;

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: dbProduct.name,
						images: [dbProduct.image],
					},
					unit_amount: amount,
				},
				quantity,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: productMap.get(p._id)?.price || p.price,
					}))
				),
			},
		});

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(error.statusCode || 500).json({ message: error.message || "Error processing checkout" });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status !== "paid") {
			return res.status(400).json({ message: "Payment has not been completed" });
		}

		const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
		if (existingOrder) {
			return res.status(200).json({
				success: true,
				message: "Payment already processed.",
				orderId: existingOrder._id,
			});
		}

		const products = JSON.parse(session.metadata.products);
		const dbSession = await mongoose.startSession();
		let newOrder;

		try {
			await dbSession.withTransaction(async () => {
				if (session.metadata.couponCode) {
					await Coupon.findOneAndUpdate(
						{
							code: session.metadata.couponCode,
							userId: session.metadata.userId,
						},
						{
							isActive: false,
						},
						{ session: dbSession }
					);
				}

				const dbProducts = await Product.find({ _id: { $in: products.map((product) => product.id) } }).session(
					dbSession
				);
				const productMap = new Map(dbProducts.map((product) => [product._id.toString(), product]));

				for (const product of products) {
					const dbProduct = productMap.get(product.id);
					const quantity = Number(product.quantity) || 1;

					if (!dbProduct) {
						const error = new Error("One of the purchased products no longer exists");
						error.statusCode = 404;
						throw error;
					}

					const availableStock = Number(dbProduct.stock) || 0;
					if (availableStock < quantity) {
						const error = new Error(
							`Only ${availableStock} ${dbProduct.name} available. Please contact support for this paid order.`
						);
						error.statusCode = 400;
						throw error;
					}
				}

				const stockUpdate = await Product.bulkWrite(
					products.map((product) => ({
						updateOne: {
							filter: { _id: product.id, stock: { $gte: Number(product.quantity) || 1 } },
							update: { $inc: { stock: -(Number(product.quantity) || 1) } },
						},
					})),
					{ session: dbSession }
				);

				if (stockUpdate.modifiedCount !== products.length) {
					const error = new Error("A product in your order no longer has enough stock");
					error.statusCode = 400;
					throw error;
				}

				newOrder = new Order({
					user: session.metadata.userId,
					products: products.map((product) => ({
						product: product.id,
						quantity: product.quantity,
						price: product.price,
					})),
					totalAmount: session.amount_total / 100, // convert from cents to dollars,
					stripeSessionId: sessionId,
				});

				await newOrder.save({ session: dbSession });
			});
		} finally {
			await dbSession.endSession();
		}

		res.status(200).json({
			success: true,
			message: "Payment successful, order created, stock updated, and coupon deactivated if used.",
			orderId: newOrder._id,
		});
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(error.statusCode || 500).json({ message: error.message || "Error processing successful checkout" });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}
