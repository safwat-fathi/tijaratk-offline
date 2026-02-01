"use client";

import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = "error", onClose, duration = 4000 }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Wait for animation
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform ${visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"} ${type === "error" ? "bg-white border-red-100 text-red-600" : "bg-white border-green-100 text-green-600"}`}>
            <div className={`p-1 rounded-full ${type === "error" ? "bg-red-50" : "bg-green-50"}`}>
                {type === "error" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
            </div>
            <p className="font-medium text-sm">{message}</p>
            <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    );
}
