"use client";

import {
	type ColumnFiltersState,
	columnFilteringFeature,
	columnVisibilityFeature,
	createColumnHelper,
	createExpandedRowModel,
	createFilteredRowModel,
	createSortedRowModel,
	FlexRender,
	metaHelper,
	type Row,
	rowExpandingFeature,
	rowSortingFeature,
	type SortDirection,
	sortFn_text,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { cn } from "cn";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronDown,
	ChevronRight,
	Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useState, useTransition } from "react";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { EditProjectControls } from "@/components/edit-project-controls";
import { ProjectRow } from "@/components/project-row";
import { RefreshProjectButton } from "@/components/refresh-project-button";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type Project,
	type ProjectStatus,
	type ProjectUpdatePayload,
	updateProject,
} from "@/lib/api";

const features = tableFeatures({
	columnFilteringFeature,
	filteredRowModel: createFilteredRowModel(),
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	rowExpandingFeature,
	expandedRowModel: createExpandedRowModel(),
	columnVisibilityFeature,
	columnMeta: metaHelper<{ className?: string }>(),
});

export type ProjectTableRow = Row<typeof features, Project>;

const STATUS_STYLES: Record<ProjectStatus, string> = {
	no_link: "bg-muted text-muted-foreground",
	no_access: "bg-red-500/10 text-red-700 dark:text-red-400",
	in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	complete: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
	no_link: "No link",
	no_access: "No access",
	in_progress: "In progress",
	complete: "Complete",
};

function StatusBadge({ status }: { status: ProjectStatus }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
				STATUS_STYLES[status],
			)}
		>
			{STATUS_LABELS[status]}
		</span>
	);
}

interface SortableColumn {
	getIsSorted: () => false | SortDirection;
	toggleSorting: (desc?: boolean) => void;
}

function SortableHeader({
	column,
	label,
}: {
	column: SortableColumn;
	label: string;
}) {
	const sorted = column.getIsSorted();
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="-ml-2.5"
			onClick={() => column.toggleSorting(sorted === "asc")}
		>
			{label}
			{sorted === "asc" ? (
				<ArrowUp />
			) : sorted === "desc" ? (
				<ArrowDown />
			) : (
				<ArrowUpDown />
			)}
		</Button>
	);
}

const helper = createColumnHelper<typeof features, Project>();

interface EditContext {
	editingId: number | null;
	draft: ProjectUpdatePayload;
	saving: boolean;
	saveError: string | null;
	onStartEdit: (project: Project) => void;
	onDraftChange: (field: keyof ProjectUpdatePayload, value: string) => void;
	onSave: () => void;
	onCancel: () => void;
}

function buildColumns(edit: EditContext) {
	const isEditing = (project: Project) => project.id === edit.editingId;
	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") edit.onSave();
		else if (event.key === "Escape") edit.onCancel();
	};

	return helper.columns([
		helper.display({
			id: "expander",
			header: () => <span className="sr-only">Expand</span>,
			cell: ({ row }) => (
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					aria-expanded={row.getIsExpanded()}
					aria-label={
						row.getIsExpanded()
							? `Collapse commit details for ${row.original.name}`
							: `Expand commit details for ${row.original.name}`
					}
					onClick={row.getToggleExpandedHandler()}
				>
					{row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
				</Button>
			),
			enableSorting: false,
			meta: { className: "w-8 pr-0" },
		}),
		helper.accessor("name", {
			header: ({ column }) => <SortableHeader column={column} label="Name" />,
			sortFn: sortFn_text,
			cell: (info) =>
				isEditing(info.row.original) ? (
					<Input
						value={edit.draft.name}
						onChange={(event) => edit.onDraftChange("name", event.target.value)}
						onKeyDown={handleKeyDown}
						aria-label="Project name"
						disabled={edit.saving}
						className="min-w-32"
					/>
				) : (
					info.getValue()
				),
			meta: { className: "font-medium" },
		}),
		helper.accessor("status", {
			header: ({ column }) => <SortableHeader column={column} label="Status" />,
			cell: (info) => <StatusBadge status={info.getValue()} />,
			sortFn: sortFn_text,
		}),
		helper.accessor("total_commits", {
			header: ({ column }) => (
				<SortableHeader column={column} label="Commits" />
			),
			cell: (info) => info.getValue() ?? "—",
			sortFn: (rowA, rowB, columnId) => {
				const a = rowA.getValue<number | null>(columnId);
				const b = rowB.getValue<number | null>(columnId);
				if (a == null && b == null) return 0;
				if (a == null) return 1;
				if (b == null) return -1;
				return a - b;
			},
		}),
		helper.accessor("git_url", {
			header: "Git URL",
			enableSorting: false,
			cell: (info) => {
				if (isEditing(info.row.original)) {
					return (
						<Input
							value={edit.draft.git_url}
							onChange={(event) =>
								edit.onDraftChange("git_url", event.target.value)
							}
							onKeyDown={handleKeyDown}
							aria-label="Git URL"
							disabled={edit.saving}
							className="min-w-56"
						/>
					);
				}
				const url = info.getValue();
				return url ? (
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						className="block max-w-48 truncate text-primary underline-offset-4 hover:underline"
					>
						{url}
					</a>
				) : (
					"—"
				);
			},
		}),
		helper.accessor("devpost_url", {
			header: "Devpost URL",
			enableSorting: false,
			cell: (info) =>
				isEditing(info.row.original) ? (
					<Input
						value={edit.draft.devpost_url}
						onChange={(event) =>
							edit.onDraftChange("devpost_url", event.target.value)
						}
						onKeyDown={handleKeyDown}
						aria-label="Devpost URL"
						disabled={edit.saving}
						className="min-w-56"
					/>
				) : (
					<a
						href={info.getValue()}
						target="_blank"
						rel="noreferrer"
						className="block max-w-48 truncate text-primary underline-offset-4 hover:underline"
					>
						{info.getValue()}
					</a>
				),
		}),
		helper.accessor((project) => project.last_commit?.date ?? null, {
			id: "last_commit",
			enableSorting: false,
			filterFn: (row, columnId, filterValue) => {
				const iso = row.getValue<string | null>(columnId);
				if (iso == null) return false;
				// Interpret the datetime-local value as UTC-6
				return new Date(iso) >= new Date(`${String(filterValue)}:00-06:00`);
			},
		}),
		helper.display({
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			cell: ({ row }) =>
				isEditing(row.original) ? (
					<EditProjectControls
						projectName={row.original.name}
						saving={edit.saving}
						error={edit.saveError}
						onSave={edit.onSave}
						onCancel={edit.onCancel}
					/>
				) : (
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							aria-label={`Edit ${row.original.name}`}
							title={`Edit ${row.original.name}`}
							onClick={() => edit.onStartEdit(row.original)}
						>
							<Pencil />
						</Button>
						<RefreshProjectButton
							projectId={row.original.id}
							projectName={row.original.name}
						/>
						<DeleteProjectButton
							projectId={row.original.id}
							projectName={row.original.name}
						/>
					</div>
				),
			enableSorting: false,
		}),
	]);
}

export function ProjectsTableClient({ projects }: { projects: Project[] }) {
	const router = useRouter();
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [draft, setDraft] = useState<ProjectUpdatePayload>({
		name: "",
		git_url: "",
		devpost_url: "",
	});
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	function startEditing(project: Project) {
		setEditingId(project.id);
		setDraft({
			name: project.name,
			git_url: project.git_url,
			devpost_url: project.devpost_url,
		});
		setSaveError(null);
	}

	function cancelEditing() {
		setEditingId(null);
		setSaveError(null);
	}

	function updateDraft(field: keyof ProjectUpdatePayload, value: string) {
		setDraft((previous) => ({ ...previous, [field]: value }));
	}

	async function saveEditing() {
		if (editingId === null || saving) return;
		const payload = {
			name: draft.name.trim(),
			git_url: draft.git_url.trim(),
			devpost_url: draft.devpost_url.trim(),
		};
		if (!payload.name || !payload.devpost_url) {
			setSaveError("Name and Devpost URL are required");
			return;
		}
		setSaving(true);
		setSaveError(null);
		try {
			await updateProject(editingId, payload);
			setEditingId(null);
			startTransition(() => {
				router.refresh();
			});
		} catch (error) {
			setSaveError(
				error instanceof Error ? error.message : "Failed to update project",
			);
		} finally {
			setSaving(false);
		}
	}

	const columns = buildColumns({
		editingId,
		draft,
		saving,
		saveError,
		onStartEdit: startEditing,
		onDraftChange: updateDraft,
		onSave: saveEditing,
		onCancel: cancelEditing,
	});

	const table = useTable({
		features,
		columns,
		data: projects,
		getRowId: (project) => String(project.id),
		getRowCanExpand: () => true,
		state: { columnFilters },
		onColumnFiltersChange: setColumnFilters,
		initialState: { columnVisibility: { last_commit: false } },
	});

	const cutoffValue = columnFilters.find(
		(filter) => filter.id === "last_commit",
	)?.value;
	const cutoff = typeof cutoffValue === "string" ? cutoffValue : "";
	const setCutoff = (value: string) =>
		setColumnFilters(value ? [{ id: "last_commit", value }] : []);

	const rows = table.getRowModel().rows;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects</CardTitle>
				<CardDescription>
					{table.getFilteredRowModel().rows.length} of {projects.length} project
					{projects.length === 1 ? "" : "s"} tracked
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="flex items-end gap-2">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="commit-filter">Last commit after (UTC-6)</Label>
						<Input
							id="commit-filter"
							type="datetime-local"
							value={cutoff}
							onChange={(e) => setCutoff(e.target.value)}
							className="w-auto"
						/>
					</div>
					{cutoff && (
						<Button variant="outline" size="sm" onClick={() => setCutoff("")}>
							Clear
						</Button>
					)}
				</div>
				{rows.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{projects.length === 0
							? "No projects yet — upload a CSV to get started."
							: "No projects match the filter."}
					</p>
				) : (
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : (
												<FlexRender header={header} />
											)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<ProjectRow key={row.id} row={row} />
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
