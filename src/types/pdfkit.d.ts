declare module "pdfkit" {
  type TextOptions = {
    align?: "left" | "center" | "right" | "justify";
    continued?: boolean;
    width?: number;
  };

  type DocumentOptions = {
    layout?: "portrait" | "landscape";
    margin?: number;
    size?: string;
  };

  export default class PDFDocument {
    constructor(options?: DocumentOptions);
    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    image(source: Buffer, x: number, y: number, options?: { width?: number }): this;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    moveDown(lines?: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(color?: string): this;
    fillColor(color: string): this;
    addPage(options?: DocumentOptions): this;
    bufferedPageRange(): { start: number; count: number };
    switchToPage(index: number): this;
    end(): void;
  }
}
