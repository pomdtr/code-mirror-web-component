import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ref, createRef } from "lit/directives/ref.js";
import { languages } from "@codemirror/language-data";

@customElement("code-mirror")
export class CodeMirror extends LitElement {
  view: EditorView | null = null;
  editorRef = createRef();
  static styles = css`
    #editor {
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

  @property() language = "javascript";
  @property() code = "";
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

    const updateListener = EditorView.updateListener.of((update) => {
      this.code = update.state.doc.toString();
      const event = new CustomEvent("change", {
        detail: {
          code: this.code,
        },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    });
    extensions.push(updateListener);

    this.view = new EditorView({
      doc: this.code,
      extensions: extensions,
      parent: this.editorRef.value!,
    });
  }

  render() {
    return html`<div id="editor" ${ref(this.editorRef)}></div>`;
  }
}
