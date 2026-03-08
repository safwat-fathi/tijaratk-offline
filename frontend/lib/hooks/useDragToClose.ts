import { useEffect, useRef } from "react";

interface UseDragToCloseOptions {
	onClose: () => void;
	/** Minimum distance (in px) to drag down before triggering close. */
	dragThreshold?: number;
	/** Pass the open state if the sheet element is conditionally rendered to re-trigger the effect. */
	isOpen?: boolean;
}

export function useDragToClose<T extends HTMLElement>({
	onClose,
	dragThreshold = 100,
	isOpen = true,
}: UseDragToCloseOptions) {
	const sheetRef = useRef<T>(null);

	useEffect(() => {
		const sheet = sheetRef.current;
		if (!sheet || !isOpen) return;

		let startY = 0;
		let currentY = 0;
		let isDragging = false;
		let startScrollTop = 0;

		const handleTouchStart = (e: TouchEvent) => {
			// Find if the target is inside a scrollable container
			const target = e.target as HTMLElement;
			const scrollableContainer = target.closest(".overflow-y-auto");
			
			// Let native scroll happen if we are not at the very top of the scrollable container
			if (scrollableContainer && scrollableContainer.scrollTop > 0) {
				return;
			}

			startY = e.touches[0].clientY;
			currentY = startY;
			isDragging = true;
			startScrollTop = scrollableContainer ? scrollableContainer.scrollTop : 0;
			sheet.style.transition = "none";
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (!isDragging) return;
			
			const target = e.target as HTMLElement;
			const scrollableContainer = target.closest(".overflow-y-auto");
			if (scrollableContainer && scrollableContainer.scrollTop > 0) {
				// User started scrolling the content down, abort drag
				isDragging = false;
				sheet.style.transition = "transform 0.2s ease-out";
				sheet.style.transform = "translateY(0)";
				return;
			}

			currentY = e.touches[0].clientY;
			const deltaY = currentY - startY;

			// Only allow dragging downwards
			if (deltaY > 0 && startScrollTop <= 0) {
				// Prevent pull-to-refresh or weird scrolling
				if (e.cancelable) {
					e.preventDefault();
				}
				sheet.style.transform = `translateY(${deltaY}px)`;
			}
		};

		const handleTouchEnd = () => {
			if (!isDragging) return;
			isDragging = false;
			const deltaY = currentY - startY;

			if (deltaY > dragThreshold && startScrollTop <= 0) {
				sheet.style.transition = "transform 0.2s ease-out";
				sheet.style.transform = `translateY(100%)`;
				// Wait for animation to complete before closing
				setTimeout(() => {
					onClose();
				}, 200);
			} else {
				// Snap back
				sheet.style.transition = "transform 0.2s ease-out";
				sheet.style.transform = "translateY(0)";
				setTimeout(() => {
					if (sheetRef.current) {
						sheetRef.current.style.transition = "";
					}
				}, 200);
			}
		};

		sheet.addEventListener("touchstart", handleTouchStart, { passive: false });
		sheet.addEventListener("touchmove", handleTouchMove, { passive: false });
		sheet.addEventListener("touchend", handleTouchEnd);
		sheet.addEventListener("touchcancel", handleTouchEnd);

		return () => {
			sheet.removeEventListener("touchstart", handleTouchStart);
			sheet.removeEventListener("touchmove", handleTouchMove);
			sheet.removeEventListener("touchend", handleTouchEnd);
			sheet.removeEventListener("touchcancel", handleTouchEnd);
		};
	}, [onClose, dragThreshold, isOpen]);

	return sheetRef;
}
