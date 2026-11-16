"use client";

import { cn } from "cn";
import { useMemo, useState } from "react";
import { ProjectRow } from "@/components/project-row";
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

const COLUMN_COUNT = 9;

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

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function LastCommit({ project }: { project: Project }) {
	if (!project.last_commit) return <>—</>;
	return (
		<span title={project.last_commit.hash}>
			{project.last_commit.hash.slice(0, 8)} ·{" "}
			{formatDate(project.last_commit.date)}
		</span>
	);
}

export function ProjectsTableClient({ projects }: { projects: Project[] }) {
	const [cutoff, setCutoff] = useState("");

	const filtered = useMemo(() => {
		if (!cutoff) return projects;
		// Interpret the datetime-local value as UTC-6
		const cutoffDate = new Date(`${cutoff}:00-06:00`);
		return projects.filter(
			(p) => p.last_commit && new Date(p.last_commit.date) >= cutoffDate,
		);
	}, [projects, cutoff]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects</CardTitle>
				<CardDescription>
					{filtered.length} of {projects.length} project
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
				{filtered.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{projects.length === 0
							? "No projects yet — upload a CSV to get started."
							: "No projects match the filter."}
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									<span className="sr-only">Expand</span>
								</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Commits</TableHead>
								<TableHead>Git URL</TableHead>
								<TableHead>Devpost URL</TableHead>
								<TableHead>
									<span className="sr-only">Actions</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.map((project) => (
								<ProjectRow
									key={project.id}
									project={project}
									statusBadge={<StatusBadge status={project.status} />}
									lastCommit={<LastCommit project={project} />}
									colSpan={COLUMN_COUNT}
								/>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
