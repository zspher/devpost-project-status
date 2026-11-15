import { cn } from "cn";
import { DeleteProjectButton } from "@/components/delete-project-button";
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
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getProjects, type Project, type ProjectStatus } from "@/lib/api";

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
								<TableRow key={project.id}>
									<TableCell className="font-medium">{project.name}</TableCell>
									<TableCell>
										<StatusBadge status={project.status} />
									</TableCell>
									<TableCell>{project.total_commits ?? "—"}</TableCell>
									<TableCell>{project.lines_of_code ?? "—"}</TableCell>
									<TableCell className="whitespace-nowrap">
										<LastCommit project={project} />
									</TableCell>
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
										<DeleteProjectButton
											projectId={project.id}
											projectName={project.name}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
