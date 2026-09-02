# Tooltips (desktop)

Mantine `Tooltip` on **webapp and website** only. Mobile does not use this component.

## Theme defaults

`bonderyTheme` in `packages/mantine-next/src/theme.ts` sets:

- `multiline: true`
- `withArrow: true`
- `w: 300`

Do **not** pass `multiline`, `withArrow`, or `w` at the call site unless you need a different value.

```tsx
<Tooltip label={t("...")}>
```

Override `w` when the default 300px is wrong — for example `PersonAvatarTooltip` (`w="auto"`) because the label is a `PersonCard`, not wrapping text.

`HelpButton` uses the theme width. Pass `tooltipMaxWidth` only to override `w`.

## Checklist

- [ ] No `multiline`, `withArrow`, or `w` on `<Tooltip>` unless overriding the theme
- [ ] Person-card / custom-label tooltips set `w="auto"` (or another explicit width)
- [ ] `HelpButton` does not pass `withArrow`; `tooltipMaxWidth` only when the default 300px is too narrow
