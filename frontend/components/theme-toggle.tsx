"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			aria-label="Toggle theme"
			title="Toggle theme"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			disabled={!mounted}
		>
			{mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
		</Button>
	);
}
