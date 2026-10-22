import {internalMutation} from './_generated/server';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import {grammarResult} from './grammarValidators';

export const reserve=internalMutation({args:{cacheKey:v.string()},returns:v.union(v.object({cached:v.literal(true),result:grammarResult}),v.object({cached:v.literal(false)})),handler:async(ctx,{cacheKey})=>{
 const userId=await getAuthUserId(ctx);if(!userId)throw Error('Authentication required');
 const row=await ctx.db.query('grammarState').withIndex('by_user',q=>q.eq('userId',userId)).unique(),now=Date.now();
 if(row?.cacheKey===cacheKey&&row.result&&now-(row.cachedAt||0)<7*86400000)return {cached:true as const,result:row.result};
 if(row&&now-row.lastStartedAt<15000)throw Error('請等候 15 秒後再執行文法檢查。');
 const windowStartedAt=row&&now-row.windowStartedAt<60000?row.windowStartedAt:now;
 const windowCount=windowStartedAt===row?.windowStartedAt?row.windowCount+1:1;
 if(windowCount>4)throw Error('本分鐘文法檢查次數已達上限，請稍後再試。');
 const next={lastStartedAt:now,windowStartedAt,windowCount,pendingKey:cacheKey};
 if(row)await ctx.db.patch(row._id,next);else await ctx.db.insert('grammarState',{userId,...next});
 return {cached:false as const};
}});
export const complete=internalMutation({args:{cacheKey:v.string(),result:grammarResult},returns:v.null(),handler:async(ctx,{cacheKey,result})=>{
 const userId=await getAuthUserId(ctx);if(!userId)throw Error('Authentication required');
 const row=await ctx.db.query('grammarState').withIndex('by_user',q=>q.eq('userId',userId)).unique();
 if(row?.pendingKey===cacheKey)await ctx.db.patch(row._id,{cacheKey,result,cachedAt:Date.now()});
 return null;
}});
