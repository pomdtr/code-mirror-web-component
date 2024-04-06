import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";

import { indentLess, insertTab } from "@codemirror/commands";
import { languages } from "@codemirror/language-data";
import { EditorState, Extension, Prec } from "@codemirror/state";
import { LitElement, PropertyValueMap, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";

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
  @property()
  code = "";
  @property() theme = "";
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) modEnter = false;

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

    if (!this.modEnter) {
      extensions.push(
        Prec.highest(
          keymap.of([
            {
              key: "Mod-Enter",
              run: (_: EditorView) => {
                return true;
              },
            },
          ])
        )
      );
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
