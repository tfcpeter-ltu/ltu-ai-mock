import {v} from 'convex/values';
export const grammarResult=v.object({engine:v.literal('LanguageTool-selfhost'),engineVersion:v.string(),language:v.string(),matches:v.array(v.object({offset:v.number(),length:v.number(),message:v.string(),ruleId:v.string(),category:v.string(),issueType:v.string(),replacements:v.array(v.string())})),truncated:v.boolean(),band:v.null()});
