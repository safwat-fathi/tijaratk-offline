interface LLMResponse {
  candidates: Candidate[];
  usageMetadata: UsageMetadata;
  modelVersion: string;
}

interface Candidate {
  content: Content;
  finishReason: string;
  avgLogprobs: number;
}

interface Content {
  parts: Part[];
  role: string;
}

interface Part {
  text: string;
}

interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  promptTokensDetails: TokenDetails[];
  candidatesTokensDetails: TokenDetails[];
}

interface TokenDetails {
  modality: string;
  tokenCount: number;
}

export { Candidate, Content, LLMResponse, Part, TokenDetails, UsageMetadata };
