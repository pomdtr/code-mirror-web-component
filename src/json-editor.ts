import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";

import { Extension } from "@codemirror/state";
import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ref, createRef } from "lit/directives/ref.js";
import { insertTab, indentLess } from "@codemirror/commands";
import { jsonSchema } from "codemirror-json-schema";

const themes = import.meta.glob(
  "../node_modules/thememirror/dist/themes/*.js"
) as Record<string, () => Promise<Record<string, Extension>>>;
async function getTheme(theme: string) {
  const themeFn = themes[`../node_modules/thememirror/dist/themes/${theme}.js`];
  if (!themeFn) {
    return null;
  }

  const mod = await themeFn();
  return Object.values(mod)[0];
}

@customElement("json-editor")
export class JsonEditor extends LitElement {
  view: EditorView | null = null;
  editorRef = createRef();
  static styles = css`
    :host {
      display: block;
    }

    #root {
      height: 100%;
      width: 100%;
    }

    .cm-editor {
      height: 100%;
      width: 100%;
    }

    .cm-scroller {
      overflow: auto;
    }
  `;

  @property({ type: Object })
  schema = {};
  @property()
  url = "";
  @property()
  code = "";
  @property()
  theme = "";

  protected update(
    changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.update(changedProperties);

    if (this.view && changedProperties.has("code")) {
      const viewCode = this.view?.state.doc.toString();
      if (viewCode === this.code) {
        return;
      }

      this.view.dispatch({
        changes: {
          from: 0,
          to: this.view.state.doc.length,
          insert: this.code,
        },
      });
    }
  }

  protected async firstUpdated() {
    const extensions = [basicSetup];
    if (this.url !== "") {
      const resp = await fetch(this.url);
      const schema = await resp.json();
      extensions.push(jsonSchema(schema));
    } else {
      extensions.push(jsonSchema(this.schema));
    }

    if (this.theme) {
      const theme = await getTheme(this.theme);
      if (theme) {
        extensions.push(theme);
      }
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.code = update.state.doc.toString();
      const event = new CustomEvent("code-change", {
        detail: {
          code: this.code,
        },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    });
    extensions.push(updateListener);
    extensions.push(
      keymap.of([
        {
          key: "Tab",
          preventDefault: true,
          run: insertTab,
        },
        {
          key: "Shift-Tab",
          preventDefault: true,
          run: indentLess,
        },
      ]),
      EditorView.lineWrapping
    );

    this.view = new EditorView({
      doc: this.code,
      extensions,
      parent: this.editorRef.value!,
    });
  }

  render() {
    return html`<div id="root" ${ref(this.editorRef)}></div>`;
  }
}
