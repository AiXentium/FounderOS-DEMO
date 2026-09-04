# G-Brain on Railway

The Railway build now installs the Linux G-Brain binary and configures the app
to use `/app/bin/gbrain`. Add the hosted Postgres/Supabase connection string in
Railway Variables:

```text
GBRAIN_DATABASE_URL=postgresql://...
```

After deploy, verify:

```text
https://os.letstalkmilesandtravel.com/api/brain
https://os.letstalkmilesandtravel.com/api/brain/overview
```

The app intentionally keeps the local markdown fallback if the database is
temporarily unavailable, so agent reads do not fail during a deployment or a
paused database.
