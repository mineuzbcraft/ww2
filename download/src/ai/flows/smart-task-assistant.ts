'use server';
/**
 * @fileOverview A smart task assistant that suggests sub-tasks and reminders based on a task description.
 *
 * - suggestSmartTasks - A function that handles the task suggestion process.
 * - SuggestSmartTaskInput - The input type for the suggestSmartTasks function.
 * - SuggestSmartTaskOutput - The return type for the suggestSmartTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSmartTaskInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The main task description for which to suggest sub-tasks and reminders.'),
});
export type SuggestSmartTaskInput = z.infer<typeof SuggestSmartTaskInputSchema>;

const SuggestSmartTaskOutputSchema = z.object({
  subTasks: z.array(z.string()).describe('A list of suggested sub-tasks for the given task.'),
  reminders: z
    .array(z.string())
    .describe('A list of helpful reminders related to the given task.'),
});
export type SuggestSmartTaskOutput = z.infer<typeof SuggestSmartTaskOutputSchema>;

export async function suggestSmartTasks(
  input: SuggestSmartTaskInput
): Promise<SuggestSmartTaskOutput> {
  return smartTaskAssistantFlow(input);
}

const smartTaskAssistantPrompt = ai.definePrompt({
  name: 'smartTaskAssistantPrompt',
  input: {schema: SuggestSmartTaskInputSchema},
  output: {schema: SuggestSmartTaskOutputSchema},
  prompt: `You are a helpful smart task assistant. Based on the following task description, suggest a list of sub-tasks and a list of helpful reminders.
If no sub-tasks or reminders are applicable, return empty arrays.

Task Description: {{{taskDescription}}}`,
});

const smartTaskAssistantFlow = ai.defineFlow(
  {
    name: 'smartTaskAssistantFlow',
    inputSchema: SuggestSmartTaskInputSchema,
    outputSchema: SuggestSmartTaskOutputSchema,
  },
  async input => {
    const {output} = await smartTaskAssistantPrompt(input);
    return output!;
  }
);
