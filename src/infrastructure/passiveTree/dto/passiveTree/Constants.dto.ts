export interface PassiveTreeConstantsDto {
  /** Map of internal class name -> class id. */
  classes: Record<string, number>;

  /** Map of attribute name -> attribute id (Strength, Dexterity, Intelligence). */
  characterAttributes: Record<string, number>;

  /** Inner radius constant for the central area of the tree. */
  PSSCentreInnerRadius: number;

  /** Skills per orbit index (0..4). */
  skillsPerOrbit: number[];

  /** Radii per orbit index (0..4). */
  orbitRadii: number[];
}
