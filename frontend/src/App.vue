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
    if (!resposta.ok) throw new Error(`A API respondeu ${resposta.status}`)
    categorias.value = await resposta.json()
  } catch (falha) {
    console.error('Erro ao carregar categorias:', falha)
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
    <template v-else-if="erro">
      <p role="alert">{{ erro }}</p>
      <button type="button" @click="carregarCategorias">Tentar novamente</button>
    </template>
    <p v-else-if="categorias.length === 0">Nenhuma categoria cadastrada.</p>
    <ul v-else>
      <CategoriaItem v-for="c in categorias"
        :key="c.id" :nome="c.nome" />
    </ul>
  </main>
</template>

