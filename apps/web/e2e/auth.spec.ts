// E2E — fluxo de autenticação e isolamento.
// Credenciais de teste via env E2E_EMAIL / E2E_PASSWORD (nunca no código).
import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

test.describe('auth', () => {
  test('rota raiz redireciona para /login sem sessão', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login inválido mostra erro e não entra', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'invalido@teste.local');
    await page.fill('#password', 'senhaerrada123');
    await page.click('button[type="submit"]');
    // permanece em /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('login válido entra no dashboard', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'defina E2E_EMAIL/E2E_PASSWORD');
    await page.goto('/login');
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('isolamento', () => {
  test('API sem token retorna 401', async ({ request }) => {
    const res = await request.get('/api/profiles');
    expect(res.status()).toBe(401);
  });

  test('API com token inválido retorna 401', async ({ request }) => {
    const res = await request.get('/api/profiles', { headers: { authorization: 'Bearer invalido' } });
    expect(res.status()).toBe(401);
  });
});
