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
} from "lucide-react";
import { useState } from "react";
import { DeleteProjectButton } from "@/components/delete-project-button";
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
import type { Project, ProjectStatus } from "@/lib/api";

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

const columns = helper.columns([
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
		meta: { className: "font-medium" },
	}),
	helper.accessor("status", {
		header: ({ column }) => <SortableHeader column={column} label="Status" />,
		cell: (info) => <StatusBadge status={info.getValue()} />,
		sortFn: sortFn_text,
	}),
	helper.accessor("total_commits", {
		header: ({ column }) => <SortableHeader column={column} label="Commits" />,
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
			const url = info.getValue();
			return url ? (
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="text-primary underline-offset-4 hover:underline"
				>
					{url}
				</a>
			) : (
				"—"
			);
		},
		meta: { className: "max-w-48 truncate" },
	}),
	helper.accessor("devpost_url", {
		header: "Devpost URL",
		enableSorting: false,
		cell: (info) => (
			<a
				href={info.getValue()}
				target="_blank"
				rel="noreferrer"
				className="text-primary underline-offset-4 hover:underline"
			>
				{info.getValue()}
			</a>
		),
		meta: { className: "max-w-48 truncate" },
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
		cell: ({ row }) => (
			<div className="flex items-center gap-1">
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

export function ProjectsTableClient({ projects }: { projects: Project[] }) {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
