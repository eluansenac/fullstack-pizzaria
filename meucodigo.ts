export class Pizza {
  private tamanho: string
  private sabores: string[]
  constructor(tamanho: string) {
    this.tamanho = tamanho
    this.sabores = []
  }
}