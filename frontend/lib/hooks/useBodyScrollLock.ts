"use client";

import { useEffect } from "react";

type BodyStyleSnapshot = {
	position: string;
	top: string;
	left: string;
	right: string;
	width: string;
	overflow: string;
};

let activeLocks = 0;
let lockedScrollY = 0;
let snapshot: BodyStyleSnapshot | null = null;

const captureBodyStyles = (body: HTMLElement): BodyStyleSnapshot => ({
	position: body.style.position,
	top: body.style.top,
	left: body.style.left,
	right: body.style.right,
	width: body.style.width,
	overflow: body.style.overflow,
});

const applyBodyLock = () => {
	if (typeof window === "undefined") {
		return;
	}

	const body = document.body;
	if (!body) {
		return;
	}

	if (activeLocks === 0) {
		snapshot = captureBodyStyles(body);
		lockedScrollY = window.scrollY;

		body.style.position = "fixed";
		body.style.top = `-${lockedScrollY}px`;
		body.style.left = "0";
		body.style.right = "0";
		body.style.width = "100%";
		body.style.overflow = "hidden";
	}

	activeLocks += 1;
};

const releaseBodyLock = () => {
	if (typeof window === "undefined") {
		return;
	}

	const body = document.body;
	if (!body || activeLocks === 0) {
		return;
	}

	activeLocks -= 1;
	if (activeLocks > 0) {
		return;
	}

	if (snapshot) {
		body.style.position = snapshot.position;
		body.style.top = snapshot.top;
		body.style.left = snapshot.left;
		body.style.right = snapshot.right;
		body.style.width = snapshot.width;
		body.style.overflow = snapshot.overflow;
		snapshot = null;
	}

	window.scrollTo(0, lockedScrollY);
};

export function useBodyScrollLock(locked: boolean): void {
	useEffect(() => {
		if (!locked) {
			return;
		}

		applyBodyLock();
		return () => {
			releaseBodyLock();
		};
	}, [locked]);
}
