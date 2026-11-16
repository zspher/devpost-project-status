"use client";

import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditProjectControlsProps {
	projectName: string;
	saving: boolean;
	error: string | null;
	onSave: () => void;
	onCancel: () => void;
}

export function EditProjectControls({
	projectName,
	saving,
	error,
	onSave,
	onCancel,
}: EditProjectControlsProps) {
	return (
		<span className="inline-flex items-center gap-2">
			<Button
				type="button"
				variant="default"
				size="icon-xs"
				aria-label={`Save ${projectName}`}
				title={`Save ${projectName}`}
				onClick={onSave}
				disabled={saving}
			>
				{saving ? <Loader2 className="animate-spin" /> : <Check />}
			</Button>
			<Button
				type="button"
				variant="outline"
				size="icon-xs"
				aria-label={`Cancel editing ${projectName}`}
				title={`Cancel editing ${projectName}`}
				onClick={onCancel}
				disabled={saving}
			>
				<X />
			</Button>
			{error && <span className="text-xs text-destructive">{error}</span>}
		</span>
	);
}
