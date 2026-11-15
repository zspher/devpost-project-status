"use client";

import { cn } from "cn";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { RefreshProjectButton } from "@/components/refresh-project-button";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { CommitInfo, Project } from "@/lib/api";

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
}: {
	label: string;
	commit: CommitInfo | null;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs font-medium text-muted-foreground">{label}</span>
			{commit ? (
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
					<dt className="text-muted-foreground">ID</dt>
					<dd>{commit.id}</dd>
					<dt className="text-muted-foreground">Hash</dt>
					<dd className="font-mono text-xs">{commit.hash}</dd>
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

interface ProjectRowProps {
	project: Project;
	statusBadge: React.ReactNode;
	lastCommit: React.ReactNode;
	colSpan: number;
}

export function ProjectRow({
	project,
	statusBadge,
	lastCommit,
	colSpan,
}: ProjectRowProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<>
			<TableRow data-state={expanded ? "selected" : undefined}>
				<TableCell className="w-8 pr-0">
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						aria-expanded={expanded}
						aria-label={
							expanded
								? `Collapse commit details for ${project.name}`
								: `Expand commit details for ${project.name}`
						}
						onClick={() => setExpanded((prev) => !prev)}
					>
						{expanded ? <ChevronDown /> : <ChevronRight />}
					</Button>
				</TableCell>
				<TableCell className="font-medium">{project.name}</TableCell>
				<TableCell>{statusBadge}</TableCell>
				<TableCell>{project.total_commits ?? "—"}</TableCell>
				<TableCell>{project.lines_of_code ?? "—"}</TableCell>
				<TableCell className="whitespace-nowrap">{lastCommit}</TableCell>
				<TableCell className="max-w-48 truncate">
					{project.git_url ? (
						<a
							href={project.git_url}
							target="_blank"
							rel="noreferrer"
							className="text-primary underline-offset-4 hover:underline"
						>
							{project.git_url}
						</a>
					) : (
						"—"
					)}
				</TableCell>
				<TableCell className="max-w-48 truncate">
					<a
						href={project.devpost_url}
						target="_blank"
						rel="noreferrer"
						className="text-primary underline-offset-4 hover:underline"
					>
						{project.devpost_url}
					</a>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-1">
						<RefreshProjectButton
							projectId={project.id}
							projectName={project.name}
						/>
						<DeleteProjectButton
							projectId={project.id}
							projectName={project.name}
						/>
					</div>
				</TableCell>
			</TableRow>
			{expanded && (
				<TableRow className="bg-muted/30 hover:bg-muted/30">
					<TableCell
						colSpan={colSpan}
						className={cn("whitespace-normal", "p-4")}
					>
						<div className="grid gap-4 sm:grid-cols-3">
							<CommitDetail
								label="First commit"
								commit={project.first_commit}
							/>
							<CommitDetail
								label="Second commit"
								commit={project.second_commit}
							/>
							<CommitDetail label="Last commit" commit={project.last_commit} />
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}
