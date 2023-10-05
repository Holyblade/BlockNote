import { Attribute, Attributes, Node } from "@tiptap/core";
import { BlockNoteDOMAttributes, BlockNoteEditor } from "../../..";
import styles from "../nodes/Block.module.css";
import {
  BlockConfig,
  BlockSchema,
  BlockSpec,
  PropSchema,
  TipTapNode,
  TipTapNodeConfig,
} from "./blockTypes";
import { mergeCSSClasses } from "../../../shared/utils";
import { ParseRule } from "prosemirror-model";

export function camelToDataKebab(str: string): string {
  return "data-" + str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Function that uses the 'propSchema' of a blockConfig to create a TipTap
// node's `addAttributes` property.
export function propsToAttributes<
  BType extends string,
  PSchema extends PropSchema,
  ContainsInlineContent extends boolean,
  BSchema extends BlockSchema
>(
  blockConfig: Omit<
    BlockConfig<BType, PSchema, ContainsInlineContent, BSchema>,
    "render"
  >
): Attributes {
  const tiptapAttributes: Record<string, Attribute> = {};

  Object.entries(blockConfig.propSchema).forEach(([name, spec]) => {
    tiptapAttributes[name] = {
      default: spec.default,
      keepOnSplit: true,
      // Props are displayed in kebab-case as HTML attributes. If a prop's
      // value is the same as its default, we don't display an HTML
      // attribute for it.
      parseHTML: (element) => {
        const value = element.getAttribute(camelToDataKebab(name));

        if (value === null) {
          return null;
        }

        if (typeof spec.default === "boolean") {
          if (value === "true") {
            return true;
          }

          if (value === "false") {
            return false;
          }

          return null;
        }

        if (typeof spec.default === "number") {
          const isNumeric =
            !isNaN(parseFloat(value)) && isFinite(Number(value));

          if (isNumeric) {
            if (value.includes(".")) {
              return parseFloat(value);
            } else {
              return parseInt(value);
            }
          }

          return null;
        }

        return value;
      },
      renderHTML: (attributes) =>
        attributes[name] !== spec.default
          ? {
              [camelToDataKebab(name)]: attributes[name],
            }
          : {},
    };
  });

  return tiptapAttributes;
}

// Function that uses the 'parse' function of a blockConfig to create a
// TipTap node's `parseHTML` property. This is only used for parsing content
// from the clipboard.
export function parse<
  BType extends string,
  PSchema extends PropSchema,
  ContainsInlineContent extends boolean,
  BSchema extends BlockSchema
>(
  blockConfig: Omit<
    BlockConfig<BType, PSchema, ContainsInlineContent, BSchema>,
    "render"
  >
): ParseRule[] {
  return [
    {
      tag: "div[data-content-type=" + blockConfig.type + "]",
    },
  ];
}

// Function that uses the 'render' function of a blockConfig to create a
// TipTap node's `renderHTML` property. Since custom blocks use node views,
// this is only used for serializing content to the clipboard.
export function render<
  BType extends string,
  PSchema extends PropSchema,
  ContainsInlineContent extends boolean,
  BSchema extends BlockSchema
>(
  blockConfig: Omit<
    BlockConfig<BType, PSchema, ContainsInlineContent, BSchema>,
    "render"
  >,
  HTMLAttributes: Record<string, any>
) {
  // Create blockContent element
  const blockContent = document.createElement("div");
  // Add blockContent HTML attribute
  blockContent.setAttribute("data-content-type", blockConfig.type);
  // Add props as HTML attributes in kebab-case with "data-" prefix
  for (const [attribute, value] of Object.entries(HTMLAttributes)) {
    blockContent.setAttribute(attribute, value);
  }

  // TODO: This only works for content copied within BlockNote.
  // Creates contentDOM element to serialize inline content into.
  let contentDOM: HTMLDivElement | undefined;
  if (blockConfig.containsInlineContent) {
    contentDOM = document.createElement("div");
    blockContent.appendChild(contentDOM);
  } else {
    contentDOM = undefined;
  }

  return contentDOM !== undefined
    ? {
        dom: blockContent,
        contentDOM: contentDOM,
      }
    : {
        dom: blockContent,
      };
}

// A function to create custom block for API consumers
// we want to hide the tiptap node from API consumers and provide a simpler API surface instead
export function createBlockSpec<
  BType extends string,
  PSchema extends PropSchema,
  ContainsInlineContent extends false,
  BSchema extends BlockSchema
>(
  blockConfig: BlockConfig<BType, PSchema, ContainsInlineContent, BSchema>
): BlockSpec<BType, PSchema, ContainsInlineContent> {
  const node = createTipTapBlock<
    BType,
    ContainsInlineContent,
    {
      editor: BlockNoteEditor<BSchema>;
      domAttributes?: BlockNoteDOMAttributes;
    }
  >({
    name: blockConfig.type,
    content: (blockConfig.containsInlineContent
      ? "inline*"
      : "") as ContainsInlineContent extends true ? "inline*" : "",
    selectable: true,

    addAttributes() {
      return propsToAttributes(blockConfig);
    },

    parseHTML() {
      return parse(blockConfig);
    },

    renderHTML({ HTMLAttributes }) {
      return render(blockConfig, HTMLAttributes);
    },

    addNodeView() {
      return ({ HTMLAttributes, getPos }) => {
        // Create blockContent element
        const blockContent = document.createElement("div");
        // Add custom HTML attributes
        const blockContentDOMAttributes =
          this.options.domAttributes?.blockContent || {};
        for (const [attribute, value] of Object.entries(
          blockContentDOMAttributes
        )) {
          if (attribute !== "class") {
            blockContent.setAttribute(attribute, value);
          }
        }
        // Set blockContent & custom classes
        blockContent.className = mergeCSSClasses(
          styles.blockContent,
          blockContentDOMAttributes.class
        );
        // Add blockContent HTML attribute
        blockContent.setAttribute("data-content-type", blockConfig.type);
        // Add props as HTML attributes in kebab-case with "data-" prefix
        for (const [attribute, value] of Object.entries(HTMLAttributes)) {
          blockContent.setAttribute(attribute, value);
        }

        // Gets BlockNote editor instance
        const editor = this.options.editor! as BlockNoteEditor<
          BSchema & {
            [k in BType]: BlockSpec<BType, PSchema, ContainsInlineContent>;
          }
        >;
        // Gets position of the node
        if (typeof getPos === "boolean") {
          throw new Error(
            "Cannot find node position as getPos is a boolean, not a function."
          );
        }
        const pos = getPos();
        // Gets TipTap editor instance
        const tipTapEditor = editor._tiptapEditor;
        // Gets parent blockContainer node
        const blockContainer = tipTapEditor.state.doc.resolve(pos!).node();
        // Gets block identifier
        const blockIdentifier = blockContainer.attrs.id;

        // Get the block
        const block = editor.getBlock(blockIdentifier)!;
        if (block.type !== blockConfig.type) {
          throw new Error("Block type does not match");
        }

        // Render elements
        const rendered = blockConfig.render(block as any, editor);
        // Add HTML attributes to contentDOM
        if (blockConfig.containsInlineContent) {
          const contentDOM = (rendered as { contentDOM: HTMLElement })
            .contentDOM;

          const inlineContentDOMAttributes =
            this.options.domAttributes?.inlineContent || {};
          // Add custom HTML attributes
          for (const [attribute, value] of Object.entries(
            inlineContentDOMAttributes
          )) {
            if (attribute !== "class") {
              contentDOM.setAttribute(attribute, value);
            }
          }
          // Merge existing classes with inlineContent & custom classes
          contentDOM.className = mergeCSSClasses(
            contentDOM.className,
            styles.inlineContent,
            inlineContentDOMAttributes.class
          );
        }
        // Add elements to blockContent
        blockContent.appendChild(rendered.dom);

        return "contentDOM" in rendered
          ? {
              dom: blockContent,
              contentDOM: rendered.contentDOM,
              destroy: rendered.destroy,
            }
          : {
              dom: blockContent,
              destroy: rendered.destroy,
            };
      };
    },
  });

  return {
    node: node as TipTapNode<BType, ContainsInlineContent>,
    propSchema: blockConfig.propSchema,
  };
}

export function createTipTapBlock<
  Type extends string,
  ContainsInlineContent extends boolean,
  Options extends {
    domAttributes?: BlockNoteDOMAttributes;
  } = {
    domAttributes?: BlockNoteDOMAttributes;
  },
  Storage = any
>(
  config: TipTapNodeConfig<Type, ContainsInlineContent, Options, Storage>
): TipTapNode<Type, ContainsInlineContent, Options, Storage> {
  // Type cast is needed as Node.name is mutable, though there is basically no
  // reason to change it after creation. Alternative is to wrap Node in a new
  // class, which I don't think is worth it since we'd only be changing 1
  // attribute to be read only.
  return Node.create<Options, Storage>({
    ...config,
    group: "blockContent",
    content: config.content,
  }) as TipTapNode<Type, ContainsInlineContent, Options, Storage>;
}
