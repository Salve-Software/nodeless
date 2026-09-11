/** A build error or warning, already structured: file, line and column, never a stack. */
export interface BuildMessage {
  text: string;
  file?: string;
  line?: number;
  column?: number;
  lineText?: string;
  notes?: string[];
}
