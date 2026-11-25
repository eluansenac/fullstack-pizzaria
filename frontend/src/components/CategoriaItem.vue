<script setup>
defineProps({
  nome: { type: String, required: true }
})
</script>

<template>
  <li>{{ nome }}</li>
</template>
