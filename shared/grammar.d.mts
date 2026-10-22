export interface GrammarResult {engine:'LanguageTool-selfhost';engineVersion:string;language:string;matches:Array<{offset:number;length:number;message:string;ruleId:string;category:string;issueType:string;replacements:string[]}>;truncated:boolean;band:null}
export function normalizeGrammar(raw:unknown,text:string,language:string):GrammarResult;
