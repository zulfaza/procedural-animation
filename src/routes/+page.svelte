<script lang="ts">
	import { constrainDistance } from '$lib';
	import { onMount } from 'svelte';
	let circle: HTMLDivElement;
	let section: HTMLElement;
	let target: HTMLDivElement;

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

	let isDragging = false;

	let movementSpeed = 1; // Add speed multiplier
	let transitionSpeed = 0.1; // Controls how fast the circle moves to cursor
	let currentX = 0; // Will be set in onMount
	let currentY = 0;

	// Add these new reactive variables
	$: viewportWidth = section?.clientWidth ?? 0;
	$: viewportHeight = section?.clientHeight ?? 0;
	$: responsiveWanderRadius = Math.min(viewportWidth, viewportHeight) * 0.4; // 30% of the smallest dimension

	$: waveParams = {
		amplitude: Math.min(viewportHeight, viewportWidth) * 0.05, // 5% of smallest viewport dimension
		wavelength: Math.min(viewportHeight, viewportWidth) * 0.2, // 20% of smallest viewport dimension
		speed: 0.05,
		wanderSpeed: 0.01
	};

	let score = 0; // Add score counter
	const hitThreshold = 20; // Distance threshold for hitting target

	// Add function to generate random position within viewport
	const getRandomPosition = () => {
		const padding = 40; // Padding from edges
		const section = document.querySelector('section[role="presentation"]') as HTMLElement;
		return {
			x: padding + Math.random() * (section.clientWidth - 2 * padding),
			y: padding + Math.random() * (section.clientHeight - 2 * padding)
		};
	};

	let targetX = 0;
	let targetY = 0;

	const handleOnMouseMove = (e: MouseEvent) => {
		if (!isMouseControl || !isDragging) return;
		const rect = section.getBoundingClientRect();
		mouseX = e.clientX - rect.left - circle.clientWidth / 2;
		mouseY = e.clientY - rect.top - circle.clientHeight / 2;
	};

	const handleTouchMove = (e: TouchEvent) => {
		if (!isMouseControl || !isDragging) return;
		e.preventDefault(); // Prevent scrolling while dragging
		const rect = section.getBoundingClientRect();
		const touch = e.touches[0];
		mouseX = touch.clientX - rect.left - circle.clientWidth / 2;
		mouseY = touch.clientY - rect.top - circle.clientHeight / 2;
	};

	const startDrag = (e: MouseEvent | TouchEvent) => {
		isDragging = true;
		if (e instanceof TouchEvent) {
			const touch = e.touches[0];
			const rect = section.getBoundingClientRect();
			mouseX = touch.clientX - rect.left - circle.clientWidth / 2;
			mouseY = touch.clientY - rect.top - circle.clientHeight / 2;
		}
		isMouseControl = true;
		isFirstTime = true;
	};

	const endDrag = () => {
		isDragging = false;
	};

	const toggleControl = (e: MouseEvent) => {
		if (e.button === 0) {
			// Only toggle on left click
			const rect = section.getBoundingClientRect();
			mouseX = e.clientX - rect.left - circle.clientWidth / 2;
			mouseY = e.clientY - rect.top - circle.clientHeight / 2;
			isMouseControl = !isMouseControl;
			isFirstTime = true;
		}
	};

	const nextMoveBasedOnFormula = (time: number) => {
		const centerX = viewportWidth / 2;
		const centerY = viewportHeight / 2;

		const wanderAngle = time * waveParams.wanderSpeed;
		const x = centerX + Math.cos(wanderAngle) * responsiveWanderRadius;
		const y =
			centerY +
			Math.sin(wanderAngle) * responsiveWanderRadius +
			waveParams.amplitude * Math.sin(time * waveParams.speed);

		return {
			x: x,
			y: y
		};
	};

	const getTimeFromPosition = (x: number): number => {
		const centerX = viewportWidth / 2;
		const cosWanderAngleX = Math.max(-1, Math.min(1, (x - centerX) / responsiveWanderRadius));
		const wanderAngleX = Math.acos(cosWanderAngleX);
		return wanderAngleX / waveParams.wanderSpeed;
	};

	onMount(() => {
		// Set initial positions
		currentX = viewportWidth / 2;
		currentY = viewportHeight / 2;

		// Set initial target position
		const randomPos = getRandomPosition();
		targetX = randomPos.x;
		targetY = randomPos.y;

		const animate = () => {
			time += 2 * movementSpeed;

			// Check for collision with target
			const dx = currentX - targetX;
			const dy = currentY - targetY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < hitThreshold) {
				score++;
				const newPos = getRandomPosition();
				targetX = Math.max(newPos.x, 0);
				targetY = Math.max(newPos.y, 0);
			}

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

			// Update target position
			target.style.transform = `translate(${targetX}px, ${targetY}px)`;

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

<header class="container mx-auto my-10 md:my-20">
	<h1 class="text-center text-4xl font-bold">Procedural Animation</h1>
	<p class="mt-4 text-center text-2xl">Score: {score}</p>
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

<main class="container mx-auto mb-20">
	<p class="mb-5 text-center text-sm">Drag to move the snake</p>
	<section
		role="presentation"
		on:mousemove={handleOnMouseMove}
		on:mousedown={startDrag}
		on:mouseup={endDrag}
		on:mouseleave={endDrag}
		on:touchstart={startDrag}
		on:touchmove={handleTouchMove}
		on:touchend={endDrag}
		on:click={toggleControl}
		bind:this={section}
		class="relative h-full min-h-[80vh] w-full overflow-hidden border bg-slate-800"
		title="Click to toggle between automatic and cursor following. Drag to move on mobile."
	>
		<div
			bind:this={circle}
			class="bg-primary absolute h-8 w-8 rounded-full"
			style="transform-origin: center center;transform: translate(250px, 250px);"
		></div>
		<div bind:this={target} class=" absolute h-5 w-5 rounded-full bg-yellow-300"></div>
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
