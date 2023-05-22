import { expect, test } from "../setup/setupScriptComponent";
import { focusOnEditor } from "../utils/editor";
import { executeSlashCommand } from "../utils/slashmenu";
import { copyPasteAllExternal } from "../utils/copypaste";
import EditorWithTextArea from "../utils/components/EditorWithTextArea";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, testInfo) => {
  testInfo.snapshotSuffix = "";
});

test("Alert Copy/Paste External", async ({ mount, page }) => {
  await mount(<EditorWithTextArea blockTypes={["alert"]} />);

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

  const value = await copyPasteAllExternal(page);
  await expect(value).toMatchSnapshot("alert-external.html");
});

test("Button Copy/Paste External", async ({ mount, page }) => {
  await mount(<EditorWithTextArea blockTypes={["button"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "button");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  const value = await copyPasteAllExternal(page);
  await expect(value).toMatchSnapshot("button-external.html");
});

test("Embed Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<EditorWithTextArea blockTypes={["embed"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "embed");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  const value = await copyPasteAllExternal(page);
  await expect(value).toMatchSnapshot("embed-external.html");
});

test("Image Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<EditorWithTextArea blockTypes={["image"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "image");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Caption");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  const value = await copyPasteAllExternal(page);
  await expect(value).toMatchSnapshot("image-external.html");
});

test("Separator Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<EditorWithTextArea blockTypes={["separator"]} />);

  await focusOnEditor(page);
  await page.keyboard.type("Paragraph 1");
  await executeSlashCommand(page, "separator");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("Paragraph 2");

  const value = await copyPasteAllExternal(page);
  await expect(value).toMatchSnapshot("separator-external.html");
});

test("Table of Contents Copy/Paste Internal", async ({ mount, page }) => {
  await mount(<EditorWithTextArea blockTypes={["toc"]} />);

  await focusOnEditor(page);
  await executeSlashCommand(page, "h1");
  await page.keyboard.type("Heading 1");
  await executeSlashCommand(page, "toc");
  await page.keyboard.press("ArrowDown");
  await executeSlashCommand(page, "h2");
  await page.keyboard.type("Heading 2");

  const value = await copyPasteAllExternal(page);
  await expect(value).toMatchSnapshot("toc-external.html");
});
