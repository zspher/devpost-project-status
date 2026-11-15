"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshProject } from "@/lib/api";

interface RefreshProjectButtonProps {
	projectId: number;
	projectName: string;
}

export function RefreshProjectButton({
	projectId,
	projectName,
}: RefreshProjectButtonProps) {
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	async function handleRefresh() {
		setRefreshing(true);
		setError(null);
		try {
			await refreshProject(projectId);
			startTransition(() => {
				router.refresh();
			});
		} catch {
			setError("Refresh failed");
			setRefreshing(false);
		}
	}

	return (
		<span className="inline-flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="icon-xs"
				aria-label={`Refresh ${projectName}`}
				title={`Refresh ${projectName}`}
				onClick={handleRefresh}
				disabled={refreshing}
			>
				{refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
			</Button>
			{error && <span className="text-xs text-destructive">{error}</span>}
		</span>
	);
}
