"use client";

import { FlexRender } from "@tanstack/react-table";
import { cn } from "cn";
import type { ProjectTableRow } from "@/components/projects-table-client";
import { TableCell, TableRow } from "@/components/ui/table";
import type { CommitInfo } from "@/lib/api";

/** Convert a UTC ISO date string to UTC-6 and format it with date and time. */
function formatDateTimeUtcMinus6(iso: string): string {
	const date = new Date(new Date(iso).getTime() - 6 * 60 * 60 * 1000);
	const pad = (n: number) => String(n).padStart(2, "0");
	return (
		`${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
		`${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC-6`
	);
}

function CommitDetail({
	label,
	commit,
	project_url,
}: {
	label: string;
	project_url: string;
	commit: CommitInfo | null;
}) {
	const short_hash = commit?.hash.slice(0, 8);
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs font-medium text-muted-foreground">{label}</span>
			{commit ? (
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
					<dt className="text-muted-foreground">Hash</dt>
					<dd className="font-mono text-xs">
						<a
							href={`${project_url}/commit/${short_hash}`}
							target="_blank"
							rel="noreferrer"
							className="text-primary underline-offset-4 hover:underline"
						>
							{short_hash}
						</a>
					</dd>
					<dt className="text-muted-foreground">Date</dt>
					<dd className="whitespace-nowrap">
						{formatDateTimeUtcMinus6(commit.date)}
					</dd>
				</dl>
			) : (
				<span className="text-sm text-muted-foreground">—</span>
			)}
		</div>
	);
}

export function ProjectRow({ row }: { row: ProjectTableRow }) {
	const expanded = row.getIsExpanded();
	const visibleCells = row.getVisibleCells();

	return (
		<>
			<TableRow data-state={expanded ? "selected" : undefined}>
				{visibleCells.map((cell) => (
					<TableCell
						key={cell.id}
						className={cell.column.columnDef.meta?.className}
					>
						<FlexRender cell={cell} />
					</TableCell>
				))}
			</TableRow>
			{expanded && (
				<TableRow className="bg-muted/30 hover:bg-muted/30">
					<TableCell
						colSpan={visibleCells.length}
						className={cn("whitespace-normal", "p-4")}
					>
						<div className="grid gap-4 sm:grid-cols-3">
							<CommitDetail
								label="First commit"
								commit={row.original.first_commit}
								project_url={row.original.git_url}
							/>
							<CommitDetail
								label="Second commit"
								commit={row.original.second_commit}
								project_url={row.original.git_url}
							/>
							<CommitDetail
								label="Last commit"
								commit={row.original.last_commit}
								project_url={row.original.git_url}
							/>
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}
