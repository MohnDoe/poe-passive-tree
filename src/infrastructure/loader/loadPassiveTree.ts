import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { loadPassiveTreeDto } from "@/infrastructure/passiveTree/loadPassiveTreeDto";
import { mapPassiveTreeDtoToDomain } from "@/infrastructure/passiveTree/mapping/mappers/mapPassiveTreeDtoToDomain";
import { buildGraph } from "./graph/buildGraph";

export async function loadPassiveTree(): Promise<PassiveGraph> {
  const dto = await loadPassiveTreeDto();
  const mappedPassiveTree = mapPassiveTreeDtoToDomain(dto);

  return buildGraph(mappedPassiveTree);
}
