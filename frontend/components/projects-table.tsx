import { ProjectsTableClient } from "@/components/projects-table-client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getProjects, type Project } from "@/lib/api";

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

	return <ProjectsTableClient projects={projects} />;
}
