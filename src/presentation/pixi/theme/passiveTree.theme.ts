const NORMAL_BASE = 50;
export const passiveTreeTheme = {
  nodes: {
    sizeByKind: {
      normal: NORMAL_BASE,
      notable: NORMAL_BASE * 1.5,
      mastery: NORMAL_BASE * 1.5,
      keystone: NORMAL_BASE * 2.3,
      jewel: NORMAL_BASE * 1.3,
      proxy: 25,
      ascendancyStart: 20,
      classStart: 200,
    },
    colors: {
      normal: 0xcfcfcf,
      notable: 0x5da9e9,
      mastery: 0x909f9f,
      keystone: 0xd96bff,
      jewel: 0xff7f50,
      proxy: 0x0000ff,
      ascendancyStart: 0xff0000,

      allocated: 0xf2c14e,
      activeClassStart: 0x6ecb63,
      previewPath: 0xfffb6f,
      hovered: 0xffffff,
      refund: 0xff1100,
    },
  },
  edges: {
    colors: {
      normal: 0x2d2b21,
      highlighted: 0xfffb6f,
      active: 0xf2c14e,
      refund: 0xff1100,
    },
    stroke: 15,
    alpha: 1,
  },
};
