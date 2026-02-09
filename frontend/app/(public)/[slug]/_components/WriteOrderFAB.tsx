"use client";

import { useEffect, useState } from "react";

export default function WriteOrderFAB() {
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const handleScroll = () => {
			// Check if we are near the bottom of the page or near the order notes
			const orderNotes = document.getElementById("order-notes");
			if (orderNotes) {
				const rect = orderNotes.getBoundingClientRect();
				const isNear = rect.top < window.innerHeight - 100; // Adjust threshold as needed
				setIsVisible(!isNear);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToOrderNotes = () => {
		const element = document.getElementById("order-notes");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
			const textarea = element.querySelector("textarea");
			if (textarea) {
				textarea.focus();
			}
		}
	};

	if (!isVisible) return null;

	return (
		<button
			onClick={scrollToOrderNotes}
			className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-bold py-4 px-6 rounded-full shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 animate-slide-up"
			aria-label="Write Order"
		>
			<span className="text-xl">✍️</span>
			<span className="text-sm">اكتب طلبك</span>
		</button>
	);
}
