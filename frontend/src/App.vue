<script setup>
import { ref } from 'vue'
import CategoriaItem from './components/CategoriaItem.vue'

const titulo = 'Pizzaria do Bocca'
const quantidade = ref(0)

function adicionar() {
  quantidade.value++
}
</script>

<template>
 <main>
  <h1>{{ titulo }}</h1>
  <p>Itens selecionados: {{ quantidade }}</p>
  <button @click="adicionar">
    Adicoinar item
  </button>

  <h1>Categorias da pizzaria</h1>
  <ul>
    <CategoriaItem nome="Pizzas" />
    <CategoriaItem nome="Bebidas" />
    <CategoriaItem nome="Sobremesas" />
  </ul>
</main>
</template>
