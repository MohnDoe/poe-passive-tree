import { loadPassiveTreeDto } from "@/data/loadPassiveTreeDto";
import { mapPassiveTreeDtoToDomain } from "@/data/mapping/mappers/mapPassiveTreeDtoToDomain";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import { buildGraph } from "./graph/buildGraph";

export async function loadPassiveTreeRuntime(): Promise<PassiveGraph> {
  const dto = await loadPassiveTreeDto();
  const mappedPassiveTree = mapPassiveTreeDtoToDomain(dto);

  return buildGraph(mappedPassiveTree);
}
