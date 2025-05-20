interface TokenizerConfig {
  vocabSize: number;
  maxLength: number;
  padToken: string;
  unkToken: string;
  specialTokens: string[];
}

export interface ScheduleTokenizer {
  tokenize(text: string): { input_ids: number[]; attention_mask: number[] };
  decode(tokenIds: number[]): string;
}

class ScheduleTokenizerImpl implements ScheduleTokenizer {
  private config: TokenizerConfig;
  private vocab: Map<string, number>;
  private reverseVocab: Map<number, string>;

  constructor() {
    this.config = {
      vocabSize: 30000,
      maxLength: 512,
      padToken: '[PAD]',
      unkToken: '[UNK]',
      specialTokens: ['[CLS]', '[SEP]', '[MASK]', '[PAD]', '[UNK]']
    };

    this.vocab = new Map();
    this.reverseVocab = new Map();
    this.initializeVocab();
  }

  private initializeVocab() {
    // Add special tokens first
    this.config.specialTokens.forEach((token, index) => {
      this.vocab.set(token, index);
      this.reverseVocab.set(index, token);
    });

    // Load vocabulary from pre-trained model (simplified version)
    // In a real implementation, this would load from a vocabulary file
    const commonWords = [
      'Tiết', 'Phòng', 'Môn', 'Giảng', 'viên', 'Nhóm',
      'Thứ', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy',
      'chủ', 'nhật', 'học', 'thực', 'hành', 'lý', 'thuyết'
    ];

    let currentIndex = this.config.specialTokens.length;
    commonWords.forEach(word => {
      if (!this.vocab.has(word)) {
        this.vocab.set(word, currentIndex);
        this.reverseVocab.set(currentIndex, word);
        currentIndex++;
      }
    });
  }

  public tokenize(text: string): { input_ids: number[]; attention_mask: number[] } {
    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    // Split into words
    const words = normalizedText.split(/\s+/);
    
    // Convert to token IDs
    const tokens = ['[CLS]', ...words, '[SEP]'];
    const input_ids = tokens.map(token => 
      this.vocab.has(token) ? this.vocab.get(token)! : this.vocab.get('[UNK]')!
    );
    
    // Pad or truncate to maxLength
    const paddedIds = this.padSequence(input_ids);
    
    // Create attention mask (1 for real tokens, 0 for padding)
    const attention_mask = paddedIds.map(id => 
      id === this.vocab.get('[PAD]')! ? 0 : 1
    );
    
    return {
      input_ids: paddedIds,
      attention_mask
    };
  }

  private padSequence(sequence: number[]): number[] {
    if (sequence.length >= this.config.maxLength) {
      return sequence.slice(0, this.config.maxLength);
    }
    
    const padToken = this.vocab.get('[PAD]')!;
    const padding = Array(this.config.maxLength - sequence.length).fill(padToken);
    return [...sequence, ...padding];
  }

  public decode(tokenIds: number[]): string {
    return tokenIds
      .map(id => this.reverseVocab.get(id) || this.config.unkToken)
      .filter(token => !this.config.specialTokens.includes(token))
      .join(' ');
  }
}

export async function loadTokenizer(): Promise<ScheduleTokenizer> {
  // In a real implementation, this would load a pre-trained tokenizer
  // For now, we return a new instance with basic vocabulary
  return new ScheduleTokenizerImpl();
} 