'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import { CloudIcon } from 'lucide-react';

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn('sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
				'bg-white/80 supports-[backdrop-filter]:bg-white/60 border-gray-200/50 backdrop-blur-xl shadow-sm':
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-10">
					{/* Brand Logo */}
					<a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
							<CloudIcon className="h-5 w-5" strokeWidth={2.5} />
						</div>
						<span className="font-bold text-xl tracking-tight text-ink">Nano File</span>
					</a>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
						<a href="#features" className="hover:text-brand transition-colors">Features</a>
						<a href="#process" className="hover:text-brand transition-colors">How it works</a>
						<a href="#pricing" className="hover:text-brand transition-colors">Pricing</a>
					</div>
				</div>

				{/* Desktop Actions */}
				<div className="hidden items-center gap-4 md:flex">
					<a href="/login" className="text-sm font-medium text-muted hover:text-ink transition-colors">
						Log in
					</a>
					<a href="/register">
						<Button className="bg-brand text-white hover:bg-brand-dark shadow-sm h-9 px-5 rounded-full font-medium">
							Get Started
						</Button>
					</a>
				</div>

				{/* Mobile Toggle */}
				<Button
					size="icon"
					variant="ghost"
					onClick={() => setOpen(!open)}
					className="md:hidden text-ink hover:bg-gray-100/50"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>

			<MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto bg-white">
				<div className="flex w-full flex-col gap-y-6 pt-6 px-2">
					<a href="#features" className="text-xl font-semibold text-ink hover:text-brand" onClick={() => setOpen(false)}>Features</a>
					<a href="#process" className="text-xl font-semibold text-ink hover:text-brand" onClick={() => setOpen(false)}>How it works</a>
					<a href="#pricing" className="text-xl font-semibold text-ink hover:text-brand" onClick={() => setOpen(false)}>Pricing</a>
				</div>
				<div className="flex flex-col gap-3 mt-auto pb-8 pt-4 border-t border-gray-100">
					<a href="/login" onClick={() => setOpen(false)}>
						<Button variant="outline" className="w-full bg-white border-gray-200 text-ink h-12 rounded-xl text-md font-medium">
							Log in
						</Button>
					</a>
					<a href="/register" onClick={() => setOpen(false)}>
						<Button className="w-full bg-brand text-white hover:bg-brand-dark shadow-sm h-12 rounded-xl text-md font-semibold">
							Get Started
						</Button>
					</a>
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur-2xl',
				'fixed top-16 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-gray-100 md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:slide-in-from-top-4 ease-out',
					'size-full p-6',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	// also check on first load
	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}
