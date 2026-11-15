"use client";

import Papa from "papaparse";
import { type SubmitEvent, useRef, useState } from "react";
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
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEVPOST_COLUMNS = {
    name: "Project Title",
    gitUrl: "Do You Have A Git Link (Git Hub, Gitlab, Codeburg)?",
    devpostUrl: "Submission Url",
} as const;

interface CsvRow {
    [column: string]: string | undefined;
}

interface RowResult {
    name: string;
    devpostUrl: string;
    result: string;
}

export function CsvUpload() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<RowResult[] | null>(null);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const file = inputRef.current?.files?.[0];
        if (!file) return;

        setLoading(true);
        const parsed = Papa.parse<CsvRow>(await file.text(), {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
        });

        const rows: RowResult[] = [];
        for (const row of parsed.data) {
            const name = row[DEVPOST_COLUMNS.name]?.trim() ?? "";
            const gitUrl = row[DEVPOST_COLUMNS.gitUrl]?.trim() ?? "";
            const devpostUrl = row[DEVPOST_COLUMNS.devpostUrl]?.trim() ?? "";

            if (!name || !devpostUrl) {
                rows.push({
                    name: name || "(missing)",
                    devpostUrl: devpostUrl || "(missing)",
                    result: "Skipped: missing required fields",
                });
                continue;
            }

            try {
                const response = await fetch(`${API_URL}/api/projects/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        git_url: gitUrl,
                        devpost_url: devpostUrl,
                    }),
                });
                if (response.status === 201) {
                    rows.push({ name, devpostUrl, result: "Created" });
                } else if (response.status === 409) {
                    rows.push({ name, devpostUrl, result: "Already exists" });
                } else {
                    rows.push({
                        name,
                        devpostUrl,
                        result: `Error: HTTP ${response.status}`,
                    });
                }
            } catch {
                rows.push({ name, devpostUrl, result: "Error: network failure" });
            }
        }

        setResults(rows);
        setLoading(false);
    }

    return (
        <div className="flex w-full max-w-2xl flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Import projects</CardTitle>
                    <CardDescription>
                        Upload the Devpost submissions export (CSV)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="csv-file">CSV file</Label>
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                ref={inputRef}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="self-start">
                            {loading ? "Importing…" : "Upload"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {results && (
                <Card>
                    <CardHeader>
                        <CardTitle>Import results</CardTitle>
                        <CardDescription>
                            {results.filter((r) => r.result === "Created").length} of{" "}
                            {results.length} projects created
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Devpost URL</TableHead>
                                    <TableHead>Result</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((row) => (
                                    <TableRow key={`${row.name}-${row.devpostUrl}`}>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell className="break-all">
                                            {row.devpostUrl}
                                        </TableCell>
                                        <TableCell>{row.result}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
