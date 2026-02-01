import { Tenant } from "@/types/models/tenant";

export default function StoreHeader({ tenant }: { tenant: Tenant }) {
    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 shadow-lg mb-6 rounded-b-[2rem]">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-inner border border-white/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-10 h-10 text-white"
                    >
                      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                      <path d="M2 7h20" />
                      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{tenant.name}</h1>
                    <p className="text-indigo-100 font-medium bg-white/10 px-4 py-1.5 rounded-full text-sm inline-block">
                        Your offline store, now online
                    </p>
                </div>
            </div>
        </div>
    );
}
