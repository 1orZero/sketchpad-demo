'use server';
/**
 * @fileOverview Provides AI drawing suggestions based on a user's sketch.
 *
 * - suggestDrawing - A function that suggests related drawings.
 * - SuggestDrawingInput - The input type for the suggestDrawing function.
 * - SuggestDrawingOutput - The return type for the suggestDrawing function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestDrawingInputSchema = z.object({
  sketchDescription: z.string().describe('A text description of the current sketch.'),
});
export type SuggestDrawingInput = z.infer<typeof SuggestDrawingInputSchema>;

const SuggestedDrawingSchema = z.object({
  suggestion: z.string().describe('A suggested drawing to add to the sketch.'),
  reason: z.string().describe('The reason why this drawing is suggested.'),
});

const SuggestDrawingOutputSchema = z.array(SuggestedDrawingSchema);
export type SuggestDrawingOutput = z.infer<typeof SuggestDrawingOutputSchema>;

export async function suggestDrawing(input: SuggestDrawingInput): Promise<SuggestDrawingOutput> {
  return suggestDrawingFlow(input);
}

const suggestDrawingPrompt = ai.definePrompt({
  name: 'suggestDrawingPrompt',
  input: {
    schema: z.object({
      sketchDescription: z.string().describe('A text description of the current sketch.'),
    }),
  },
  output: {
    schema: z.array(z.object({
      suggestion: z.string().describe('A suggested drawing to add to the sketch.'),
      reason: z.string().describe('The reason why this drawing is suggested.'),
    })),
  },
  prompt: `You are an AI drawing assistant. Given the description of the user's current sketch, suggest drawings that would complement the sketch.

Sketch Description: {{{sketchDescription}}}

Suggest at least three drawings. For each drawing, explain why it would complement the sketch.

Format your output as a JSON array of objects, where each object has a 'suggestion' and a 'reason' field.`, 
});

const suggestDrawingFlow = ai.defineFlow<
  typeof SuggestDrawingInputSchema,
  typeof SuggestDrawingOutputSchema
>({
  name: 'suggestDrawingFlow',
  inputSchema: SuggestDrawingInputSchema,
  outputSchema: SuggestDrawingOutputSchema,
},
async input => {
  const {output} = await suggestDrawingPrompt(input);
  return output!;
});
