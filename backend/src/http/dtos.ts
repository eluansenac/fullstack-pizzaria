import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDefined, IsIn, IsInt, IsNotEmpty, IsObject, IsString, IsUUID, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import type { TamanhoPizza } from '../domain/cardapio/pizza.js';
import type { StatusPedido } from '../domain/pedidos/pedido.js';

export class CadastrarClienteDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsString() @IsNotEmpty() telefone!: string;
}

export class CadastrarPizzaDto {
  @IsString() @IsNotEmpty() nome!: string;
  @IsIn(['pequena', 'media', 'grande']) tamanho!: TamanhoPizza;
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) precoCentavos!: number;
}

class EnderecoDto {
  @IsString() @IsNotEmpty() rua!: string;
  @IsString() @IsNotEmpty() numero!: string;
  @IsString() @IsNotEmpty() bairro!: string;
  @IsString() @IsNotEmpty() cidade!: string;
}

class AtendimentoDto {
  @IsIn(['entrega', 'retirada']) tipo!: 'entrega' | 'retirada';
  @ValidateIf((obj: AtendimentoDto) => obj.tipo === 'entrega' || obj.endereco !== undefined)
  @IsDefined() @IsObject() @ValidateNested() @Type(() => EnderecoDto)
  endereco?: EnderecoDto;
}

class ItemPedidoDto {
  @IsUUID() pizzaId!: string;
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) quantidade!: number;
}

export class RealizarPedidoDto {
  @IsUUID() clienteId!: string;
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => ItemPedidoDto)
  itens!: ItemPedidoDto[];
  @IsDefined() @IsObject() @ValidateNested() @Type(() => AtendimentoDto)
  atendimento!: AtendimentoDto;
}

export class AlterarStatusDto {
  @IsIn(['recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado']) status!: StatusPedido;
}
