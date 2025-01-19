<script lang="ts">
	import { constrainDistance } from '$lib';
	import { onMount } from 'svelte';
	let circle: HTMLDivElement;
	let section: HTMLElement;

	interface Follower {
		element: HTMLDivElement | null;
		x: number;
		y: number;
		size: number;
	}
	// The distance between the points:
	let length = 50;

	let mouseX = 0;
	let mouseY = 0;
	let isMouseControl = false;
	let isFirstTime = true;
	let time = 0;

	const waveParams = {
		amplitude: 50,
		wavelength: 200,
		speed: 0.05,
		wanderRadius: 500,
		wanderSpeed: 0.01
	};

	let movementSpeed = 1; // Add speed multiplier
	let transitionSpeed = 0.1; // Controls how fast the circle moves to cursor
	let currentX = 250; // Starting position (matching the initial transform)
	let currentY = 250;

	const handleOnMouseMove = (e: MouseEvent) => {
		if (!isMouseControl) return;
		const rect = section.getBoundingClientRect();
		mouseX = e.clientX - rect.left - circle.clientWidth / 2;
		mouseY = e.clientY - rect.top - circle.clientHeight / 2;
	};

	const toggleControl = (e: MouseEvent) => {
		const rect = section.getBoundingClientRect();
		mouseX = e.clientX - rect.left - circle.clientWidth / 2;
		mouseY = e.clientY - rect.top - circle.clientHeight / 2;
		isMouseControl = !isMouseControl;
		isFirstTime = true;
	};

	const nextMoveBasedOnFormula = (time: number) => {
		const centerX = section.clientWidth / 2;
		const centerY = section.clientHeight / 2;

		const wanderAngle = time * waveParams.wanderSpeed;
		const x = centerX + Math.cos(wanderAngle) * waveParams.wanderRadius;
		const y =
			centerY +
			Math.sin(wanderAngle) * waveParams.wanderRadius +
			waveParams.amplitude * Math.sin(time * waveParams.speed);

		return {
			x: x,
			y: y
		};
	};

	const getTimeFromPosition = (x: number): number => {
		const centerX = section.clientWidth / 2;
		const cosWanderAngleX = Math.max(-1, Math.min(1, (x - centerX) / waveParams.wanderRadius));
		const wanderAngleX = Math.acos(cosWanderAngleX);
		return wanderAngleX / waveParams.wanderSpeed;
	};

	onMount(() => {
		const animate = () => {
			time += 2 * movementSpeed;
			if (!isMouseControl) {
				const approximateTime = getTimeFromPosition(mouseX);
				if (isFirstTime && !isNaN(approximateTime)) {
					time = approximateTime + 2 * movementSpeed;
					isFirstTime = false;
				}
				const { x, y } = nextMoveBasedOnFormula(time);
				const dx = x - currentX;
				const dy = y - currentY;
				currentX += dx * transitionSpeed;
				currentY += dy * transitionSpeed;
			} else {
				// Smooth movement towards cursor
				const dx = mouseX - currentX;
				const dy = mouseY - currentY;
				currentX += dx * transitionSpeed;
				currentY += dy * transitionSpeed;
			}

			circle.style.transform = `translate(${currentX}px, ${currentY}px)`;
			followers.forEach((follower, index, array) => {
				if (!follower.element) {
					return;
				}
				const anchorX = index === 0 ? currentX : array[index - 1].x;
				const anchorY = index === 0 ? currentY : array[index - 1].y;

				const { x, y } = constrainDistance(
					{ x: follower.x, y: follower.y },
					{ x: anchorX, y: anchorY },
					length
				);
				follower.x = x;
				follower.y = y;
				follower.element.style.transform = `translate(${follower.x}px, ${follower.y}px)`;
			});
			requestAnimationFrame(animate);
		};
		animate();
	});

	let followers: Follower[] = Array(5)
		.fill(null)
		.map((_, i, arr) => ({
			element: null,
			x: mouseX + i * length,
			y: mouseY,
			size: arr.length === 1 ? 10 : 20 - ((20 - 10) * i) / (arr.length - 1)
		}));
</script>

<svelte:head>
	<title>Procedural Animation</title>
</svelte:head>

<header class="container mx-auto my-20">
	<h1 class="text-center text-4xl font-bold">Procedural Animation</h1>
	<div class="mt-4 flex flex-col items-center gap-4">
		<div class="flex items-center gap-2">
			<button
				class="rounded border px-3 py-1"
				on:click={() => {
					if (followers.length > 1) {
						followers = Array(followers.length - 1)
							.fill(null)
							.map((_, i, arr) => ({
								element: null,
								x: followers[i].x,
								y: followers[i].y,
								size: arr.length === 1 ? 10 : 20 - ((20 - 10) * i) / (arr.length - 1)
							}));
					}
				}}
			>
				-
			</button>
			<span>Number of Followers: {followers.length}</span>
			<button
				class="rounded border px-3 py-1"
				on:click={() => {
					if (followers.length < 20) {
						const lastFollower = followers[followers.length - 1];
						followers = Array(followers.length + 1)
							.fill(null)
							.map((_, i, arr) => {
								if (i < followers.length) {
									return Object.assign(followers[i], {
										size: arr.length === 1 ? 10 : 20 - ((20 - 10) * i) / (arr.length - 1)
									});
								}
								return {
									element: null,
									x: lastFollower.x + length,
									y: lastFollower.y,
									size: arr.length === 1 ? 10 : 20 - ((20 - 10) * i) / (arr.length - 1)
								};
							});
					}
				}}
			>
				+
			</button>
		</div>
		<div class="flex items-center gap-2">
			<span>Speed: {movementSpeed.toFixed(1)}x</span>
			<input type="range" min="0.1" max="3" step="0.1" bind:value={movementSpeed} class="w-48" />
		</div>
	</div>
</header>

<main class="container mx-auto">
	<section
		role="presentation"
		on:mousemove={handleOnMouseMove}
		on:click={toggleControl}
		bind:this={section}
		class="relative h-full min-h-[80vh] w-full overflow-hidden border bg-slate-800"
		title="Click to toggle between automatic and cursor following. Right click to pause/resume."
	>
		<div
			bind:this={circle}
			class="bg-primary absolute h-8 w-8 rounded-full"
			style="transform-origin: center center;transform: translate(250px, 250px);"
		></div>
		{#each followers as follower, i}
			<div
				id={`follower-${i}`}
				bind:this={follower.element}
				class="bg-primary absolute rounded-full opacity-50"
				style={`transform-origin: center center;transform: translate(${follower.x}px, ${follower.y}px);width: ${follower.size}px;height: ${follower.size}px;`}
			></div>
		{/each}
	</section>
</main>
