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
			className="fixed bottom-6 right-6 z-50 flex animate-slide-up items-center gap-2 rounded-full bg-brand-primary px-6 py-4 font-bold text-white shadow-float transition-[background-color,transform] hover:bg-brand-primary-hover active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
			aria-label="اكتب طلبك"
		>
			<span className="text-xl">✍️</span>
			<span className="text-sm">اكتب طلبك</span>
		</button>
	);
}
