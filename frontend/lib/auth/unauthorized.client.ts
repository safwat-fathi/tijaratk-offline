const LOGIN_ROUTE = "/merchant/login";
let isRevokingSession = false;

export async function revokeSessionAndRedirectClient(): Promise<void> {
	if (isRevokingSession) {
		window.location.replace(LOGIN_ROUTE);
		return;
	}

	isRevokingSession = true;

	try {
		await fetch("/api/auth/session/revoke", {
			method: "POST",
			credentials: "include",
			cache: "no-store",
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch {
		// Best effort revoke.
	}

	window.location.replace(LOGIN_ROUTE);
}
