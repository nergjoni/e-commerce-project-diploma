import { useEffect, useState } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";

const categorySections = [
	{
		key: "women",
		name: "Women",
		description: "Everyday clothing, polished outfits, bags, shoes, and accessories.",
		imageUrl: "women/women-category.jpg",
		categories: [
			{ name: "Jeans", slug: "jeans", imageUrl: "/women/jeans.jpg" },
			{ name: "T-shirts", slug: "t-shirts", imageUrl: "/women/tshirts.jpg" },
			{ name: "Shoes", slug: "shoes", imageUrl: "/women/shoes.jpg" },
			{ name: "Glasses", slug: "glasses", imageUrl: "/women/glasses.jpg" },
			{ name: "Jackets", slug: "jackets", imageUrl: "/women/jackets.jpg" },
			{ name: "Bags", slug: "bags", imageUrl: "/women/bags.jpg" },
		],
	},
	{
		key: "men",
		name: "Men",
		description: "Sharp essentials, relaxed staples, footwear, and useful accessories.",
		imageUrl: "men/men-category.jpg",
		categories: [
			{ name: "Jeans", slug: "jeans", imageUrl: "/men/jeans.jpg" },
			{ name: "T-shirts", slug: "t-shirts", imageUrl: "/men/tshirts.jpg" },
			{ name: "Shoes", slug: "shoes", imageUrl: "/men/shoes.jpg" },
			{ name: "Glasses", slug: "glasses", imageUrl: "/men/glasses.png" },
			{ name: "Jackets", slug: "jackets", imageUrl: "/men/jackets.jpg" },
			{ name: "Bags", slug: "bags", imageUrl: "/men/bags.jpg" },
		],
	},
	{
		key: "babies",
		name: "Babies",
		description: "Soft outfits, tiny layers, comfortable shoes, and sweet accessories.",
		imageUrl: "babies/babies-category.jpg",
		categories: [
			{ name: "Jeans", slug: "jeans", imageUrl: "/babies/jeans.jpg" },
			{ name: "T-shirts", slug: "t-shirts", imageUrl: "/babies/tshirts.jpg" },
			{ name: "Shoes", slug: "shoes", imageUrl: "/babies/shoes.jpg" },
			{ name: "Glasses", slug: "glasses", imageUrl: "/babies/glasses.jpg" },
			{ name: "Jackets", slug: "jackets", imageUrl: "/babies/jackets.jpg" },
			{ name: "Bags", slug: "bags", imageUrl: "/babies/bags.png" },
		],
	},
];

const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);

	useEffect(() => {
		fetchFeaturedProducts();
	}, [fetchFeaturedProducts]);

	useEffect(() => {
		const trimmedSearch = searchTerm.trim();
		if (!trimmedSearch) {
			setSearchResults([]);
			return;
		}

		const timeoutId = setTimeout(async () => {
			setIsSearching(true);
			try {
				const response = await axios.get(`/products/search?q=${encodeURIComponent(trimmedSearch)}`);
				setSearchResults(response.data.products || []);
			} catch {
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 250);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	return (
		<div className='relative min-h-screen text-white overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<section className='mx-auto mb-16 max-w-4xl text-center'>
					<h1 className='text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>Find Your Next Fit</h1>
					<p className='text-xl text-gray-300 mb-8'>
						Search clothes and accessories for women, men, and babies.
					</p>

					<div className='relative mx-auto max-w-3xl'>
						<div className='flex items-center gap-3 rounded-full border border-gray-700 bg-gray-800/90 p-2 shadow-lg shadow-black/30 focus-within:border-emerald-400'>
							<Search className='ml-4 h-5 w-5 text-gray-400' />
							<input
								type='search'
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder='What are you shopping for today?'
								className='min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-white outline-none placeholder:text-gray-400'
							/>
							<Link
								to={searchResults[0] ? `/product/${searchResults[0]._id}` : "/category/women"}
								className='flex h-11 w-11 flex-none items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500'
								aria-label='Open top search result'
							>
								<ArrowRight className='h-5 w-5' />
							</Link>
						</div>

						{searchTerm.trim() && (
							<div className='absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-left shadow-2xl shadow-black/40'>
								{isSearching && <p className='px-4 py-3 text-sm text-gray-300'>Searching...</p>}

								{!isSearching && searchResults.length === 0 && (
									<p className='px-4 py-3 text-sm text-gray-300'>No matching products found.</p>
								)}

								{!isSearching &&
									searchResults.map((product) => (
										<Link
											key={product._id}
											to={`/product/${product._id}`}
											className='flex items-center gap-3 border-b border-gray-800 px-4 py-3 transition last:border-b-0 hover:bg-gray-800'
										>
											<img
												src={product.image}
												alt={product.name}
												className='h-14 w-14 flex-none rounded-md object-cover'
											/>
											<div className='min-w-0 flex-1'>
												<p className='truncate text-sm font-semibold text-white'>{product.name}</p>
												<p className='text-xs capitalize text-gray-400'>
													{product.mainCategory || "women"} / {product.category}
												</p>
											</div>
											<p className='text-sm font-semibold text-emerald-300'>${product.price}</p>
										</Link>
									))}
							</div>
						)}
					</div>

					<div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
						{categorySections.map((section) => (
							<Link
								key={section.key}
								to={`/category/${section.key}`}
								className='group inline-flex h-14 items-center gap-3 rounded-full border border-emerald-500/20 bg-gray-800/85 py-2 pl-2 pr-5 text-base font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-950'
							>
								<span className='flex h-10 w-10 overflow-hidden rounded-full border border-emerald-400/30 bg-gray-900'>
									<img
										src={section.imageUrl}
										alt=''
										className='h-full w-full object-cover transition duration-300 group-hover:scale-110'
										loading='lazy'
									/>
								</span>
								<span>{section.name}</span>
							</Link>
						))}
					</div>
				</section>

				<div className='space-y-16'>
					{categorySections.map((section) => (
						<section key={section.key}>
							<div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
								<div>
									<h2 className='text-3xl font-bold text-emerald-400'>{section.name}</h2>
									<p className='mt-2 max-w-2xl text-gray-300'>{section.description}</p>
								</div>
								<Link
									to={`/category/${section.key}`}
									className='inline-flex items-center text-sm font-semibold text-emerald-300 hover:text-emerald-200'
								>
									View all {section.name}
									<ArrowRight className='ml-2 h-4 w-4' />
								</Link>
							</div>

							<div className='mb-4 overflow-hidden rounded-lg border border-emerald-500/30 bg-gray-800'>
								<img src={section.imageUrl} alt={section.name} className='h-56 w-full object-cover' />
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
								{section.categories.map((category) => (
									<CategoryItem
										key={`${section.key}-${category.slug}`}
										category={{
											name: category.name,
											imageUrl: category.imageUrl,
											href: `/category/${section.key}/${category.slug}`,
										}}
									/>
								))}
							</div>
						</section>
					))}
				</div>

				{!loading && products.length > 0 && <FeaturedProducts featuredProducts={products} />}
			</div>
		</div>
	);
};
export default HomePage;
