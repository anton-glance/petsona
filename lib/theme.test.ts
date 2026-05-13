import { colors, glass, radii, shadow, spacing, typography } from './theme';

describe('theme tokens — raw palette matches tokens.css', () => {
  it('exposes brand hex values exactly', () => {
    expect(colors.honey).toBe('#D4A248');
    expect(colors.forest).toBe('#2D4F3C');
    expect(colors.ivory).toBe('#FBF7EE');
    expect(colors.terracotta).toBe('#C97B5C');
    expect(colors.ink).toBe('#262522');
    expect(colors.error).toBe('#A8442A');
  });

  it('semantic aliases mirror their raw counterparts', () => {
    expect(colors.primary).toBe(colors.forest);
    expect(colors.accent).toBe(colors.honey);
    expect(colors.surface).toBe(colors.ivory);
    expect(colors.textDefault).toBe(colors.ink);
    expect(colors.border).toBe(colors.rule);
    expect(colors.statusDanger).toBe(colors.error);
  });
});

describe('theme tokens — typography pair tokens', () => {
  it('displayXl is 32/38 with -0.48 letter-spacing', () => {
    expect(typography.displayXl.fontSize).toBe(32);
    expect(typography.displayXl.lineHeight).toBe(38);
    expect(typography.displayXl.letterSpacing).toBeCloseTo(-0.48);
  });

  it('body is 14/21 with 400 weight', () => {
    expect(typography.body.fontSize).toBe(14);
    expect(typography.body.lineHeight).toBe(21);
    expect(typography.body.fontWeight).toBe('400');
  });

  it('caption is uppercase with positive letter-spacing', () => {
    expect(typography.caption.textTransform).toBe('uppercase');
    // 0.08em × 12px = 0.96px per components.css line 47.
    expect(typography.caption.letterSpacing).toBeCloseTo(0.96);
  });
});

describe('theme tokens — spacing + radii', () => {
  it('spacing scale matches tokens.css --s1..--s7', () => {
    expect(spacing.s1).toBe(4);
    expect(spacing.s4).toBe(16);
    expect(spacing.s7).toBe(48);
  });

  it('radii include xs..xl plus pill 999', () => {
    expect(radii.xs).toBe(6);
    expect(radii.pill).toBe(999);
  });
});

describe('theme tokens — shadows', () => {
  it('shadow() returns a non-empty platform-mapped style', () => {
    const sm = shadow('sm');
    const md = shadow('md');
    const lg = shadow('lg');
    expect(Object.keys(sm).length).toBeGreaterThan(0);
    expect(Object.keys(md).length).toBeGreaterThan(0);
    expect(Object.keys(lg).length).toBeGreaterThan(0);
  });
});

describe('theme tokens — glass', () => {
  it('blur intensities are 35/70/95', () => {
    expect(glass.blurIntensity.thin).toBe(35);
    expect(glass.blurIntensity.regular).toBe(70);
    expect(glass.blurIntensity.thick).toBe(95);
  });

  it('fill values are RGBA strings from tokens.css', () => {
    expect(glass.fill.thin).toBe('rgba(255,255,255,0.32)');
    expect(glass.fill.regular).toBe('rgba(255,255,255,0.58)');
    expect(glass.fillReduced.thin).toBe('rgba(255,255,255,0.94)');
  });
});

describe('theme tokens — tailwind.config.js drift detection', () => {
  // The tailwind config is CJS and inlines literal values from this file's
  // semantic palette. Drift breaks visual parity. This test fails if anyone
  // edits one side without the other.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS interop
  const tw = require('../tailwind.config.js') as {
    theme: { extend: { colors: Record<string, string>; spacing: Record<string, number> } };
  };

  it('tailwind primary color matches theme.colors.primary', () => {
    expect(tw.theme.extend.colors.primary).toBe(colors.primary);
  });

  it('tailwind surface color matches theme.colors.surface', () => {
    expect(tw.theme.extend.colors.surface).toBe(colors.surface);
  });

  it('tailwind honey color matches theme.colors.honey', () => {
    expect(tw.theme.extend.colors.honey).toBe(colors.honey);
  });

  it('tailwind spacing s4 matches theme.spacing.s4', () => {
    expect(tw.theme.extend.spacing.s4).toBe(spacing.s4);
  });
});
