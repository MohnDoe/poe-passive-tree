import type { PassiveSkillTreeDto } from "@/data/dto/passiveSkillTree.dto";
import { mapPassiveTreeDto } from "@/data/mapping/passiveTreeMapper";
import { describe, expect, it } from "vitest";

const tinyTree: Partial<PassiveSkillTreeDto> = {
  classes: [
    {
      name: 'Marauder',
      base_str: 32,
      base_dex: 14,
      base_int: 14,
      ascendancies: [
        {
          id: 'Juggernaut',
          name: 'Juggernaut',
        },
      ],
    },
  ],
  groups: {
    '10': {
      x: 1200,
      y: -2300,
      orbits: [1],
      nodes: ['5865', '38999'],
    },
  },
  nodes: {
    root: {
      group: 0,
      orbit: 0,
      orbitIndex: 0,
      out: ['5865'],
      in: [],
    },
    '5865': {
      skill: 5865,
      name: 'Physical Damage, Life Leeched per Second',
      icon: 'Art/2DArt/SkillIcons/passives/Berserker/DmgLeech.png',
      ascendancyName: 'Berserker',
      stats: [
        '30% increased total Recovery per second from Life Leech',
        '10% increased Physical Damage',
      ],
      group: 10,
      orbit: 2,
      orbitIndex: 4,
      out: ['38999'],
      in: ['root'],
    },
    '38999': {
      skill: 38999,
      name: 'Flawless Savagery',
      icon: 'Art/2DArt/SkillIcons/passives/Berserker/CloakedAgony.png',
      isNotable: true,
      ascendancyName: 'Berserker',
      stats: [
        'Adds 20 to 30 Physical Damage if you\'ve dealt a Critical Strike Recently',
        '+25% to Critical Strike Multiplier',
        '50% increased Critical Strike Chance',
      ],
      reminderText: ['(Recently refers to the past 4 seconds)'],
      group: 10,
      orbit: 4,
      orbitIndex: 37,
      out: [],
      in: ['5865'],
    },
  },

  constants: {
    classes: {
      StrDexIntClass: 0,
      StrClass: 1,
      DexClass: 2,
      IntClass: 3,
      StrDexClass: 4,
      StrIntClass: 5,
      DexIntClass: 6
    },
    characterAttributes: {
      Strength: 0,
      Dexterity: 1,
      Intelligence: 2
    },
    PSSCentreInnerRadius: 130,
    skillsPerOrbit: [
      1,
      6,
      16,
      16,
      40,
      72,
      72
    ],
    orbitRadii: [
      0,
      82,
      162,
      335,
      493,
      662,
      846
    ]
  },
}


describe("mapPassiveTreeDto", () => {
  it("maps a minimal tree correctly", () => {
    const tree = mapPassiveTreeDto(tinyTree as PassiveSkillTreeDto);

    const node5865 = tree.nodes.get("5865")
    const node38999 = tree.nodes.get("38999")
    const group10 = tree.groups.get("10")

    expect(node5865).toBeDefined()
    expect(node38999).toBeDefined()
    expect(group10).toBeDefined()

    expect(node5865!.groupId).toBe("10")
    expect(node5865!.outgoing).toEqual(["38999"])

    expect(group10!.nodeIds).toContain("5865")
    expect(group10!.nodeIds).toContain("38999")
  })
})
