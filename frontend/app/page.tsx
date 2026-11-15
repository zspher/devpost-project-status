import { CsvUpload } from "@/components/csv-upload";

export default function Home() {
	return (
		<main className="flex flex-1 items-center justify-center bg-background p-8">
			<CsvUpload />
		</main>
	);
}
