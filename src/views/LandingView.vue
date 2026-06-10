<script setup lang="ts"></script>

<template>
  <header class="px-6 py-4">
    <RouterLink to="/" class="font-heading text-xl">werkwink</RouterLink>
  </header>
  <section class="max-w-2xl px-6 py-8">
    <h1 class="mb-4 font-heading text-4xl">Run your daily on a hill</h1>
    <p class="mb-8">
      A manager's view of where each project sits on the uncertainty curve, and what's pushing it
      back.
    </p>
    <RouterLink to="/projects" class="inline-block rounded-full bg-terracotta px-6 py-3 text-cream">
      Open the chart →
    </RouterLink>
  </section>
</template>
