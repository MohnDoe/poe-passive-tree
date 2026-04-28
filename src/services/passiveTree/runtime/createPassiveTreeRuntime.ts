import { loadPassiveTreeDto } from "@/data/loadPassiveTreeDto";
import { mapPassiveTreeDtoToDomain } from "@/data/mapping/mappers/mapPassiveTreeDtoToDomain";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import { buildGraph } from "./graph/buildGraph";

export interface PassiveTreeRuntime {
  graph: PassiveGraph;
  // assets : ...
}

export async function createPassiveTreeRuntime(): Promise<PassiveTreeRuntime> {
  const dto = await loadPassiveTreeDto();
  const mappedPassiveTree = mapPassiveTreeDtoToDomain(dto);

  return { graph: buildGraph(mappedPassiveTree) };
}
