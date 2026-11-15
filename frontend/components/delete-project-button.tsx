"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/api";

interface DeleteProjectButtonProps {
	projectId: number;
	projectName: string;
}

export function DeleteProjectButton({
	projectId,
	projectName,
}: DeleteProjectButtonProps) {
	const router = useRouter();
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	async function handleDelete() {
		if (
			!window.confirm(
				`Delete "${projectName}"? This removes the project and its local repo clone.`,
			)
		) {
			return;
		}
		setDeleting(true);
		setError(null);
		try {
			await deleteProject(projectId);
			startTransition(() => {
				router.refresh();
			});
		} catch {
			setError("Delete failed");
			setDeleting(false);
		}
	}

	return (
		<span className="inline-flex items-center gap-2">
			<Button
				type="button"
				variant="destructive"
				size="icon-xs"
				aria-label={`Delete ${projectName}`}
				title={`Delete ${projectName}`}
				onClick={handleDelete}
				disabled={deleting}
			>
				{deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
			</Button>
			{error && <span className="text-xs text-destructive">{error}</span>}
		</span>
	);
}
