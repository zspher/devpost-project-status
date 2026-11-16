export const API_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ProjectStatus =
	| "no_link"
	| "no_access"
	| "in_progress"
	| "complete";

export interface CommitInfo {
	id: number;
	date: string;
	hash: string;
}

export interface Project {
	id: number;
	name: string;
	git_url: string;
	devpost_url: string;
	lines_of_code: number | null;
	total_commits: number | null;
	status: ProjectStatus;
	last_commit: CommitInfo | null;
	first_commit: CommitInfo | null;
	second_commit: CommitInfo | null;
}

export async function getProjects(): Promise<Project[]> {
	const response = await fetch(`${API_URL}/api/projects/`);
	if (!response.ok) {
		throw new Error(`Failed to fetch projects: HTTP ${response.status}`);
	}
	return response.json();
}

export async function deleteProject(id: number): Promise<void> {
	const response = await fetch(`${API_URL}/api/projects/${id}`, {
		method: "DELETE",
	});
	if (!response.ok && response.status !== 204) {
		throw new Error(`Failed to delete project: HTTP ${response.status}`);
	}
}

export async function refreshProject(id: number): Promise<void> {
	const response = await fetch(`${API_URL}/api/projects/${id}/refresh`, {
		method: "POST",
	});
	if (!response.ok) {
		throw new Error(`Failed to refresh project: HTTP ${response.status}`);
	}
}
