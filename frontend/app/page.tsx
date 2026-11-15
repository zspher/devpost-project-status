import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function Home() {
	return (
		<main className="flex flex-1 items-center justify-center bg-background">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Devpost Project Status</CardTitle>
					<CardDescription>
						Track and analyze Devpost submissions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button>Get started</Button>
				</CardContent>
			</Card>
		</main>
	);
}
