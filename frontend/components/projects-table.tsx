import { cn } from "cn";
import { ProjectRow } from "@/components/project-row";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getProjects, type Project, type ProjectStatus } from "@/lib/api";

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
	return new Date(iso).toLocaleDateString(undefined, {
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

export async function ProjectsTable() {
	let projects: Project[] | null = null;
	try {
		projects = await getProjects();
	} catch {
		projects = null;
	}

	if (projects === null) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Projects</CardTitle>
					<CardDescription>Could not load projects</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Make sure the backend is running and try again.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects</CardTitle>
				<CardDescription>
					{projects.length} project{projects.length === 1 ? "" : "s"} tracked
				</CardDescription>
			</CardHeader>
			<CardContent>
				{projects.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No projects yet — upload a CSV to get started.
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
								<TableHead>Lines of code</TableHead>
								<TableHead>Last commit</TableHead>
								<TableHead>Git URL</TableHead>
								<TableHead>Devpost URL</TableHead>
								<TableHead>
									<span className="sr-only">Actions</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{projects.map((project) => (
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
