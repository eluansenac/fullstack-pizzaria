import { createApp, h } from 'vue'

createApp({
  render() {
    return h('main', [
      h('h1', 'Docker + Vue'),
      h('p', 'Aplicação rodando dentro do NGINX.'),
      h('p', 'Agora é a versão 2!')
    ])
  }
}).mount('#app')