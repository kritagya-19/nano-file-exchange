import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, UploadCloudIcon } from "lucide-react";

export function HeroSection() {
	return (
		<section className="mx-auto w-full max-w-5xl overflow-hidden pt-16">
			{/* Shades */}
			<div
				aria-hidden="true"
				className="absolute inset-0 size-full overflow-hidden"
			>
				<div
					className={cn(
						"absolute inset-0 isolate -z-10",
						"bg-[radial-gradient(20%_80%_at_20%_0%,theme(colors.blue.500/0.15),transparent)]"
					)}
				/>
			</div>
			<div className="relative z-10 flex max-w-2xl flex-col gap-5 px-4">


				<h1
					className={cn(
						"text-balance font-bold tracking-tight text-4xl text-ink leading-tight sm:text-5xl md:text-6xl",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
					)}
				>
					Secure & Seamless File Exchange for Everyone
				</h1>

				<p
					className={cn(
						"mt-2 text-muted text-lg sm:text-xl",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
					)}
				>
					Upload, organize, and share your files effortlessly with <br />
					Nano File Exchange's professional drag-and-drop platform.
				</p>

				<div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-center gap-3 fill-mode-backwards pt-4 delay-300 duration-500 ease-out">
					<Button variant="outline" className="border-gray-200 hover:bg-brand/5 hover:text-brand font-medium" asChild>
						<a href="#features">Explore Features</a>
					</Button>
					<Button className="bg-brand text-white hover:bg-brand-dark shadow-sm font-medium" asChild>
						<Link to="/register">
							<UploadCloudIcon className="size-4 mr-2" data-icon="inline-start" /> Start Sharing
						</Link>
					</Button>
				</div>
			</div>
			<div className="relative">
				<div
					className={cn(
						"absolute -inset-x-20 inset-y-0 -translate-y-1/3 scale-120 rounded-full",
						"bg-[radial-gradient(ellipse_at_center,theme(colors.blue.500/0.15),transparent,transparent)]",
						"blur-[50px]"
					)}
				/>
				<div
					className={cn(
						"mask-b-from-60% relative mt-8 -mr-56 overflow-hidden px-2 sm:mt-12 sm:mr-0 md:mt-20",
						"fade-in slide-in-from-bottom-5 animate-in fill-mode-backwards delay-100 duration-1000 ease-out"
					)}
				>
					<div className="relative inset-shadow-2xs inset-shadow-foreground/10 mx-auto max-w-5xl overflow-hidden rounded-lg border bg-background p-2 shadow-card ring-1 ring-card dark:inset-shadow-foreground/20 dark:inset-shadow-xs">
						<img
							alt="app screen light"
							className="z-2 aspect-video rounded-lg border dark:hidden object-cover"
							height="1080"
							src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
							width="1920"
						/>
						<img
							alt="app screen dark"
							className="hidden aspect-video rounded-lg bg-background dark:block object-cover"
							height="1080"
							src="/hero.png"
							width="1920"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
