import { Suspense } from "react";
import { CsvUpload } from "@/components/csv-upload";
import { ProjectsTable } from "@/components/projects-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ProjectsTableFallback() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Projects</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">Loading projects…</p>
			</CardContent>
		</Card>
	);
}

export default function Home() {
	return (
		<main className="flex flex-1 justify-center bg-background p-8">
			<div className="flex w-full max-w-5xl flex-col gap-6">
				<div className="flex justify-end">
					<ThemeToggle />
				</div>
				<CsvUpload />
				<Suspense fallback={<ProjectsTableFallback />}>
					<ProjectsTable />
				</Suspense>
			</div>
		</main>
	);
}
