<script setup>
import { onMounted, ref } from 'vue'
import CategoriaItem from './components/CategoriaItem.vue'

const categorias = ref([])
const carregando = ref(true)
const erro = ref('')

async function carregarCategorias() {
  carregando.value = true
  erro.value = ''
  try {
    const resposta = await fetch('/api/categorias')
    if (!resposta.ok) throw new Error('Falha na API')
    categorias.value = await resposta.json()
  } catch {
    erro.value = 'Não foi possível carregar.'
  } finally {
    carregando.value = false
  }
}
onMounted(carregarCategorias)

</script>

<template>
  <main>
    <h1>Categorias da pizzaria</h1>
    <p v-if="carregando">Carregando...</p>
    <p v-else-if="erro">{{ erro }}</p>
    <ul v-else>
      <CategoriaItem v-for="c in categorias"
        :key="c.id" :nome="c.nome" />
    </ul>
  </main>
</template>

