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
    const language = languages.find((l) => l.alias.includes(this.language));
    if (!language) {
      throw new Error(`Language javascript not found`);
    }

    const { extension } = await language.load();
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

    const extensions = [basicSetup, extension, updateListener];
    if (this.readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }
    this.view = new EditorView({
      doc: this.code,
      extensions: extensions,
      parent: this.editorRef.value!,
    });
  }

  render() {
    return html`<div ${ref(this.editorRef)}></div>`;
  }
}
