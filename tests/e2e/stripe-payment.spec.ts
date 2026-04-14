import { test, expect, Page } from '@playwright/test';

// Run entire file on Chromium only (Apple/Google Pay need real browser environments)
test.use({ browserName: 'chromium' });

const CARDS = {
  success:  { number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123' },
  declined: { number: '4000 0000 0000 0002', expiry: '12/30', cvc: '123' },
  threeds:  { number: '4000 0025 0000 3155', expiry: '12/30', cvc: '123' },
};

// Use a run-scoped timestamp so idempotency keys never clash between runs
const RUN_ID = Date.now();

function makePendingOrder(suffix: string) {
  return {
    orderId: `test-order-e2e-${RUN_ID}-${suffix}`,
    orderNumber: `LFND-TEST-${suffix}`,
    customerName: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+12125551234',
    cardConfig: { fullName: 'Test User', quantity: 1, baseMaterial: 'pvc', color: 'black', planType: 'pro' },
    // US address — avoids INR exchange rate external API call
    shipping: { addressLine1: '123 Test St', city: 'New York', stateProvince: 'NY', postalCode: '10001', country: 'US' },
    pricing: { materialPrice: 99, subtotal: 99, shipping: 0, tax: 0, total: 99 },
  };
}

async function seedOrder(page: Page, suffix: string) {
  await page.goto('/');
  await page.evaluate((order) => {
    localStorage.setItem('pendingOrder', JSON.stringify(order));
  }, makePendingOrder(suffix));
}

/** Mock /api/process-order so payment tests don't need a real DB order */
async function mockProcessOrder(page: Page) {
  await page.route('/api/process-order', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        order: { id: `mock-order-${RUN_ID}`, orderNumber: 'LFND-MOCK-001' },
      }),
    });
  });
}

async function openModal(page: Page, suffix: string) {
  // Each test should register its own dialog handler before calling openModal.
  // We register a fallback here only if none is registered yet.
  if (page.listenerCount('dialog') === 0) {
    page.on('dialog', async d => d.dismiss());
  }
  await seedOrder(page, suffix);
  await page.goto('/nfc/payment');

  // Should stay on payment page (not redirect to checkout)
  await expect(page).not.toHaveURL(/nfc\/checkout/, { timeout: 8000 });

  // Wait for the Pay button — renders after async page init completes
  const payBtn = page.locator('button', { hasText: /Pay \$/ }).first();
  await expect(payBtn).toBeVisible({ timeout: 20000 });
  await payBtn.click();

  // Wait for Stripe modal
  await expect(page.getByText('Complete Payment')).toBeVisible({ timeout: 15000 });
}

async function fillCard(page: Page, card: typeof CARDS.success) {
  // There are two iframes titled "Secure payment input frame":
  //   1. ExpressCheckoutElement frame  (allow="payment *")
  //   2. PaymentElement card frame     (allow="payment *; publickey-credentials-get *")
  // We need the second one which contains the actual card inputs.
  const frame = page.frameLocator(
    'iframe[title="Secure payment input frame"][allow*="publickey-credentials-get"]'
  );

  // Wait for card number input (fires once PaymentElement is ready)
  const cardNumberInput = frame.locator('input[name="number"]');
  await expect(cardNumberInput).toBeVisible({ timeout: 10000 });

  await cardNumberInput.fill(card.number);
  await frame.locator('input[name="expiry"]').fill(card.expiry);
  await frame.locator('input[name="cvc"]').fill(card.cvc);
}

/** Wait for the Stripe submit button inside the modal to be enabled */
async function waitForSubmitReady(page: Page) {
  // The form submit button has type="submit" and shows "Pay $X.XX" when ready
  const submitBtn = page.locator('button[type="submit"]', { hasText: /Pay \$/ });
  await expect(submitBtn).toBeEnabled({ timeout: 10000 });
  return submitBtn;
}

// ── Group 1: Payment modal ──────────────────────────────────────────────────

test.describe('Stripe Payment Flow', () => {

  test('1. modal opens when Pay is clicked', async ({ page }) => {
    await openModal(page, '001');
    await expect(page.getByText('Complete Payment')).toBeVisible();
    await expect(page.getByText('Secure payment powered by Stripe')).toBeVisible();
  });

  test('2. successful card redirects to /nfc/success', async ({ page }) => {
    test.setTimeout(90000);
    // Mock the process-order API so a fake orderId doesn't block the redirect
    await mockProcessOrder(page);
    await openModal(page, '002');
    await fillCard(page, CARDS.success);
    const submitBtn = await waitForSubmitReady(page);
    await submitBtn.click();
    await expect(page).toHaveURL(/nfc\/success/, { timeout: 60000 });
  });

  test('3. declined card shows error and stays on payment page', async ({ page }) => {
    test.setTimeout(90000);

    // Capture dialogs — Stripe decline error surfaces as an alert
    const dialogs: string[] = [];
    page.on('dialog', async d => {
      dialogs.push(d.message());
      await d.dismiss();
    });

    await openModal(page, '003');
    await fillCard(page, CARDS.declined);
    const submitBtn = await waitForSubmitReady(page);
    await submitBtn.click();

    // Wait for Stripe to process and surface the error (via alert dialog or page element)
    await page.waitForTimeout(20000);

    // User must NOT be on the success page
    await expect(page).not.toHaveURL(/nfc\/success/);

    // An error must have been communicated (alert dialog or visible error text)
    const dialogError = dialogs.some(msg => /declined|failed|error/i.test(msg));
    const pageError = await page.getByText(/declined|failed|error/i).isVisible().catch(() => false);
    expect(dialogError || pageError, `Expected error dialog or page error. Dialogs: ${JSON.stringify(dialogs)}`).toBe(true);
  });

  test('4. 3DS card shows auth challenge then succeeds', async ({ page }) => {
    test.setTimeout(120000);
    await mockProcessOrder(page);
    await openModal(page, '004');
    await fillCard(page, CARDS.threeds);
    const submitBtn = await waitForSubmitReady(page);
    await submitBtn.click();

    // Poll all frames for the Stripe 3DS challenge button.
    // In Stripe test mode the button reads "COMPLETE" (or "Complete authentication").
    const deadline = Date.now() + 40000;
    let done = false;
    while (Date.now() < deadline && !done) {
      for (const frame of page.frames()) {
        try {
          const btn = frame.getByRole('button', { name: /^complete$|complete authentication/i });
          if (await btn.isVisible({ timeout: 500 })) {
            await btn.click();
            done = true;
            break;
          }
        } catch { /* not in this frame */ }
      }
      if (!done) await page.waitForTimeout(500);
    }

    await expect(page).toHaveURL(/nfc\/success/, { timeout: 60000 });
  });

  test('5. Express Checkout area loads with no Stripe JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await openModal(page, '005');
    await page.waitForTimeout(4000);
    const stripeErrors = errors.filter(e => /stripe|payment/i.test(e));
    expect(stripeErrors).toHaveLength(0);
    await expect(page.getByText('Complete Payment')).toBeVisible();
  });
});

// ── Group 2: Legacy redirects ───────────────────────────────────────────────

test.describe('Legacy routes redirect to modern flow', () => {
  test('/confirm-payment → /nfc/payment', async ({ page }) => {
    // Seed localStorage so the payment page doesn't immediately redirect to checkout
    await page.goto('/');
    await page.evaluate((order) => {
      localStorage.setItem('pendingOrder', JSON.stringify(order));
    }, makePendingOrder('legacy-001'));
    await page.goto('/confirm-payment');
    await expect(page).toHaveURL(/nfc\/payment/, { timeout: 10000 });
  });

  test('/checkout → /nfc/checkout', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/nfc\/checkout/, { timeout: 10000 });
  });

  test('/payment → /nfc/payment', async ({ page }) => {
    // Seed localStorage so the payment page doesn't immediately redirect to checkout
    await page.goto('/');
    await page.evaluate((order) => {
      localStorage.setItem('pendingOrder', JSON.stringify(order));
    }, makePendingOrder('legacy-002'));
    await page.goto('/payment');
    await expect(page).toHaveURL(/nfc\/payment/, { timeout: 10000 });
  });

  test('/thank-you → /nfc/success', async ({ page }) => {
    await page.goto('/thank-you');
    await expect(page).toHaveURL(/nfc\/success/, { timeout: 10000 });
  });

  test('/preview → /nfc/configure', async ({ page }) => {
    await page.goto('/preview');
    await expect(page).toHaveURL(/nfc\/configure/, { timeout: 10000 });
  });
});
