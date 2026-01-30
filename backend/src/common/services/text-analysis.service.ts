// import { Injectable, Logger } from '@nestjs/common';
// import { LLMResponse } from 'src/types/text-analysis.interface';

// import CONSTANTS from '../constants';
// import { HttpService } from '../utils/http-service';

// @Injectable()
// export class TextAnalysisService {
//   private readonly logger = new Logger(TextAnalysisService.name);
//   private readonly API_URL = process.env.LLM_API_URL;
//   private readonly API_KEY = process.env.LLM_API_KEY; // Store in env
//   private readonly httpService: HttpService;

//   constructor() {
//     this.httpService = new HttpService({
//       baseUrl: this.API_URL,
//       timeout: 5000, // 5 seconds timeout
//     });
//   }
//   // async analyzeText(text: string): Promise<{
//   //   sentiment: string;
//   //   classification: string;
//   // }> {
//   //   try {
//   //     // Get classification
//   //     const classificationPrompt = `Classify the following text into one of these categories: ${CONSTANTS.CLASSIFICATIONS.join(', ')}. Provide only the category name. Text: "${text}"`;
//   //     const classification = await this.callLLM(classificationPrompt);

//   //     // Get sentiment
//   //     const sentimentPrompt = `Classify the sentiment of the following text as exactly one of these options: ${CONSTANTS.SENTIMENTS.join(', ')}. Provide only the sentiment word. Text: "${text}"`;
//   //     const sentiment = await this.callLLM(sentimentPrompt);

//   //     // Ensure values are valid
//   //     const validClassification = CONSTANTS.CLASSIFICATIONS.includes(
//   //       classification,
//   //     )
//   //       ? classification
//   //       : 'inquiry'; // Default

//   //     const validSentiment = CONSTANTS.SENTIMENTS.includes(sentiment)
//   //       ? sentiment
//   //       : 'neutral'; // Default

//   //     return {
//   //       sentiment: validSentiment,
//   //       classification: validClassification,
//   //     };
//   //   } catch (error) {
//   //     this.logger.error(`Error analyzing text: ${error.message}`, error.stack);
//   //     return {
//   //       sentiment: 'neutral', // Default on error
//   //       classification: 'inquiry', // Default on error
//   //     };
//   //   }
//   // }

//   async analyzeText(text: string): Promise<{
//     sentiment: string;
//     classification: string;
//   }> {
//     try {
//       const combinedPrompt = `Analyze the following text and provide both its sentiment and classification. 
//       Sentiment options: ${CONSTANTS.SENTIMENTS.join(', ')}. 
//       Classification options: ${CONSTANTS.CLASSIFICATIONS.join(', ')}.
      
//       Respond in the following JSON format:
//       {
//         "sentiment": "sentiment_value",
//         "classification": "classification_value"
//       }
      
//       Text: "${text}"`;

//       const response = await this.callLLM(combinedPrompt);

//       try {
//         const parsedResponse = JSON.parse(response);

//         // Ensure values are valid
//         const validClassification = CONSTANTS.CLASSIFICATIONS.includes(
//           parsedResponse.classification,
//         )
//           ? parsedResponse.classification
//           : 'inquiry'; // Default

//         const validSentiment = CONSTANTS.SENTIMENTS.includes(
//           parsedResponse.sentiment,
//         )
//           ? parsedResponse.sentiment
//           : 'neutral'; // Default

//         return {
//           sentiment: validSentiment,
//           classification: validClassification,
//         };
//       } catch (parseError) {
//         this.logger.error(
//           `Error parsing LLM response: ${parseError.message}`,
//           parseError.stack,
//         );
//         return {
//           sentiment: 'neutral', // Default on parse error
//           classification: 'inquiry', // Default on parse error
//         };
//       }
//     } catch (error) {
//       this.logger.error(`Error analyzing text: ${error.message}`, error.stack);
//       return {
//         sentiment: 'neutral', // Default on error
//         classification: 'inquiry', // Default on error
//       };
//     }
//   }

//   // private async callLLM(prompt: string): Promise<string> {
//   //   try {
//   //     const [data, error] = await this.httpService.post<LLMResponse>(
//   //       `?key=${this.API_KEY}`,
//   //       {
//   //         contents: [
//   //           {
//   //             parts: [
//   //               {
//   //                 text: prompt,
//   //               },
//   //             ],
//   //           },
//   //         ],
//   //       },
//   //     );

//   //     if (error) throw error;

//   //     console.log("🚀 ~ :133 ~ TextAnalysisService ~ callLLM ~ data:", data)
//   //     return data.candidates[0].content.parts[0].text.trim().toLowerCase();
//   //   } catch (error) {
//   //     this.logger.error(`LLM API call failed: ${error.message}`, error.stack);
//   //     throw error;
//   //   }
//   // }
//   private async callLLM(prompt: string): Promise<string> {
//     try {
//       const [data, error] = await this.httpService.post<LLMResponse>(
//         `?key=${this.API_KEY}`,
//         {
//           contents: [
//             {
//               parts: [
//                 {
//                   text: prompt,
//                 },
//               ],
//             },
//           ],
//         },
//       );

//       if (error) throw error;

//       if (
//         data &&
//         data.candidates &&
//         data.candidates.length > 0 &&
//         data.candidates[0].content &&
//         data.candidates[0].content.parts &&
//         data.candidates[0].content.parts.length > 0 &&
//         data.candidates[0].content.parts[0].text
//       ) {
//         let jsonString = data.candidates[0].content.parts[0].text.trim();

//         // Remove code block markers if present
//         jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');

//         return jsonString;
//       } else {
//         this.logger.error('LLM API response is missing expected data');
//         throw new Error('LLM API response is missing expected data'); // Or handle default/error
//       }
//     } catch (error) {
//       this.logger.error(`LLM API call failed: ${error.message}`, error.stack);
//       throw error;
//     }
//   }
// }
