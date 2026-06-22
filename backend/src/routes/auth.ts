import { Router } from 'express';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};

  const validUser = process.env.ADMIN_USERNAME ?? 'admin';
  const validPass = process.env.ADMIN_PASSWORD ?? 'admin';

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  if (username !== validUser || password !== validPass) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ username });
  res.json({ token, user: { username } });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
