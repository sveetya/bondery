# Tooltips (desktop)

Mantine `Tooltip` on **webapp and website** only. Mobile does not use this component.

## Theme default

`bonderyTheme` in `packages/mantine-next/src/theme.ts` sets `Tooltip.defaultProps.multiline: true`. Do **not** pass `multiline` (or `multiline={true}`) at the call site — the theme already enables wrapping.

## Always set `maw`

Always set **`maw`** on `<Tooltip>` so a longer cs/de translation wraps instead of a single very wide line. Without a max width, even with `multiline`, the tooltip grows as wide as the longest unwrapped line.

See [Mantine multiline tooltips](https://mantine.dev/core/tooltip/#multiline). Do not set a default `maw` in the theme — widths differ by copy.

```tsx
<Tooltip label={t("...")} maw={240} withArrow>
```

`HelpButton` already defaults `tooltipMaxWidth` (`maw`) to 320. Callers can override.

Do **not** bulk-add `maw` to every existing Tooltip that lacks a width when touching unrelated code. New and edited tooltips must set it.

## Checklist

- [ ] No `multiline` prop on `<Tooltip>` — theme default applies
- [ ] `maw` set so longer locales wrap
- [ ] `HelpButton` uses `tooltipMaxWidth` for `maw` rather than a local `multiline` prop
