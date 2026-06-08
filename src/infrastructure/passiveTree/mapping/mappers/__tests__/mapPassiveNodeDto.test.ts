import { describe, expect, it } from "vitest";
import { mapPassiveNodeDto } from "../mapPassiveNodeDto";
import type { PassiveTreeNodeDto } from "../../../dto/passiveTree/Nodes.dto";
import type { PassiveTreeDto } from "../../../dto/passiveTree/PassiveSkillTree.dto";

function makeTreeDto(): PassiveTreeDto {
  return {
    skillSprites: {},
    nodes: {},
    groups: {},
    constants: {
      classes: {},
      characterAttributes: {},
      PSSCentreInnerRadius: 0,
      orbitRadii: [],
      skillsPerOrbit: [],
    },
    classes: [],
    extraImages: {},
    jewelSlots: [],
    min_x: 0,
    min_y: 0,
    max_x: 0,
    max_y: 0,
    assets: {},
    imageZoomLevels: [],
  };
}

describe("mapPassiveNodeDto", () => {
  describe("normal", () => {
    it("maps all normal node properties", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 12345,
        name: "Architect",
        icon: "2S2S2.png",
        stats: ["+1 to Level of Socketed Gems"],
        grantedStrength: 10,
        grantedDexterity: 5,
        grantedIntelligence: 8,
        grantedPassivePoints: 1,
        isMultipleChoiceOption: true,
        ascendancyName: "Warlord",
        reminderText: ["some text"],
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("12345", dto, tree);

      expect(result.kind).toBe("normal");
      expect(result.id).toBe("12345");
      expect(result.name).toBe("Architect");
      expect(result.stats).toEqual(["+1 to Level of Socketed Gems"]);
      expect(result.grantedStrength).toBe(10);
      expect(result.grantedDexterity).toBe(5);
      expect(result.grantedIntelligence).toBe(8);
      expect(result.grantedPassivePoints).toBe(1);
      expect(result.isMultipleChoiceOption).toBe(true);
      expect(result.ascendancyName).toBe("Warlord");
      expect(result.reminderText).toEqual(["some text"]);
      expect(result.orbit).toBe(0);
      expect(result.orbitIndex).toBe(0);
      expect(result.out).toEqual([]);
      expect(result.in).toEqual([]);
    });
  });

  describe("notable", () => {
    it("maps all notable node properties", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 23456,
        name: "Blighted Notable",
        icon: "3T3T3.png",
        stats: ["+20% to Damage"],
        isNotable: true,
        grantedStrength: 15,
        isMultipleChoice: true,
        isBlighted: true,
        recipe: [1, 2],
        ascendancyName: "Berserker",
        reminderText: ["blighted text"],
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("23456", dto, tree);

      expect(result.kind).toBe("notable");
      expect(result.id).toBe("23456");
      expect(result.name).toBe("Blighted Notable");
      expect(result.stats).toEqual(["+20% to Damage"]);
      expect(result.grantedStrength).toBe(15);
      expect(result.isMultipleChoice).toBe(true);
      expect(result.isBlighted).toBe(true);
      expect(result.recipe).toEqual([1, 2]);
      expect(result.ascendancyName).toBe("Berserker");
      expect(result.reminderText).toEqual(["blighted text"]);
    });
  });

  describe("keystone", () => {
    it("maps all keystone node properties", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 34567,
        name: "Lethal Efficiency",
        icon: "4U4U4.png",
        stats: ["When you kill an enemy, you lose 20% of your Life"],
        isKeystone: true,
        flavourText: ["Lethal efficiency"],
        isBlighted: false,
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("34567", dto, tree);

      expect(result.kind).toBe("keystone");
      expect(result.id).toBe("34567");
      expect(result.name).toBe("Lethal Efficiency");
      expect(result.stats).toEqual(["When you kill an enemy, you lose 20% of your Life"]);
      expect(result.flavourText).toEqual(["Lethal efficiency"]);
      expect(result.isBlighted).toBe(false);
      expect(result.recipe).toBeUndefined();
    });
  });

  describe("jewel with expansionJewel", () => {
    it("maps jewel socket with expansion jewel data", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 45678,
        name: "Jewel Socket",
        icon: "5V5V5.png",
        stats: [],
        isJewelSocket: true,
        ascendancyName: "Slayer",
        expansionJewel: { size: 1, index: 5, proxy: "proxy-id", parent: "parent-id" },
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("45678", dto, tree);

      expect(result.kind).toBe("jewel");
      expect(result.id).toBe("45678");
      expect(result.name).toBe("Jewel Socket");
      expect(result.stats).toEqual([]);
      expect(result.ascendancyName).toBe("Slayer");
      expect(result.expansionJewel).toEqual({ size: 1, index: 5, proxy: "proxy-id", parent: "parent-id" });
    });
  });

  describe("jewel without expansionJewel", () => {
    it("maps basic jewel socket without expansionJewel", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 56789,
        name: "Basic Jewel Socket",
        icon: "6W6W6.png",
        stats: [],
        isJewelSocket: true,
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("56789", dto, tree);

      expect(result.kind).toBe("jewel");
      expect(result.id).toBe("56789");
      expect(result.name).toBe("Basic Jewel Socket");
      expect(result.stats).toEqual([]);
      expect(result.expansionJewel).toBeUndefined();
    });
  });

  describe("mastery with effects", () => {
    it("maps mastery node with all effect properties", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 67890,
        name: "Mastery of Fire",
        icon: "7X7X7.png",
        stats: ["Fire skills deal 10% more damage"],
        isMastery: true,
        activeIcon: "icon.png",
        inactiveIcon: "icon-inactive.png",
        activeEffectImage: "effect.png",
        masteryEffects: { fireDamage: 10 },
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("67890", dto, tree);

      expect(result.kind).toBe("mastery");
      expect(result.id).toBe("67890");
      expect(result.name).toBe("Mastery of Fire");
      expect(result.activeIcon).toBe("icon.png");
      expect(result.inactiveIcon).toBe("icon-inactive.png");
      expect(result.activeEffectImage).toBe("effect.png");
      expect(result.masteryEffects).toEqual({ fireDamage: 10 });
    });
  });

  describe("mastery without effects", () => {
    it("maps base mastery node without effect properties", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 78901,
        name: "Mastery Anchor",
        icon: "8Y8Y8.png",
        stats: [],
        isMastery: true,
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("78901", dto, tree);

      expect(result.kind).toBe("mastery");
      expect(result.id).toBe("78901");
      expect(result.name).toBe("Mastery Anchor");
      expect(result.activeIcon).toBeUndefined();
      expect(result.inactiveIcon).toBeUndefined();
      expect(result.activeEffectImage).toBeUndefined();
      expect(result.masteryEffects).toBeUndefined();
    });
  });

  describe("proxy", () => {
    it("maps proxy node with only base properties", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 89012,
        name: "Proxy Node",
        icon: "9Z9Z9.png",
        stats: [],
        isProxy: true,
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("89012", dto, tree);

      expect(result.kind).toBe("proxy");
      expect(result.id).toBe("89012");
      expect(result.name).toBe("Proxy Node");
      expect(result.stats).toEqual([]);
      expect(result.orbit).toBe(0);
      expect(result.orbitIndex).toBe(0);
      expect(result.out).toEqual([]);
      expect(result.in).toEqual([]);
    });
  });

  describe("classStart", () => {
    it("maps class start node with classStartIndex", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 90123,
        name: "Witch Start",
        icon: "1A1A1.png",
        stats: [],
        classStartIndex: 1,
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("90123", dto, tree);

      expect(result.kind).toBe("classStart");
      expect(result.id).toBe("90123");
      expect(result.name).toBe("Witch Start");
      expect(result.stats).toEqual([]);
      expect(result.classStartIndex).toBe(1);
    });
  });

  describe("ascendancyStart", () => {
    it("maps ascendancy start node with ascendancyName", () => {
      const dto: PassiveTreeNodeDto = {
        skill: 11111,
        name: "Chieftain Start",
        icon: "2B2B2.png",
        stats: [],
        isAscendancyStart: true,
        ascendancyName: "Chieftain",
      };
      const tree = makeTreeDto();
      const result = mapPassiveNodeDto("11111", dto, tree);

      expect(result.kind).toBe("ascendancyStart");
      expect(result.id).toBe("11111");
      expect(result.name).toBe("Chieftain Start");
      expect(result.stats).toEqual([]);
      expect(result.ascendancyName).toBe("Chieftain");
    });
  });
});
