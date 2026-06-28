import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";

const welcomeMessage = {
	id: "welcome",
	sender: "bot",
	text: "Hi! Ask me for product ideas, stock checks, or help finding a style.",
	products: [],
};

const Chatbot = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([welcomeMessage]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef(null);

	const chatHistory = useMemo(
		() => messages.filter((message) => message.id !== "welcome").map(({ sender, text }) => ({ sender, text })),
		[messages],
	);

	const handleToggle = () => {
		setIsOpen((current) => !current);
		setTimeout(() => inputRef.current?.focus(), 150);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const text = input.trim();
		if (!text || isLoading) return;

		const userMessage = {
			id: crypto.randomUUID(),
			sender: "user",
			text,
			products: [],
		};

		setMessages((current) => [...current, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			const response = await axios.post("/chatbot", {
				message: text,
				history: chatHistory,
			});

			setMessages((current) => [
				...current,
				{
					id: crypto.randomUUID(),
					sender: "bot",
					text: response.data.reply,
					products: response.data.products || [],
				},
			]);
		} catch {
			setMessages((current) => [
				...current,
				{
					id: crypto.randomUUID(),
					sender: "bot",
					text: "I could not reach the shop assistant right now. Please try again in a moment.",
					products: [],
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='fixed bottom-5 right-5 z-[60] flex flex-col items-end'>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 18, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 18, scale: 0.96 }}
						transition={{ duration: 0.18 }}
						className='mb-4 flex h-[560px] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl shadow-black/40'
					>
						<div className='flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-gray-950'>
									<Bot size={22} />
								</div>
								<div>
									<p className='text-sm font-semibold text-white'>Shop Assistant</p>
									<p className='text-xs text-emerald-300'>Online</p>
								</div>
							</div>
							<button
								type='button'
								onClick={() => setIsOpen(false)}
								className='rounded-full p-2 text-gray-300 transition hover:bg-gray-700 hover:text-white'
								aria-label='Close chat'
							>
								<X size={18} />
							</button>
						</div>

						<div className='flex-1 space-y-3 overflow-y-auto px-4 py-4'>
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 ${
											message.sender === "user"
												? "bg-emerald-600 text-white"
												: "bg-gray-800 text-gray-100"
										}`}
									>
										<p>{message.text}</p>

										{message.products?.length > 0 && (
											<div className='mt-3 space-y-2'>
												{message.products.slice(0, 3).map((product) => (
													<Link
														key={product._id}
														to={`/product/${product._id}`}
														onClick={() => setIsOpen(false)}
														className='flex gap-3 rounded-md bg-gray-950/60 p-2 transition hover:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-emerald-400'
													>
														<img
															src={product.image}
															alt={product.name}
															className='h-14 w-14 flex-none rounded-md object-cover'
														/>
														<div className='min-w-0'>
															<p className='truncate text-sm font-semibold text-white'>{product.name}</p>
															<p className='text-xs text-emerald-300'>${product.price}</p>
															<p className='text-xs text-gray-400'>
																{typeof product.stock === "number"
																	? product.stock > 0
																		? `${product.stock} in stock`
																		: "Out of stock"
																: "Stock not set"}
															</p>
														</div>
													</Link>
												))}
											</div>
										)}
									</div>
								</div>
							))}

							{isLoading && (
								<div className='flex justify-start'>
									<div className='flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-200'>
										<Loader size={16} className='animate-spin text-emerald-300' />
										Thinking...
									</div>
								</div>
							)}
						</div>

						<form onSubmit={handleSubmit} className='flex gap-2 border-t border-gray-700 bg-gray-800 p-3'>
							<input
								ref={inputRef}
								type='text'
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder='Ask about products...'
								className='min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-500'
							/>
							<button
								type='submit'
								disabled={!input.trim() || isLoading}
								className='flex h-10 w-10 flex-none items-center justify-center rounded-md bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50'
								aria-label='Send message'
							>
								<Send size={18} />
							</button>
						</form>
					</motion.div>
				)}
			</AnimatePresence>

			<button
				type='button'
				onClick={handleToggle}
				className='group flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-300 bg-gray-900 shadow-xl shadow-black/40 transition hover:scale-105 hover:border-emerald-200'
				aria-label='Open shop assistant'
			>
				<img
					src='chatbot-green-robot.png'
					alt=''
					className='h-full w-full object-cover opacity-90 transition group-hover:opacity-100'
				/>
			</button>
		</div>
	);
};

export default Chatbot;
