import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";

import { EditorState, Extension } from "@codemirror/state";
import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ref, createRef } from "lit/directives/ref.js";
import { insertTab, indentLess } from "@codemirror/commands";
import { languages } from "@codemirror/language-data";

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

@customElement("code-mirror")
export class CodeMirror extends LitElement {
  view: EditorView | null = null;
  editorRef = createRef();
  static styles = css`
    :host {
      display: block;
      overflow: hidden;
      height: 100%;
      width: 100%;
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

  @property() language = "";
  @property() code = "";
  @property() theme = "";
  @property({ type: Boolean }) readOnly = false;

  protected async firstUpdated() {
    const extensions = [basicSetup];
    if (this.language) {
      const language = languages.find((l) => l.alias.includes(this.language));
      if (language) {
        const { extension } = await language.load();
        extensions.push(extension);
      }
    }

    if (this.readOnly) {
      extensions.push(EditorState.readOnly.of(true));
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
      extensions: extensions,
      parent: this.editorRef.value!,
    });
  }

  render() {
    return html`<div id="root" ${ref(this.editorRef)}></div>`;
  }
}
