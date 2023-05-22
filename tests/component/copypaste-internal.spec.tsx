import { expect, test } from "../setup/setupScriptComponent";
import Editor from "../utils/components/Editor";
import { compareDocToSnapshot, focusOnEditor } from "../utils/editor";
import { executeSlashCommand } from "../utils/slashmenu";
import { copyPasteAll } from "../utils/copypaste";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, testInfo) => {
  testInfo.snapshotSuffix = "";
});

test("Alert Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<Editor blockTypes={["alert"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "alert");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Alert");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  const button = await page.locator(
    `[data-content-type="alert"] > div > div:first-child`
  );
  await button.first().click();

  await copyPasteAll(page);
  await page.waitForTimeout(50);

  await compareDocToSnapshot(page, "alert-internal");
});

test("Button Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<Editor blockTypes={["button"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "button");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  await copyPasteAll(page);
  await page.waitForTimeout(50);

  const button = await page.locator("button");
  await button.first().click();
  await button.last().click();

  await compareDocToSnapshot(page, "button-internal");
});

test("Embed Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<Editor blockTypes={["embed"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "embed");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  await copyPasteAll(page);
  await page.waitForTimeout(50);

  await compareDocToSnapshot(page, "embed-internal");
});

test("Image Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<Editor blockTypes={["image"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "image");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Caption");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  await copyPasteAll(page);
  await page.waitForTimeout(50);

  await compareDocToSnapshot(page, "image-internal");
});

test("Separator Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<Editor blockTypes={["separator"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "separator");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  await copyPasteAll(page);
  await page.waitForTimeout(50);

  await compareDocToSnapshot(page, "separator-internal");
});

test("Table of Contents Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<Editor blockTypes={["toc"]} />);

  await focusOnEditor(page);
  await executeSlashCommand(page, "h1");
  await page.keyboard.type("Heading 1");
  await executeSlashCommand(page, "toc");
  await page.keyboard.press("ArrowDown");
  await executeSlashCommand(page, "h2");
  await page.keyboard.type("Heading 2");

  await copyPasteAll(page);
  await page.waitForTimeout(50);

  const expectedToC =
    "<li><p>Heading 1</p></li><li><p>Heading 2</p></li><li><p>Heading 1</p></li><li><p>Heading 2</p></li>";
  await expect(await page.locator("ol").first().innerHTML()).toEqual(
    expectedToC
  );
  await expect(await page.locator("ol").first().innerHTML()).toEqual(
    await page.locator("ol").last().innerHTML()
  );

  await compareDocToSnapshot(page, "toc-internal");
});
