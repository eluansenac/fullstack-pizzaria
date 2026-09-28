import { createApp, h, onMounted, ref } from 'vue'

createApp({
  setup() {
    const backend = ref('Verificando conexão com o backend...')
    onMounted(async () => {
      try {
        const response = await fetch('/api/health')
        if (!response.ok) throw new Error('Backend indisponível')
        const health = await response.json()
        backend.value = health.database === 'up'
          ? 'NestJS e PostgreSQL conectados.'
          : 'Banco de dados indisponível.'
      } catch {
        backend.value = 'Não foi possível conectar ao backend.'
      }
    })
    return { backend }
  },
  render() {
    return h('main', [
      h('h1', 'Docker + Vue'),
      h('p', 'Aplicação rodando dentro do NGINX.'),
      h('p', 'Versão 2!'),
      h('p', { role: 'status' }, this.backend)
    ])
  }
}).mount('#app')
