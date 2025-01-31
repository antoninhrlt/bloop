import { expect, test } from '@playwright/test';

const REPOS_TO_SYNC = 1;

test.describe.serial('OnBoarding', () => {
  let page; // Share page context between tests

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(
      `http://localhost:5173/?chosen_scan_folder=${process.env.SCAN_FOLDER}`,
    );
  });

  test.afterAll(async ({ browser }) => {
    await browser.close();
  });

  test('Local and GitHub', async () => {
    const repoNames = [];

    await page.getByRole('button', { name: "Don't share" }).click();
    await page.getByPlaceholder('First name').click();
    await page.getByPlaceholder('First name').fill('Steve');
    await page.getByPlaceholder('First name').press('Tab');
    await page.getByRole('button').first().press('Tab');
    await page.getByPlaceholder('Last name').fill('Wozniak');
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('steve@bloop.ai');
    await page.locator('form').getByRole('button').nth(2).click();
    await page.getByPlaceholder('Email address').fill('steve.w@bloop.ai');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Local

    await page.getByRole('button', { name: 'Choose a folder' }).click();
    await page.getByRole('button', { name: 'Sync selected repos' }).click();

    await page.waitForSelector('.bg-skeleton', {
      state: 'detached',
      timeout: 60 * 1000,
    });

    for (let i = 1; i <= REPOS_TO_SYNC; i++) {
      const repo = page.locator(`ul > :nth-match(li, ${i})`);
      repoNames.push(await repo.locator('span').innerText());
      await repo.click();
    }

    await page.getByRole('button', { name: 'Sync repositories' }).click();

    // GitHub login

    await expect(page.locator('.subhead-l > span')).toBeVisible();
    await page.getByRole('button').first().click();
    const [page1] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Connect GitHub' }).click(),
    ]);
    await page1
      .getByLabel('Username or email address')
      .fill(process.env.GITHUB_USER);
    await page1.getByLabel('Password').click();
    await page1.getByLabel('Password').fill(process.env.GITHUB_PASSWORD);
    await page1.getByRole('button', { name: 'Sign in' }).click();

    const githubAuthCode = await page
      .locator('.subhead-l > span')
      .first()
      .innerText();

    for (var i = 0; i < githubAuthCode.length; i++) {
      if (i === 4) continue;
      await page1.locator(`#user-code-${i}`).fill(githubAuthCode[i]);
    }

    await page1.getByRole('button', { name: 'Continue' }).click();
    await page1.getByRole('button', { name: 'Authorize BloopAI' }).click();
    await page1.close();

    await page.getByRole('button', { name: 'Sync selected repos' }).click();

    await page.waitForSelector('.bg-skeleton', {
      state: 'detached',
      timeout: 60 * 1000,
    });

    for (let i = 1; i <= REPOS_TO_SYNC; i++) {
      const repo = page.locator(`ul > :nth-match(li, ${i})`);
      repoNames.push(await repo.locator('span').innerText());
      await repo.click();
    }

    await page.getByRole('button', { name: 'Sync repositories' }).click();

    await Promise.all(
      repoNames.map((repoName) =>
        page.waitForSelector(`p:has-text("${repoName}")`, {
          state: 'attached',
          timeout: 60 * 1000,
        }),
      ),
    );

    await Promise.all(
      repoNames.map((repoName, i) =>
        page
          .locator('.bg-green-500')
          .nth(i)
          .waitFor({ timeout: 60 * 1000 }),
      ),
    );

    await page.evaluate(() => {
      for (i = 0; i < localStorage.length; i++) {
        console.log(
          localStorage.key(i) +
            '=[' +
            localStorage.getItem(localStorage.key(i)) +
            ']',
        );
      }
    });
  });
});
