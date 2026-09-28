import { ErroDeDominio } from './erro-de-dominio.js';

// Todos os valores são em BRL. Centavos evitam erros de ponto flutuante.
export class Dinheiro {
  private constructor(readonly centavos: number) {
    Object.freeze(this);
  }

  static deCentavos(centavos: number): Dinheiro {
    if (!Number.isSafeInteger(centavos) || centavos < 0) {
      throw new ErroDeDominio('O valor deve ser um inteiro não negativo em centavos.');
    }
    return new Dinheiro(centavos);
  }

  somar(outro: Dinheiro): Dinheiro {
    return Dinheiro.deCentavos(this.centavos + outro.centavos);
  }

  multiplicar(quantidade: number): Dinheiro {
    if (!Number.isSafeInteger(quantidade) || quantidade < 1) {
      throw new ErroDeDominio('A quantidade deve ser um inteiro positivo.');
    }
    return Dinheiro.deCentavos(this.centavos * quantidade);
  }

  equals(outro: Dinheiro): boolean {
    return this.centavos === outro.centavos;
  }
}
