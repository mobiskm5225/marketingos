import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../src/core/db';
import { users, groups, userGroups } from '../src/core/db/schema';

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin';

  // Check if user already exists
  const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing) {
    console.log(`User "${username}" already exists — skipping seed.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ username, passwordHash })
    .returning({ id: users.id, username: users.username });

  // Assign to admins group
  const [adminGroup] = await db.select().from(groups).where(eq(groups.name, 'admins')).limit(1);
  if (adminGroup) {
    await db.insert(userGroups).values({ userId: user.id, groupId: adminGroup.id, groupRole: 'manager' });
    console.log(`Created admin user "${username}" and assigned to "admins" group.`);
  } else {
    console.log(`Created admin user "${username}" (no admins group found — run db:migrate first).`);
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
