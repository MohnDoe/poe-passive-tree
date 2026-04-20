/** Maps asset key -> zoom level -> URL. */
export type PassiveTreeAssetsDto = Record<string, Record<string, string>>;

export interface PassiveTreeExtraImageDto {
  x: number;
  y: number;

  /** Image path relative to the tree's image root. */
  image: string;
}
