# Account

Base path: `/api/account`

Manage the authenticated user's account. All endpoints require authentication.

## Update account

```
PATCH /api/account
```

**Request body:**

```json
{
  "name": "John",
  "middlename": "Michael",
  "surname": "Doe"
}
```

All fields are optional.

**Response** `200`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "user_metadata": {
      "name": "John",
      "middlename": "Michael",
      "surname": "Doe"
    }
  }
}
```

## Delete account

```
DELETE /api/account
```

Permanently deletes the user's account and all associated data (contacts, groups, events, settings, storage files). Uses the Supabase admin client.

**Response** `200`:

```json
{ "success": true }
```

## Upload profile photo

```
POST /api/account/photo
Content-Type: multipart/form-data
```

Accepts JPEG, PNG, GIF, or WebP. Max 5 MB.

**Response** `200`:

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://storage.example.com/avatars/user-id/user-id.jpg?t=1234567890"
  }
}
```

## Delete profile photo

```
DELETE /api/account/photo
```

**Response** `200`:

```json
{ "success": true }
```
