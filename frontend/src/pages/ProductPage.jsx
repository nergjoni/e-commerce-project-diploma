import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";

const ProductPage = () => {
	const { id } = useParams();
	const { addToCart } = useCartStore();
	const { user } = useUserStore();
	const [product, setProduct] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const response = await axios.get(`/products/${id}`);
				setProduct(response.data);
			} catch (error) {
				setError(error.response?.data?.message || "Product not found");
			} finally {
				setIsLoading(false);
			}
		};

		fetchProduct();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className='min-h-screen px-4 py-16'>
				<div className='mx-auto max-w-3xl text-center'>
					<h1 className='text-3xl font-bold text-emerald-400'>{error}</h1>
					<Link to='/' className='mt-6 inline-flex items-center text-emerald-300 hover:text-emerald-200'>
						<ArrowLeft className='mr-2 h-5 w-5' />
						Back to shop
					</Link>
				</div>
			</div>
		);
	}

	const availableStock = Number(product.stock) || 0;
	const isOutOfStock = availableStock <= 0;

	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		}

		addToCart(product);
	};

	return (
		<div className='min-h-screen px-4 py-16'>
			<motion.div
				className='relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-start'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className='overflow-hidden rounded-lg border border-gray-700 bg-gray-800'>
					<img src={product.image} alt={product.name} className='h-full max-h-[640px] w-full object-cover' />
				</div>

				<div className='space-y-6'>
					<Link
						to={`/category/${product.mainCategory || "women"}/${product.category}`}
						className='inline-flex items-center text-sm font-medium text-emerald-300 hover:text-emerald-200'
					>
						<ArrowLeft className='mr-2 h-4 w-4' />
						{product.mainCategory || "women"} / {product.category}
					</Link>

					<div>
						<h1 className='text-4xl font-bold text-white'>{product.name}</h1>
						<p className='mt-4 text-3xl font-bold text-emerald-400'>${product.price.toFixed(2)}</p>
					</div>

					<p className='text-base leading-7 text-gray-300'>{product.description}</p>

					<div className='rounded-lg border border-gray-700 bg-gray-800 p-4'>
						<p className={`text-sm font-medium ${isOutOfStock ? "text-red-300" : "text-emerald-300"}`}>
							{isOutOfStock ? "Out of stock" : `${availableStock} in stock`}
						</p>
					</div>

					<button
						type='button'
						onClick={handleAddToCart}
						disabled={isOutOfStock}
						className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300 sm:w-auto'
					>
						<ShoppingCart className='mr-2 h-5 w-5' />
						{isOutOfStock ? "Out of stock" : "Add to cart"}
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default ProductPage;
