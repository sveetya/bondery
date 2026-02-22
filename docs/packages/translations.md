# @bondery/translations

Internationalization message files for the Bondery webapp.

**Version:** 0.1.0
**Build:** None required (exports JSON source directly)

## Exports

| Export path | Description |
|---|---|
| `@bondery/translations` | Main module (locale utilities) |
| `@bondery/translations/cs` | Czech messages (`cs.json`) |
| `@bondery/translations/en` | English messages (`en.json`) |

## Supported languages

| Code | Language |
|---|---|
| `en` | English |
| `cs` | Czech |

## Message format

Messages are stored as flat or nested JSON objects. They are consumed by `next-intl` in the webapp.

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "contacts": {
    "title": "Contacts",
    "addNew": "Add contact"
  }
}
```

## Adding a new language

1. Create a new JSON file: `packages/translations/src/{code}.json`
2. Copy the structure from `en.json` and translate all values
3. Add an export in `package.json`:
   ```json
   "./{code}": "./src/{code}.json"
   ```
4. Update the `language` enum in `@bondery/types` and `user_settings` schema
