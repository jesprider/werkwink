<script setup lang="ts">
import LandingHillIllustration from '../components/LandingHillIllustration.vue'
</script>

<template>
  <header class="px-6 py-4">
    <RouterLink to="/" class="font-heading text-xl">werkwink</RouterLink>
  </header>

  <main class="mx-auto max-w-2xl space-y-12 px-6 pb-16">
    <section>
      <h1 class="mb-4 font-heading text-4xl">Run your daily on a hill</h1>
      <p class="text-text-warm/90">
        A manager's view of where each project sits on the uncertainty curve, and what's pushing it
        back.
      </p>
    </section>

    <section class="space-y-4">
      <h2 class="font-heading text-2xl">The hill</h2>
      <LandingHillIllustration />
      <p class="text-text-warm/90">
        Uphill is figuring it out; downhill is execution — work you already know how to do.
      </p>
    </section>

    <section class="space-y-4">
      <h2 class="font-heading text-2xl">Forces</h2>
      <p class="text-text-warm/90">
        Each dot carries <strong>up forces</strong> — the assignee, helpers, and alternative
        approaches — shown on the chart as
        <span class="font-medium text-force-up">↑2</span>
        style badges.
      </p>
      <p class="text-text-warm/90">
        <strong>Down forces</strong> are blockers, obstacles, and dependencies —
        <span class="font-medium text-force-down">↓1</span>
        on the chart. Forces don't move the dot; they make imbalance visible during the
        conversation.
      </p>
      <p class="text-text-warm/90">
        While you're still on the uphill, the standup is about clearing blockers and finding ways
        forward — not just moving the dot.
      </p>
    </section>

    <section class="space-y-4">
      <h2 class="font-heading text-2xl">The daily ritual</h2>
      <ol class="list-decimal space-y-2 pl-5 text-text-warm/90">
        <li>Open the chart and walk through each project with the team.</li>
        <li>Drag dots and capture blockers and helpers as forces.</li>
        <li>Click <strong>End daily</strong> to commit today's snapshot.</li>
      </ol>
    </section>

    <section
      class="rounded-xl border border-hill-sand/60 bg-hill-sand/20 p-4 text-sm text-text-warm/90"
    >
      <p>
        <strong>Your data stays on your device.</strong>
        Everything is stored in your browser's localStorage. There is no shared backend — two people
        opening the same link see separate charts. Export JSON is how you move data between
        machines.
      </p>
    </section>

    <section>
      <RouterLink
        to="/projects"
        class="inline-block rounded-full bg-terracotta px-6 py-3 text-cream transition-opacity hover:opacity-90"
      >
        Try it live →
      </RouterLink>
    </section>
  </main>
</template>
