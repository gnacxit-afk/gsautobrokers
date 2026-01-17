'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/lead-generation-field-suggestion.ts';
import '@/ai/flows/summarize-knowledge-base-resources.ts';
import '@/ai/flows/summarize-knowledge-base-articles.ts';
import '@/ai/flows/enhance-lead-notes.ts';
import '@/ai/flows/qualify-lead-flow.ts';
import '@/ai/flows/score-application-flow.ts';
import '@/ai/flows/submit-application-flow.ts';
