# Shinzo Database
The Shinzo application uses a Postgres database to store relevant information related to users and user settings, generations and seeds. This allows the user to be able to manage their generated content effectively.

Unlike the other services, the database is not served via docker container, because there is dangerously little protecting a database docker container from being killed and restarted, essentially destroying all of the data. Instead, there are commands provided to spin up a postgres instance assuming the server uses `Ubuntu`.

## Ubuntu Postgres Installation
Following the steps in [Install and configure PostgeSQL](https://ubuntu.com/server/docs/databases-postgresql)
1. Open template database terminal as `postgres` user:
```
sudo -u postgres psql template1
```

2. Set `postgres` user password:
```
alter user postgres with encrypted password 'postgres';
```

3. Update `pg_hba.conf` to accept connections from all local network IPs and users:
```
sudo sh -c "echo 'host    all             all             0.0.0.0/0               md5' >> /etc/postgresql/12/main/pg_hba.conf"
```

4. Set `listen_addresses` in `postgresql.conf`:
```
vim /etc/postgresql/12/main/postgresql.conf"

(set listen_addresses = '*')
```

5. Restart `postgresql` service to pick up new config:
```
sudo systemctl restart postgresql.service
```

6. Create user:
```
sudo -u postgres createuser shinzo_user
```

7. Create database:
```
sudo -u postgres createdb shinzo_db
```

8. Open `psql` terminal in `shinzo_db` as `postgres` user:
```
sudo -u postgres psql shinzo_db
```

9. Give user password:
```
alter user shinzo_user with encrypted password 'shinzo_user_password';
```

10. Grant all privileges on `shinzo_user` to `shinzo_db`:
```
grant all privileges on database shinzo_db to shinzo_user;
```

11. Add `pgcrypto` extension:
```
create extension pgcrypto;
```

## Database Operations (from root directory)
Migrate database:
```bash
dbmate up
```
Rollback latest migration:
```bash
dbmate down
```
Write `schema.sql`:
```bash
dbmate dump
```
Write new migration:
```bash
dbmate new <migration_name>
```
