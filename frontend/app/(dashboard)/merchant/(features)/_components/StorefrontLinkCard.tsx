"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface StorefrontLinkCardProps {
	slug?: string;
}

type CopyState = "idle" | "copied" | "error";

export default function StorefrontLinkCard({ slug }: StorefrontLinkCardProps) {
	const [copyState, setCopyState] = useState<CopyState>("idle");
	const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const storePath = useMemo(() => {
		if (!slug) return null;
		const trimmed = slug.trim();
		return trimmed ? `/${trimmed}` : null;
	}, [slug]);

	useEffect(() => {
		return () => {
			if (resetTimerRef.current) {
				clearTimeout(resetTimerRef.current);
			}
		};
	}, []);

	const showCopyFeedback = (state: CopyState) => {
		setCopyState(state);
		if (resetTimerRef.current) {
			clearTimeout(resetTimerRef.current);
		}

		resetTimerRef.current = setTimeout(() => {
			setCopyState("idle");
		}, 1800);
	};

	const handleCopy = async () => {
		if (!storePath || typeof window === "undefined") {
			return;
		}

		const storeUrl = `${window.location.origin}${storePath}`;

		try {
			await navigator.clipboard.writeText(storeUrl);
			showCopyFeedback("copied");
		} catch {
			showCopyFeedback("error");
		}
	};

	return (
		<div className="relative overflow-hidden rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
			<div className="pointer-events-none absolute -top-8 start-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

			{copyState !== "idle" && (
				<div
					role="status"
					aria-live="polite"
					className={`absolute top-3 end-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium shadow-sm animate-fade-in ${
						copyState === "copied"
							? "border-emerald-200 bg-emerald-50 text-emerald-700 animate-pulse-soft"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{copyState === "copied" ? (
						<svg
							className="h-3.5 w-3.5"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="2.2"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m4.5 12.75 6 6 9-13.5"
							/>
						</svg>
					) : (
						<svg
							className="h-3.5 w-3.5"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="2"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
							/>
						</svg>
					)}
					<span>{copyState === "copied" ? "تم نسخ الرابط" : "تعذر نسخ الرابط"}</span>
				</div>
			)}

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-primary">
							<svg
								className="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="2"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13.19 8.688a4.5 4.5 0 0 1 6.364 0l.758.758a4.5 4.5 0 0 1 0 6.364l-1.036 1.036a4.5 4.5 0 0 1-6.364 0m-1.428-1.428a4.5 4.5 0 0 1 0-6.364l1.036-1.036a4.5 4.5 0 0 1 6.364 0"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m9.75 14.25 4.5-4.5"
								/>
							</svg>
						</span>
						<p className="text-sm font-semibold text-foreground">رابط متجرك</p>
					</div>
					<p className="text-xs text-muted-foreground">
						شارك الرابط مع عملائك للطلب مباشرة
					</p>
					<p className="mt-1 truncate text-xs font-medium text-primary" dir="ltr">
						{storePath ?? "الرابط غير متاح حالياً"}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link
					prefetch={true}
						href={storePath ?? "#"}
						target="_blank"
						rel="noreferrer"
						aria-disabled={!storePath}
						className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
							storePath
								? "bg-white text-primary hover:bg-primary/10"
								: "pointer-events-none bg-gray-100 text-gray-400"
						}`}
					>
						<svg
							className="me-1 h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="2"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5 0 6-6m0 0H15m4.5 0V9"
							/>
						</svg>
						معاينة
					</Link>
					<button
						type="button"
						onClick={handleCopy}
						disabled={!storePath}
						className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
					>
						{copyState === "copied" ? (
							<svg
								className="me-1 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="2.2"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m4.5 12.75 6 6 9-13.5"
								/>
							</svg>
						) : (
							<svg
								className="me-1 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="2"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.499A1.125 1.125 0 0 1 3.374 20.625V10.5c0-.621.504-1.125 1.125-1.125H7.5m8.25-6H11.25m4.5 0H18a2.25 2.25 0 0 1 2.25 2.25v11.25A2.25 2.25 0 0 1 18 19.125h-6.75A2.25 2.25 0 0 1 9 16.875V6.375a2.25 2.25 0 0 1 2.25-2.25h4.5Z"
								/>
							</svg>
						)}
						نسخ الرابط
					</button>
				</div>
			</div>
		</div>
	);
}
