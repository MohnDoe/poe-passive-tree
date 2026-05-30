import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { loadPassiveTreeDto } from "@/infrastructure/passiveTree/loadPassiveTreeDto";
import { mapPassiveTreeDtoToDomain } from "@/infrastructure/passiveTree/mapping/mappers/mapPassiveTreeDtoToDomain";
import { buildGraph } from "./graph/buildGraph";
import type { PassiveTreeRenderAssets } from "@/domain/graph/PassiveTreeRenderAssets";
import { buildRenderAssets } from "./assets/buildRenderAssets";

interface LoadedPassiveTree {
  graph: PassiveGraph;
  assets: PassiveTreeRenderAssets;
}

export async function loadPassiveTree(): Promise<LoadedPassiveTree> {
  const dto = await loadPassiveTreeDto();
  const mappedPassiveTree = mapPassiveTreeDtoToDomain(dto);

  return {
    graph: buildGraph(mappedPassiveTree),
    assets: buildRenderAssets(dto),
  };
}
